import path from "path"

import { parseBody, readJson } from "@/lib/api"
import { getCachedArxivId, loadCachedData } from "@/lib/cache"
import { env } from "@/lib/env"
import { AppError, errorResponse } from "@/lib/errors"
import { completeJson } from "@/lib/openrouter"
import { conceptDetailSchema, paperInputSchema } from "@/lib/schemas"
import { buildConceptMessages } from "@/prompts/concept"
import type { ConceptDetail, ProcessedPaper } from "@/types"
import { findConceptDetail, saveConceptDetail } from "@/lib/db/concepts"

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
    const paperId = paper.arxivId || paper.id || ""

    // 1. Check pre-shipped file cache (for demo papers)
    const cachedId = getCachedArxivId(paperId)
    if (cachedId) {
      const slug = term
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .trim()
      const cachedConcept = loadCachedData(
        cachedId,
        path.join("concepts", `${slug}.json`)
      )
      if (cachedConcept) {
        return Response.json(cachedConcept)
      }
    }

    // 2. Check SQLite database cache next
    if (paperId) {
      const dbConcept = findConceptDetail(paperId, term)
      if (dbConcept) {
        console.log(`[Cache Hit] Serving concept detail (${term}) from SQLite for paper: ${paperId}`)
        return Response.json({ concept: dbConcept })
      }
    }

    // 3. Generate and cache
    console.log(`[Cache Miss] Generating concept detail (${term}) for paper: ${paperId}`)
    const detail = await completeJson(
      {
        model: env.smartModel,
        messages: buildConceptMessages(paper, term),
        temperature: 0.4,
      },
      conceptDetailSchema
    )

    const result: ConceptDetail = { term, ...detail }
    if (paperId) {
      saveConceptDetail(paperId, term, result)
    }

    return Response.json({ concept: result })
  } catch (err) {
    return errorResponse(err)
  }
}
