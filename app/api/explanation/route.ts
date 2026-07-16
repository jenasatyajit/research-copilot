import { parseBody, readJson } from "@/lib/api"
import { getCachedArxivId, loadCachedData } from "@/lib/cache"
import { env, hasApiKey } from "@/lib/env"
import { AppError, errorResponse } from "@/lib/errors"
import { streamCompletion, streamToResponse } from "@/lib/openrouter"
import { paperInputSchema } from "@/lib/schemas"
import { buildExplanationMessages } from "@/prompts/explanation"
import type { ExplanationMode, ProcessedPaper } from "@/types"
import { findGeneration, saveGeneration } from "@/lib/db/generations"

export const runtime = "nodejs"
export const maxDuration = 120

export async function POST(req: Request) {
  try {
    const body = await readJson<{ paper?: unknown; mode?: unknown }>(req)
    const paper = parseBody(paperInputSchema, body.paper) as ProcessedPaper
    const mode = (body.mode === "learning" ? "learning" : "standard") as ExplanationMode
    const paperId = paper.arxivId || paper.id || ""

    // 1. Check pre-shipped file cache (for demo papers)
    const cachedId = getCachedArxivId(paperId)
    if (cachedId) {
      const cachedText = loadCachedData(cachedId, "explanation.txt")
      if (cachedText) {
        async function* yieldText() {
          yield cachedText
        }
        return streamToResponse(yieldText())
      }
    }

    // 2. Check SQLite database cache next
    if (paperId) {
      const dbExplanation = findGeneration(paperId, "explanation")
      if (dbExplanation) {
        const cachedExplanationText = dbExplanation
        console.log(`[Cache Hit] Serving explanation from SQLite for paper: ${paperId}`)
        async function* yieldText() {
          yield cachedExplanationText
        }
        return streamToResponse(yieldText())
      }
    }

    if (!hasApiKey()) {
      return new AppError(
        "MISSING_API_KEY",
        "OpenRouter API key is not configured."
      ).toResponse()
    }

    // 3. Generate stream and cache on successful completion
    console.log(`[Cache Miss] Generating explanation for paper: ${paperId}`)
    const generator = streamCompletion({
      model: env.smartModel,
      messages: buildExplanationMessages(paper, mode),
      temperature: 0.5,
      maxTokens: 2200,
    })

    async function* accumulateAndStream(gen: AsyncGenerator<string, void, unknown>) {
      let fullText = ""
      for await (const chunk of gen) {
        fullText += chunk
        yield chunk
      }
      if (paperId) {
        try {
          saveGeneration(paperId, "explanation", fullText, env.smartModel)
          console.log(`[Cache Write] Saved explanation to SQLite for paper: ${paperId}`)
        } catch (dbErr) {
          console.error(`[DB Error] Failed to cache explanation for paper ${paperId}:`, dbErr)
        }
      }
    }

    return streamToResponse(accumulateAndStream(generator))
  } catch (err) {
    return errorResponse(err)
  }
}
