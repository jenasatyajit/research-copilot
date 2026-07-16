import { errorResponse } from "@/lib/errors"
import { deleteConversation } from "@/lib/db/conversations"

export const runtime = "nodejs"

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (!id) {
      return Response.json({ error: "Missing conversation ID" }, { status: 400 })
    }

    deleteConversation(id)
    return Response.json({ success: true })
  } catch (err) {
    return errorResponse(err)
  }
}
