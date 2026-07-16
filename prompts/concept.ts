import type { ChatMessageInput } from "@/lib/openrouter"
import type { ExplanationMode, ProcessedPaper } from "@/types"

import { clip, getSystemPrompt, paperHeader } from "./shared"

/** Deep explanation of a single concept, grounded in this paper. */
export function buildConceptMessages(
  paper: Pick<ProcessedPaper, "title" | "authors" | "abstract" | "fullText">,
  term: string,
  mode: ExplanationMode = "standard"
): ChatMessageInput[] {
  const user = [
    paperHeader(paper),
    "",
    "RELEVANT PAPER TEXT:",
    clip(paper.fullText, 40_000),
    "",
    `Explain the concept "${term}" for someone reading this paper.`,
    "",
    'Return ONLY JSON with these fields: {"definition","simpleExplanation","analogy","whyUsedHere","prerequisites","related"}.',
    "- definition: a precise one-sentence definition",
    "- simpleExplanation: 2–3 sentences in plain language, no jargon",
    "- analogy: a concrete everyday analogy that builds intuition",
    "- whyUsedHere: how/why this concept is used specifically in THIS paper",
    "- prerequisites: array of 2–4 concepts to understand first (strings)",
    "- related: array of 2–4 related concepts worth exploring next (strings)",
  ].join("\n")

  return [
    { role: "system", content: getSystemPrompt(mode) },
    { role: "user", content: user },
  ]
}
