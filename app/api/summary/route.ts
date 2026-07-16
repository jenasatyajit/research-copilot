import { parseBody, readJson } from "@/lib/api"
import { getCachedArxivId, loadCachedData } from "@/lib/cache"
import { env } from "@/lib/env"
import { errorResponse } from "@/lib/errors"
import { completeJson } from "@/lib/openrouter"
import { paperInputSchema, summarySchema } from "@/lib/schemas"
import { buildSummaryMessages } from "@/prompts/summary"
import type { ProcessedPaper } from "@/types"
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
      const cachedSummary = loadCachedData(cachedId, "summary.json")
      if (cachedSummary) {
        return Response.json(cachedSummary)
      }
    }

    // 2. Check SQLite database cache next
    if (paperId) {
      const dbSummary = findGeneration(paperId, "summary")
      if (dbSummary) {
        console.log(`[Cache Hit] Serving summary from SQLite for paper: ${paperId}`)
        return Response.json(JSON.parse(dbSummary))
      }
    }

    // 3. Generate and cache
    console.log(`[Cache Miss] Generating summary for paper: ${paperId}`)
    const summary = await completeJson(
      {
        model: env.fastModel,
        messages: buildSummaryMessages(paper),
        temperature: 0.3,
      },
      summarySchema
    )

    const responsePayload = { summary }
    if (paperId) {
      saveGeneration(paperId, "summary", JSON.stringify(responsePayload), env.fastModel)
    }

    return Response.json(responsePayload)
  } catch (err) {
    return errorResponse(err)
  }
}
