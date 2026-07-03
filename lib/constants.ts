/** Shared, non-secret app constants (safe for client + server). */

export const APP_NAME = "Research Copilot"
export const APP_TAGLINE = "Understand any paper in under 10 minutes."

/**
 * Upper bound on characters of paper text sent to the model as context.
 * Keeps requests inside token limits; ~120k chars ≈ 30k tokens.
 */
export const MAX_CONTEXT_CHARS = 120_000

/** Sentinel written into a streaming response when the AI stream fails midway. */
export const STREAM_ERROR_MARKER = "[[STREAM_ERROR]]"

/** Example papers shown on the home screen. */
export const EXAMPLE_PAPERS: ReadonlyArray<{
  title: string
  authors: string
  url: string
  tag: string
}> = [
  {
    title: "Attention Is All You Need",
    authors: "Vaswani et al.",
    url: "https://arxiv.org/abs/1706.03762",
    tag: "Transformers",
  },
  {
    title: "BERT: Pre-training of Deep Bidirectional Transformers",
    authors: "Devlin et al.",
    url: "https://arxiv.org/abs/1810.04805",
    tag: "NLP",
  },
  {
    title: "Deep Residual Learning for Image Recognition",
    authors: "He et al.",
    url: "https://arxiv.org/abs/1512.03385",
    tag: "Vision",
  },
]
