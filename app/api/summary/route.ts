import { parseBody, readJson } from "@/lib/api"
import { env } from "@/lib/env"
import { errorResponse } from "@/lib/errors"
import { completeJson } from "@/lib/openrouter"
import { paperInputSchema, summarySchema } from "@/lib/schemas"
import { buildSummaryMessages } from "@/prompts/summary"
import type { ProcessedPaper } from "@/types"

export const runtime = "nodejs"
export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const body = await readJson<{ paper?: unknown }>(req)
    const paper = parseBody(paperInputSchema, body.paper) as ProcessedPaper

    const summary = await completeJson(
      { model: env.fastModel, messages: buildSummaryMessages(paper), temperature: 0.3 },
      summarySchema,
    )
    return Response.json({ summary })
  } catch (err) {
    return errorResponse(err)
  }
}
