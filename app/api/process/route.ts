import { readJson } from "@/lib/api"
import { getCachedArxivId, loadCachedData } from "@/lib/cache"
import { AppError, errorResponse } from "@/lib/errors"
import { processPaper } from "@/lib/fetch-paper"

export const runtime = "nodejs"
export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const { url } = await readJson<{ url?: string }>(req)
    if (!url || typeof url !== "string") {
      throw new AppError("INVALID_URL", "Please provide a paper URL.")
    }

    const cachedId = getCachedArxivId(url)
    if (cachedId) {
      const cachedPaper = loadCachedData(cachedId, "process.json")
      if (cachedPaper) {
        return Response.json({ paper: cachedPaper })
      }
    }

    const paper = await processPaper(url)
    return Response.json({ paper })
  } catch (err) {
    return errorResponse(err)
  }
}
