import { STREAM_ERROR_MARKER } from "./constants"
import type { AppErrorCode, ClientError } from "./errors"

const GENERIC_ERROR: ClientError = {
  code: "UNKNOWN",
  message: "Something went wrong. Please try again.",
}

async function toClientError(res: Response): Promise<ClientError> {
  try {
    const body = await res.json()
    if (body?.error?.code && body?.error?.message) {
      return body.error as ClientError
    }
  } catch {
    // fall through
  }
  return {
    code: "UNKNOWN" as AppErrorCode,
    message: `Request failed (${res.status}).`,
  }
}

/** POST JSON and parse a JSON response, throwing a ClientError on failure. */
export async function postJson<T>(
  path: string,
  body: unknown,
  signal?: AbortSignal
): Promise<T> {
  let res: Response
  try {
    res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    })
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err
    throw GENERIC_ERROR
  }
  if (!res.ok) throw await toClientError(res)
  return (await res.json()) as T
}

export interface StreamHandlers {
  /** Called with each incremental text chunk. */
  onChunk: (chunk: string, full: string) => void
  signal?: AbortSignal
}

/**
 * POST JSON and consume a text/plain stream. Resolves with the full text.
 * Detects the in-band error sentinel and throws a ClientError if present.
 */
export async function streamText(
  path: string,
  body: unknown,
  { onChunk, signal }: StreamHandlers
): Promise<string> {
  let res: Response
  try {
    res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    })
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err
    throw GENERIC_ERROR
  }

  if (!res.ok) throw await toClientError(res)
  if (!res.body) throw GENERIC_ERROR

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let full = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value, { stream: true })
    full += chunk

    const markerIndex = full.indexOf(STREAM_ERROR_MARKER)
    if (markerIndex !== -1) {
      const clean = full.slice(0, markerIndex).trimEnd()
      onChunk("", clean)
      const message = full
        .slice(markerIndex + STREAM_ERROR_MARKER.length)
        .trim()
      throw {
        code: "AI_ERROR" as AppErrorCode,
        message: message || "The AI stream failed.",
      }
    }
    onChunk(chunk, full)
  }

  return full
}
