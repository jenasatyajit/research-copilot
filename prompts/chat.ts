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

/** Build chat messages: persona + rules + paper context + prior turns + question. */
export function buildChatMessages(
  paper: ProcessedPaper,
  history: ChatMessage[],
  question: string,
  mode: ExplanationMode = "standard"
): ChatMessageInput[] {
  const context = [
    paperHeader(paper),
    "",
    "PAPER TEXT:",
    clip(paper.fullText, MAX_CONTEXT_CHARS),
  ].join("\n")

  const priorTurns: ChatMessageInput[] = history
    .filter((m) => m.content.trim().length > 0)
    .slice(-10)
    .map((m) => ({ role: m.role, content: m.content }))

  return [
    { role: "system", content: `${getSystemPrompt(mode)}\n\n${CHAT_RULES}` },
    { role: "system", content: context },
    ...priorTurns,
    { role: "user", content: question },
  ]
}
