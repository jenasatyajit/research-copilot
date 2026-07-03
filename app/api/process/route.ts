import { readJson } from "@/lib/api"
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
    const paper = await processPaper(url)
    return Response.json({ paper })
  } catch (err) {
    return errorResponse(err)
  }
}
