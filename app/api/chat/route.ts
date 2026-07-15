import { parseBody, readJson } from "@/lib/api"
import { env, hasApiKey } from "@/lib/env"
import { AppError, errorResponse } from "@/lib/errors"
import { streamCompletion, streamToResponse } from "@/lib/openrouter"
import { paperInputSchema } from "@/lib/schemas"
import { buildChatMessages } from "@/prompts/chat"
import type { ChatMessage, ProcessedPaper } from "@/types"

export const runtime = "nodejs"
export const maxDuration = 120

function coerceHistory(value: unknown): ChatMessage[] {
  if (!Array.isArray(value)) return []
  return value
    .filter(
      (m): m is { role: string; content: string } =>
        !!m &&
        typeof m.content === "string" &&
        (m.role === "user" || m.role === "assistant")
    )
    .map((m, i) => ({
      id: `h-${i}`,
      role: m.role as ChatMessage["role"],
      content: m.content,
    }))
}

export async function POST(req: Request) {
  try {
    if (!hasApiKey()) {
      return new AppError(
        "MISSING_API_KEY",
        "OpenRouter API key is not configured."
      ).toResponse()
    }
    const body = await readJson<{
      paper?: unknown
      history?: unknown
      question?: unknown
    }>(req)
    const paper = parseBody(paperInputSchema, body.paper) as ProcessedPaper
    const question =
      typeof body.question === "string" ? body.question.trim() : ""
    if (!question) {
      throw new AppError("BAD_REQUEST", "Ask a question to continue.")
    }
    const history = coerceHistory(body.history)

    const generator = streamCompletion({
      model: env.smartModel,
      messages: buildChatMessages(paper, history, question),
      temperature: 0.4,
      maxTokens: 1600,
    })
    return streamToResponse(generator)
  } catch (err) {
    return errorResponse(err)
  }
}
