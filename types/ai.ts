/** Explanation depth mode — controls system prompt tone and detail level. */
export type ExplanationMode = "standard" | "learning"

/** 30-second summary — scannable, labelled fields (150–250 words total). */
export interface PaperSummary {
  problem: string
  solution: string
  keyInnovation: string
  results: string
  whyItMatters: string
  /** Honest "should I read this?" recommendation. */
  shouldYouRead: string
}

/** Plain-English explanation of a single detected section. */
export interface SectionExplanation {
  sectionId: string
  title: string
  /** Markdown, plain-English explanation. */
  explanation: string
  keyTakeaway: string
  whyItMatters: string
}

/** Lightweight concept reference shown in the workspace list. */
export interface ConceptRef {
  id: string
  term: string
  /** One-line teaser. */
  short: string
}

/** Full concept detail shown in the side panel when a concept is opened. */
export interface ConceptDetail {
  term: string
  definition: string
  simpleExplanation: string
  analogy: string
  whyUsedHere: string
  prerequisites: string[]
  related: string[]
}

export type ChatRole = "user" | "assistant"

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
}

export interface Conversation {
  id: string
  paperId: string
  title: string | null
  createdAt: number
  updatedAt: number
}
