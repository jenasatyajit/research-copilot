import "server-only"

/**
 * Server-only environment + model configuration.
 *
 * OpenRouter is OpenAI-compatible; the only thing that changes between models
 * is the slug. Both models are overridable via env so you can tune cost/quality
 * without touching code. Browse slugs at https://openrouter.ai/models.
 */

function required(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new MissingApiKeyError(name)
  }
  return value
}

export class MissingApiKeyError extends Error {
  constructor(name: string) {
    super(`Missing required environment variable: ${name}`)
    this.name = "MissingApiKeyError"
  }
}

export const env = {
  get openRouterApiKey() {
    return required("OPENROUTER_API_KEY")
  },
  openRouterBaseUrl:
    process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1",
  /** Fast / cheap model: summaries, section explanations, concept extraction. */
  fastModel: process.env.OPENROUTER_FAST_MODEL ?? "google/gemini-2.5-flash",
  /** Strong reasoning model: 5-min explanation, concept detail, chat, mind map. */
  smartModel: process.env.OPENROUTER_SMART_MODEL ?? "anthropic/claude-sonnet-4",
  /** Sent to OpenRouter for attribution (optional but recommended). */
  appUrl: process.env.OPENROUTER_APP_URL ?? "http://localhost:3000",
  appName: process.env.OPENROUTER_APP_NAME ?? "Research Copilot",
} as const

export function hasApiKey(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY)
}
