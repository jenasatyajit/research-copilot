import { readJson } from "@/lib/api"
import { errorResponse } from "@/lib/errors"
import { getNote, saveNote } from "@/lib/db/notes"

export const runtime = "nodejs"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const paperId = searchParams.get("paperId")
    if (!paperId) {
      return Response.json({ content: "" })
    }

    const content = getNote(paperId)
    return Response.json({ content })
  } catch (err) {
    return errorResponse(err)
  }
}

export async function PUT(req: Request) {
  try {
    const { paperId, content } = await readJson<{ paperId?: string; content?: string }>(req)
    if (!paperId) {
      return Response.json({ error: "Missing paperId" }, { status: 400 })
    }

    saveNote(paperId, content ?? "")
    return Response.json({ success: true })
  } catch (err) {
    return errorResponse(err)
  }
}
