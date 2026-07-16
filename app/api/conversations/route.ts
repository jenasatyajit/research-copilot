import { readJson } from "@/lib/api"
import { errorResponse } from "@/lib/errors"
import { listConversations, createConversation } from "@/lib/db/conversations"

export const runtime = "nodejs"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const paperId = searchParams.get("paperId")
    if (!paperId) {
      return Response.json({ conversations: [] })
    }

    const conversations = listConversations(paperId)
    return Response.json({ conversations })
  } catch (err) {
    return errorResponse(err)
  }
}

export async function POST(req: Request) {
  try {
    const { paperId, title } = await readJson<{ paperId?: string; title?: string }>(req)
    if (!paperId) {
      return Response.json({ error: "Missing paperId" }, { status: 400 })
    }

    const conversation = createConversation(paperId, title)
    return Response.json({ conversation })
  } catch (err) {
    return errorResponse(err)
  }
}
