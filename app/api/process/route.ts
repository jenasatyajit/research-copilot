import { readJson } from "@/lib/api"
import { getCachedArxivId, loadCachedData } from "@/lib/cache"
import { AppError, errorResponse } from "@/lib/errors"
import { processPaper } from "@/lib/fetch-paper"
import { getPaperKey, findPaper, savePaper, updateLastAccessed, evictOldest } from "@/lib/db/papers"

export const runtime = "nodejs"
export const maxDuration = 60

const MAX_CACHED_PAPERS = process.env.MAX_CACHED_PAPERS
  ? parseInt(process.env.MAX_CACHED_PAPERS, 10)
  : 100

export async function POST(req: Request) {
  try {
    const { url } = await readJson<{ url?: string }>(req)
    if (!url || typeof url !== "string") {
      throw new AppError("INVALID_URL", "Please provide a paper URL.")
    }

    // 1. Check pre-shipped file cache first (for the 3 demo papers)
    const cachedId = getCachedArxivId(url)
    if (cachedId) {
      const cachedPaper = loadCachedData(cachedId, "process.json")
      if (cachedPaper) {
        const paperKey = getPaperKey(url)
        cachedPaper.arxivId = paperKey
        // Ensure the pre-shipped paper is saved in the SQLite DB so that
        // foreign key references (conversations, notes) work correctly.
        if (!findPaper(paperKey)) {
          savePaper(cachedPaper)
          evictOldest(MAX_CACHED_PAPERS)
        } else {
          updateLastAccessed(paperKey)
        }
        return Response.json({ paper: cachedPaper })
      }
    }

    // 2. Check SQLite database cache next
    const paperKey = getPaperKey(url)
    const dbPaper = findPaper(paperKey)
    if (dbPaper) {
      console.log(`[Cache Hit] Serving paper from SQLite: ${paperKey}`)
      updateLastAccessed(paperKey)
      return Response.json({ paper: dbPaper })
    }

    // 3. Process paper and save to cache
    console.log(`[Cache Miss] Processing paper: ${url}`)
    const paper = await processPaper(url)

    // Override paper.arxivId to be our stable key so client sends it for future generations
    paper.arxivId = paperKey

    savePaper(paper)
    evictOldest(MAX_CACHED_PAPERS)

    return Response.json({ paper })
  } catch (err) {
    return errorResponse(err)
  }
}
