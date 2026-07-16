import { parseBody, readJson } from "@/lib/api"
import { env, hasApiKey } from "@/lib/env"
import { AppError, errorResponse } from "@/lib/errors"
import { streamCompletion, streamToResponse } from "@/lib/openrouter"
import { paperInputSchema } from "@/lib/schemas"
import { buildChatMessages } from "@/prompts/chat"
import type { ChatMessage, ProcessedPaper } from "@/types"
import { addMessage } from "@/lib/db/messages"
import crypto from "crypto"

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
      conversationId?: string
      userMessageId?: string
      assistantMessageId?: string
    }>(req)
    const paper = parseBody(paperInputSchema, body.paper) as ProcessedPaper
    const question =
      typeof body.question === "string" ? body.question.trim() : ""
    if (!question) {
      throw new AppError("BAD_REQUEST", "Ask a question to continue.")
    }
    const history = coerceHistory(body.history)
    const conversationId = body.conversationId
    const userMessageId = body.userMessageId || crypto.randomUUID()
    const assistantMessageId = body.assistantMessageId || crypto.randomUUID()

    // 1. If inside a saved conversation, persist user's query
    if (conversationId) {
      try {
        addMessage(conversationId, {
          id: userMessageId,
          role: "user",
          content: question,
        })
      } catch (dbErr) {
        console.error(`[DB Error] Failed to persist user chat message for conversation ${conversationId}:`, dbErr)
      }
    }

    const generator = streamCompletion({
      model: env.smartModel,
      messages: buildChatMessages(paper, history, question),
      temperature: 0.4,
      maxTokens: 1600,
    })

    // 2. Wrap generator to accumulate assistant response and save to DB
    async function* accumulateAndStream(gen: AsyncGenerator<string, void, unknown>) {
      let fullText = ""
      for await (const chunk of gen) {
        fullText += chunk
        yield chunk
      }
      if (conversationId) {
        try {
          addMessage(conversationId, {
            id: assistantMessageId,
            role: "assistant",
            content: fullText,
          })
          console.log(`[Cache Write] Persisted assistant chat message for conversation ${conversationId}`)
        } catch (dbErr) {
          console.error(`[DB Error] Failed to persist assistant chat message for conversation ${conversationId}:`, dbErr)
        }
      }
    }

    return streamToResponse(accumulateAndStream(generator))
  } catch (err) {
    return errorResponse(err)
  }
}
