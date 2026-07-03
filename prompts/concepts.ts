import type { ChatMessageInput } from "@/lib/openrouter"
import { MAX_CONTEXT_CHARS } from "@/lib/constants"
import type { ProcessedPaper } from "@/types"

import { clip, paperHeader, TUTOR_SYSTEM } from "./shared"

/** Extract the technical concepts a reader is most likely to need explained. */
export function buildConceptsMessages(paper: ProcessedPaper): ChatMessageInput[] {
  const user = [
    paperHeader(paper),
    "",
    "PAPER TEXT:",
    clip(paper.fullText, MAX_CONTEXT_CHARS),
    "",
    "Identify the 6–12 technical concepts, methods, or terms a reader most needs to understand",
    "to follow THIS paper. Prefer concepts central to the paper over generic background.",
    "",
    'Return ONLY JSON: {"concepts": [{ "term", "short" }]}.',
    "- term: the concept name (2–5 words)",
    "- short: a single clear sentence teasing what it is, in this paper's context",
    "Order them by importance to understanding the paper.",
  ].join("\n")

  return [
    { role: "system", content: TUTOR_SYSTEM },
    { role: "user", content: user },
  ]
}
