import { errorResponse } from "@/lib/errors"
import { listRecentPapers } from "@/lib/db/papers"

export const runtime = "nodejs"

export async function GET() {
  try {
    const papers = listRecentPapers(10)
    return Response.json({ papers })
  } catch (err) {
    return errorResponse(err)
  }
}
