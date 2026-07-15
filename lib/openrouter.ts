import "server-only"

import type { z } from "zod"

import { STREAM_ERROR_MARKER } from "./constants"
import { env } from "./env"
import { AppError } from "./errors"

export interface ChatMessageInput {
  role: "system" | "user" | "assistant"
  content: string
}

interface CompletionOptions {
  model: string
  messages: ChatMessageInput[]
  temperature?: number
  maxTokens?: number
  /** Request strict JSON output (OpenAI-compatible json_object mode). */
  json?: boolean
  /** Abort/timeout signal. */
  signal?: AbortSignal
}

const DEFAULT_TIMEOUT_MS = 90_000

function buildHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${env.openRouterApiKey}`,
    "Content-Type": "application/json",
    "HTTP-Referer": env.appUrl,
    "X-Title": env.appName,
  }
}

function buildBody(opts: CompletionOptions, stream: boolean) {
  return JSON.stringify({
    model: opts.model,
    messages: opts.messages,
    temperature: opts.temperature ?? 0.4,
    max_tokens: opts.maxTokens,
    stream,
    ...(opts.json ? { response_format: { type: "json_object" } } : {}),
  })
}

/** Combine an external signal with an internal timeout. */
function withTimeout(signal?: AbortSignal, ms = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController()
  const timeout = setTimeout(
    () => controller.abort(new DOMException("timeout", "TimeoutError")),
    ms
  )
  if (signal) {
    if (signal.aborted) controller.abort(signal.reason)
    else
      signal.addEventListener("abort", () => controller.abort(signal.reason), {
        once: true,
      })
  }
  return { signal: controller.signal, clear: () => clearTimeout(timeout) }
}

async function mapHttpError(res: Response): Promise<never> {
  let detail = ""
  try {
    const body = await res.json()
    detail = body?.error?.message ?? JSON.stringify(body)
  } catch {
    detail = await res.text().catch(() => "")
  }
  const lower = detail.toLowerCase()
  if (res.status === 401 || res.status === 403) {
    throw new AppError("MISSING_API_KEY", "OpenRouter rejected the API key.", {
      hint: "Check OPENROUTER_API_KEY in .env.local is valid and has credit.",
    })
  }
  if (
    lower.includes("context") &&
    (lower.includes("length") || lower.includes("token"))
  ) {
    throw new AppError(
      "TOKEN_LIMIT",
      "The paper exceeded the model's context window."
    )
  }
  if (res.status === 429) {
    throw new AppError("AI_ERROR", "Rate limited by the AI provider.", {
      hint: "Wait a moment and try again.",
    })
  }
  throw new AppError("AI_ERROR", detail || `AI provider error (${res.status}).`)
}

function mapAbortError(err: unknown): never {
  if (
    err instanceof DOMException &&
    (err.name === "TimeoutError" || err.name === "AbortError")
  ) {
    throw new AppError("AI_TIMEOUT", "The model took too long to respond.")
  }
  if (err instanceof AppError) throw err
  if (err instanceof Error && err.name === "MissingApiKeyError") {
    throw new AppError("MISSING_API_KEY", err.message)
  }
  throw new AppError(
    "AI_ERROR",
    err instanceof Error ? err.message : "AI request failed."
  )
}

/** Non-streaming completion. Returns the full assistant text. */
export async function complete(opts: CompletionOptions): Promise<string> {
  const { signal, clear } = withTimeout(opts.signal)
  try {
    const res = await fetch(`${env.openRouterBaseUrl}/chat/completions`, {
      method: "POST",
      headers: buildHeaders(),
      body: buildBody(opts, false),
      signal,
    })
    if (!res.ok) await mapHttpError(res)
    const data = await res.json()
    const text: string = data?.choices?.[0]?.message?.content ?? ""
    if (!text.trim()) {
      throw new AppError("AI_ERROR", "The model returned an empty response.")
    }
    return text
  } catch (err) {
    mapAbortError(err)
  } finally {
    clear()
  }
}

/** Strip markdown fences and isolate the outermost JSON value. */
function extractJson(text: string): string {
  let t = text.trim()
  const fence = t.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)
  if (fence) t = fence[1].trim()
  const firstObj = t.indexOf("{")
  const firstArr = t.indexOf("[")
  const start =
    firstArr === -1
      ? firstObj
      : firstObj === -1
        ? firstArr
        : Math.min(firstObj, firstArr)
  if (start > 0) t = t.slice(start)
  const lastObj = t.lastIndexOf("}")
  const lastArr = t.lastIndexOf("]")
  const end = Math.max(lastObj, lastArr)
  if (end !== -1 && end < t.length - 1) t = t.slice(0, end + 1)
  return t
}

/** Completion validated against a Zod schema. */
export async function completeJson<T>(
  opts: Omit<CompletionOptions, "json">,
  schema: z.ZodType<T>
): Promise<T> {
  const raw = await complete({ ...opts, json: true })
  let parsed: unknown
  try {
    parsed = JSON.parse(extractJson(raw))
  } catch {
    throw new AppError("AI_ERROR", "The model returned malformed JSON.", {
      hint: "Try again — this is usually transient.",
    })
  }
  const result = schema.safeParse(parsed)
  if (!result.success) {
    throw new AppError(
      "AI_ERROR",
      "The model response didn't match the expected shape.",
      {
        hint: "Try again — this is usually transient.",
      }
    )
  }
  return result.data
}

/** Streaming completion. Yields text deltas as they arrive. */
export async function* streamCompletion(
  opts: CompletionOptions
): AsyncGenerator<string, void, unknown> {
  const { signal, clear } = withTimeout(opts.signal)
  try {
    const res = await fetch(`${env.openRouterBaseUrl}/chat/completions`, {
      method: "POST",
      headers: buildHeaders(),
      body: buildBody(opts, true),
      signal,
    })
    if (!res.ok) await mapHttpError(res)
    if (!res.body)
      throw new AppError("AI_ERROR", "No response stream from AI provider.")

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ""

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })

      let newlineIndex: number
      while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, newlineIndex).trim()
        buffer = buffer.slice(newlineIndex + 1)
        if (!line || line.startsWith(":")) continue // keep-alive comment
        if (!line.startsWith("data:")) continue
        const payload = line.slice(5).trim()
        if (payload === "[DONE]") return
        try {
          const json = JSON.parse(payload)
          const delta: string = json?.choices?.[0]?.delta?.content ?? ""
          if (delta) yield delta
        } catch {
          // ignore partial/invalid SSE fragments
        }
      }
    }
  } catch (err) {
    mapAbortError(err)
  } finally {
    clear()
  }
}

/** Wrap a text generator into a streaming HTTP Response (text/plain). */
export function streamToResponse(generator: AsyncGenerator<string>): Response {
  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { value, done } = await generator.next()
        if (done) {
          controller.close()
          return
        }
        controller.enqueue(encoder.encode(value))
      } catch (err) {
        // Surface a readable error into the stream, then close.
        const message =
          err instanceof AppError
            ? err.message
            : "The AI stream failed unexpectedly."
        controller.enqueue(
          encoder.encode(`\n\n${STREAM_ERROR_MARKER} ${message}`)
        )
        controller.close()
      }
    },
  })
  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  })
}
