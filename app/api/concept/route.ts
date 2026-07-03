import { parseBody, readJson } from "@/lib/api"
import { env } from "@/lib/env"
import { AppError, errorResponse } from "@/lib/errors"
import { completeJson } from "@/lib/openrouter"
import { conceptDetailSchema, paperInputSchema } from "@/lib/schemas"
import { buildConceptMessages } from "@/prompts/concept"
import type { ConceptDetail, ProcessedPaper } from "@/types"

export const runtime = "nodejs"
export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const body = await readJson<{ paper?: unknown; term?: unknown }>(req)
    const paper = parseBody(paperInputSchema, body.paper) as ProcessedPaper
    const term = typeof body.term === "string" ? body.term.trim() : ""
    if (!term) {
      throw new AppError("BAD_REQUEST", "A concept term is required.")
    }

    const detail = await completeJson(
      { model: env.smartModel, messages: buildConceptMessages(paper, term), temperature: 0.4 },
      conceptDetailSchema,
    )

    const result: ConceptDetail = { term, ...detail }
    return Response.json({ concept: result })
  } catch (err) {
    return errorResponse(err)
  }
}
