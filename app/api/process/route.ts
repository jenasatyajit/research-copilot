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
    const { url, paperId } = await readJson<{ url?: string; paperId?: string }>(req)

    let finalUrl = url
    let paperKey = ""

    if (paperId) {
      // 1. Check if the paper exists in the SQLite database
      const dbPaper = findPaper(paperId)
      if (dbPaper) {
        console.log(`[Cache Hit] Serving paper from SQLite by ID: ${paperId}`)
        updateLastAccessed(paperId)
        return Response.json({ paper: dbPaper })
      }

      // 2. Check if it's one of the pre-shipped demo papers
      const cachedId = getCachedArxivId(paperId)
      if (cachedId) {
        const cachedPaper = loadCachedData(cachedId, "process.json")
        if (cachedPaper) {
          cachedPaper.arxivId = cachedId
          if (!findPaper(cachedId)) {
            savePaper(cachedPaper)
            evictOldest(MAX_CACHED_PAPERS)
          } else {
            updateLastAccessed(cachedId)
          }
          return Response.json({ paper: cachedPaper })
        }
      }

      // 3. Fallback: if it looks like an arXiv ID, reconstruct the URL
      if (/^\d{4}\.\d{4,5}(v\d+)?$/.test(paperId)) {
        finalUrl = `https://arxiv.org/abs/${paperId}`
        paperKey = paperId
      } else {
        throw new AppError("BAD_REQUEST", "Paper not found.")
      }
    } else {
      if (!finalUrl || typeof finalUrl !== "string") {
        throw new AppError("INVALID_URL", "Please provide a paper URL.")
      }
      paperKey = getPaperKey(finalUrl)
    }

    // 4. Check pre-shipped file cache for the resolved URL (if not already handled)
    const cachedId = getCachedArxivId(finalUrl)
    if (cachedId) {
      const cachedPaper = loadCachedData(cachedId, "process.json")
      if (cachedPaper) {
        const paperKey = getPaperKey(finalUrl)
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

    // 5. Check SQLite database cache next
    const dbPaper = findPaper(paperKey)
    if (dbPaper) {
      console.log(`[Cache Hit] Serving paper from SQLite: ${paperKey}`)
      updateLastAccessed(paperKey)
      return Response.json({ paper: dbPaper })
    }

    // 6. Process paper and save to cache
    console.log(`[Cache Miss] Processing paper: ${finalUrl || paperKey}`)
    if (!finalUrl) {
      throw new AppError("INVALID_URL", "Invalid paper URL.")
    }
    const paper = await processPaper(finalUrl)

    // Override paper.arxivId to be our stable key so client sends it for future generations
    paper.arxivId = paperKey

    savePaper(paper)
    evictOldest(MAX_CACHED_PAPERS)

    return Response.json({ paper })
  } catch (err) {
    return errorResponse(err)
  }
}
