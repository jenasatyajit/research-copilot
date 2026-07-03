import type { ChatMessageInput } from "@/lib/openrouter"
import { MAX_CONTEXT_CHARS } from "@/lib/constants"
import type { ProcessedPaper } from "@/types"

import { clip, paperHeader, TUTOR_SYSTEM } from "./shared"

/** 30-second summary — six labelled fields, 150–250 words total. */
export function buildSummaryMessages(paper: ProcessedPaper): ChatMessageInput[] {
  const user = [
    paperHeader(paper),
    "",
    "PAPER TEXT:",
    clip(paper.fullText, MAX_CONTEXT_CHARS),
    "",
    "Write a 30-second orientation summary as JSON with exactly these string fields:",
    "- problem: the gap or question the paper addresses",
    "- solution: what the authors actually did",
    "- keyInnovation: the single most important new idea",
    "- results: the headline outcomes (include concrete numbers if the paper gives them)",
    "- whyItMatters: the practical or scientific significance",
    "- shouldYouRead: an honest one-line recommendation on who should read this and why",
    "",
    "Keep the whole thing between 150 and 250 words combined. Plain language.",
    'Return ONLY a JSON object: {"problem","solution","keyInnovation","results","whyItMatters","shouldYouRead"}.',
  ].join("\n")

  return [
    { role: "system", content: TUTOR_SYSTEM },
    { role: "user", content: user },
  ]
}
