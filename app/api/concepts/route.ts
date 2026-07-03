import { parseBody, readJson } from "@/lib/api"
import { env } from "@/lib/env"
import { errorResponse } from "@/lib/errors"
import { completeJson } from "@/lib/openrouter"
import { conceptsResponseSchema, paperInputSchema } from "@/lib/schemas"
import { buildConceptsMessages } from "@/prompts/concepts"
import type { ConceptRef, ProcessedPaper } from "@/types"

export const runtime = "nodejs"
export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const body = await readJson<{ paper?: unknown }>(req)
    const paper = parseBody(paperInputSchema, body.paper) as ProcessedPaper

    const result = await completeJson(
      { model: env.fastModel, messages: buildConceptsMessages(paper), temperature: 0.3 },
      conceptsResponseSchema,
    )

    const concepts: ConceptRef[] = result.concepts.map((c, i) => ({
      id: `concept-${i}`,
      term: c.term,
      short: c.short,
    }))

    return Response.json({ concepts })
  } catch (err) {
    return errorResponse(err)
  }
}
