export type AppErrorCode =
  | "INVALID_URL"
  | "UNSUPPORTED_SOURCE"
  | "DOWNLOAD_FAILED"
  | "EXTRACTION_FAILED"
  | "EMPTY_PAPER"
  | "MISSING_API_KEY"
  | "AI_TIMEOUT"
  | "TOKEN_LIMIT"
  | "AI_ERROR"
  | "BAD_REQUEST"
  | "UNKNOWN"

interface AppErrorOptions {
  /** Suggested recovery action shown to the user. */
  hint?: string
  /** HTTP status for route handler responses. */
  status?: number
  cause?: unknown
}

const DEFAULT_STATUS: Record<AppErrorCode, number> = {
  INVALID_URL: 400,
  UNSUPPORTED_SOURCE: 422,
  DOWNLOAD_FAILED: 502,
  EXTRACTION_FAILED: 422,
  EMPTY_PAPER: 422,
  MISSING_API_KEY: 500,
  AI_TIMEOUT: 504,
  TOKEN_LIMIT: 413,
  AI_ERROR: 502,
  BAD_REQUEST: 400,
  UNKNOWN: 500,
}

/** Default recovery hints, keyed by code. */
const DEFAULT_HINT: Partial<Record<AppErrorCode, string>> = {
  INVALID_URL:
    "Paste a full arXiv link (arxiv.org/abs/...) or a direct PDF URL.",
  UNSUPPORTED_SOURCE:
    "Only arXiv links and direct PDF URLs are supported right now.",
  DOWNLOAD_FAILED: "We couldn't reach that file. Check the link and try again.",
  EXTRACTION_FAILED:
    "We couldn't read text from this PDF. It may be scanned or image-only.",
  EMPTY_PAPER: "This document didn't contain enough readable text to analyze.",
  MISSING_API_KEY:
    "Set OPENROUTER_API_KEY in .env.local, then restart the dev server.",
  AI_TIMEOUT: "The model took too long. Try again in a moment.",
  TOKEN_LIMIT:
    "This paper is very long. Try a shorter paper or a model with a larger context.",
  AI_ERROR: "The AI provider returned an error. Try again shortly.",
}

export class AppError extends Error {
  readonly code: AppErrorCode
  readonly status: number
  readonly hint?: string

  constructor(
    code: AppErrorCode,
    message: string,
    options: AppErrorOptions = {}
  ) {
    super(message, { cause: options.cause })
    this.name = "AppError"
    this.code = code
    this.status = options.status ?? DEFAULT_STATUS[code]
    this.hint = options.hint ?? DEFAULT_HINT[code]
  }

  toResponse(): Response {
    return Response.json(
      { error: { code: this.code, message: this.message, hint: this.hint } },
      { status: this.status }
    )
  }
}

/** Shape returned to the client on error. */
export interface ClientError {
  code: AppErrorCode
  message: string
  hint?: string
}

/** Normalize any thrown value into a Response with a clear client error. */
export function errorResponse(err: unknown): Response {
  if (err instanceof AppError) {
    return err.toResponse()
  }
  if (err instanceof Error && err.name === "MissingApiKeyError") {
    return new AppError("MISSING_API_KEY", err.message).toResponse()
  }
  const message = err instanceof Error ? err.message : "Unexpected error"
  return new AppError("UNKNOWN", message).toResponse()
}
