import { parseBody, readJson } from "@/lib/api"
import { getCachedArxivId, loadCachedData } from "@/lib/cache"
import { env, hasApiKey } from "@/lib/env"
import { AppError, errorResponse } from "@/lib/errors"
import { streamCompletion, streamToResponse } from "@/lib/openrouter"
import { paperInputSchema } from "@/lib/schemas"
import { buildExplanationMessages } from "@/prompts/explanation"
import type { ProcessedPaper } from "@/types"

export const runtime = "nodejs"
export const maxDuration = 120

export async function POST(req: Request) {
  try {
    const body = await readJson<{ paper?: unknown }>(req)
    const paper = parseBody(paperInputSchema, body.paper) as ProcessedPaper

    const cachedId = getCachedArxivId(paper.arxivId)
    if (cachedId) {
      const cachedText = loadCachedData(cachedId, "explanation.txt")
      if (cachedText) {
        async function* yieldText() {
          yield cachedText
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

    const generator = streamCompletion({
      model: env.smartModel,
      messages: buildExplanationMessages(paper),
      temperature: 0.5,
      maxTokens: 2200,
    })
    return streamToResponse(generator)
  } catch (err) {
    return errorResponse(err)
  }
}
