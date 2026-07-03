import type { ChatMessageInput } from "@/lib/openrouter"
import { MAX_CONTEXT_CHARS } from "@/lib/constants"
import type { ProcessedPaper } from "@/types"

import { clip, paperHeader, TUTOR_SYSTEM } from "./shared"

/** 5-minute explanation — streamed long-form markdown for a CS undergraduate. */
export function buildExplanationMessages(paper: ProcessedPaper): ChatMessageInput[] {
  const user = [
    paperHeader(paper),
    "",
    "PAPER TEXT:",
    clip(paper.fullText, MAX_CONTEXT_CHARS),
    "",
    "Write a ~5-minute explanation a computer-science undergraduate could follow end to end.",
    "Use Markdown with these `##` sections, in order:",
    "## Background — the context and what you need to know first",
    "## The Problem — what wasn't working before and why it's hard",
    "## The Method — how the proposed approach works, step by step, with intuition",
    "## Main Findings — what the experiments showed, with concrete numbers when available",
    "## Why It Matters — practical importance and what it unlocks",
    "",
    "Define jargon on first use. Favor intuition over notation. Use short paragraphs and lists.",
    "Do not include a title or a final summary section. Start directly with `## Background`.",
  ].join("\n")

  return [
    { role: "system", content: TUTOR_SYSTEM },
    { role: "user", content: user },
  ]
}
