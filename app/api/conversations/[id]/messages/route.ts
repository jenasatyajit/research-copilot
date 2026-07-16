import { errorResponse } from "@/lib/errors"
import { getMessages } from "@/lib/db/messages"

export const runtime = "nodejs"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (!id) {
      return Response.json({ error: "Missing conversation ID" }, { status: 400 })
    }

    const messages = getMessages(id)
    return Response.json({ messages })
  } catch (err) {
    return errorResponse(err)
  }
}
