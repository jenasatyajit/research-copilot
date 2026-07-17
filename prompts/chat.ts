import type { ChatMessageInput } from "@/lib/openrouter"
import { MAX_CONTEXT_CHARS } from "@/lib/constants"
import type { ChatMessage, ExplanationMode, ProcessedPaper } from "@/types"

import { clip, getSystemPrompt, paperHeader } from "./shared"

const CHAT_RULES = [
  "You are answering questions strictly about the paper provided below.",
  "Ground every answer in the paper. If the answer isn't in the paper, say so, then you may add clearly-labelled general context.",
  "When asked about a figure, equation, or table you can't see pixel-perfect, reason from the surrounding text and say what you're inferring.",
  "Use Markdown. Keep answers tight and skimmable. Use math notation ($...$ / $$...$$) when helpful.",
].join(" ")

/**
 * Heuristic to detect whether a user's question is about references,
 * citations, bibliography, or related papers. When true, the references
 * section is appended to the context so the model can answer accurately.
 */
const REFERENCES_QUERY_PATTERN =
  /\b(references?|cit(?:e[ds]?|ation|ing)|bibliography|cited\s+(?:by|in|papers?)|source(?:s)?|what\s+(?:papers?|works?)\s+(?:did|do|does|were|are)\s+(?:they|the\s+authors?)\s+(?:cite|reference|use|mention|rely)|related\s+(?:work|papers?)|prior\s+work)\b/i

function isReferencesQuery(question: string, history: ChatMessage[]): boolean {
  // Check the current question
  if (REFERENCES_QUERY_PATTERN.test(question)) return true
  // Check the last user message for ongoing reference discussion
  const lastUserMsg = [...history].reverse().find((m) => m.role === "user")
  if (lastUserMsg && REFERENCES_QUERY_PATTERN.test(lastUserMsg.content)) {
    return true
  }
  return false
}

/** Max characters to include from references (keeps tokens bounded). */
const MAX_REFERENCES_CHARS = 20_000

export interface ChatPromptOptions {
  paper: ProcessedPaper
  history: ChatMessage[]
  question: string
  mode?: ExplanationMode
  references?: string
}

/** Build chat messages: persona + rules + paper context + prior turns + question. */
export function buildChatMessages(opts: ChatPromptOptions): ChatMessageInput[]
/** @deprecated Use the options object overload. */
export function buildChatMessages(
  paper: ProcessedPaper,
  history: ChatMessage[],
  question: string,
  mode?: ExplanationMode,
  references?: string
): ChatMessageInput[]
export function buildChatMessages(
  paperOrOpts: ProcessedPaper | ChatPromptOptions,
  history?: ChatMessage[],
  question?: string,
  mode?: ExplanationMode,
  references?: string
): ChatMessageInput[] {
  // Normalize to options object
  let opts: ChatPromptOptions
  if ("paper" in paperOrOpts && "question" in paperOrOpts) {
    opts = paperOrOpts as ChatPromptOptions
  } else {
    opts = {
      paper: paperOrOpts as ProcessedPaper,
      history: history!,
      question: question!,
      mode,
      references,
    }
  }

  const { paper, history: hist, question: q, mode: m = "standard", references: refs } = opts

  const contextParts = [
    paperHeader(paper),
    "",
    "PAPER TEXT:",
    clip(paper.fullText, MAX_CONTEXT_CHARS),
  ]

  // Conditionally include references when the question is about citations
  if (refs && isReferencesQuery(q, hist)) {
    contextParts.push(
      "",
      "REFERENCES / BIBLIOGRAPHY:",
      clip(refs, MAX_REFERENCES_CHARS)
    )
  }

  const context = contextParts.join("\n")

  const priorTurns: ChatMessageInput[] = hist
    .filter((msg) => msg.content.trim().length > 0)
    .slice(-10)
    .map((msg) => ({ role: msg.role, content: msg.content }))

  return [
    { role: "system", content: `${getSystemPrompt(m)}\n\n${CHAT_RULES}` },
    { role: "system", content: context },
    ...priorTurns,
    { role: "user", content: q },
  ]
}
