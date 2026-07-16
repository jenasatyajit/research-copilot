import { parseBody, readJson } from "@/lib/api"
import { getCachedArxivId, loadCachedData } from "@/lib/cache"
import { env } from "@/lib/env"
import { errorResponse } from "@/lib/errors"
import { completeJson } from "@/lib/openrouter"
import { conceptsResponseSchema, paperInputSchema } from "@/lib/schemas"
import { buildConceptsMessages } from "@/prompts/concepts"
import type { ConceptRef, ProcessedPaper } from "@/types"
import { findGeneration, saveGeneration } from "@/lib/db/generations"

export const runtime = "nodejs"
export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const body = await readJson<{ paper?: unknown }>(req)
    const paper = parseBody(paperInputSchema, body.paper) as ProcessedPaper
    const paperId = paper.arxivId || paper.id || ""

    // 1. Check pre-shipped file cache (for demo papers)
    const cachedId = getCachedArxivId(paperId)
    if (cachedId) {
      const cachedConcepts = loadCachedData(cachedId, "concepts.json")
      if (cachedConcepts) {
        return Response.json(cachedConcepts)
      }
    }

    // 2. Check SQLite database cache next
    if (paperId) {
      const dbConcepts = findGeneration(paperId, "concepts")
      if (dbConcepts) {
        console.log(`[Cache Hit] Serving concepts from SQLite for paper: ${paperId}`)
        return Response.json(JSON.parse(dbConcepts))
      }
    }

    // 3. Generate and cache
    console.log(`[Cache Miss] Generating concepts for paper: ${paperId}`)
    const result = await completeJson(
      {
        model: env.fastModel,
        messages: buildConceptsMessages(paper),
        temperature: 0.3,
      },
      conceptsResponseSchema
    )

    const concepts: ConceptRef[] = result.concepts.map((c, i) => ({
      id: `concept-${i}`,
      term: c.term,
      short: c.short,
    }))

    const responsePayload = { concepts }
    if (paperId) {
      saveGeneration(paperId, "concepts", JSON.stringify(responsePayload), env.fastModel)
    }

    return Response.json(responsePayload)
  } catch (err) {
    return errorResponse(err)
  }
}
