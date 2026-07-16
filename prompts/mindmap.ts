import type { ChatMessageInput } from "@/lib/openrouter"
import { MAX_CONTEXT_CHARS } from "@/lib/constants"
import type { ExplanationMode, ProcessedPaper } from "@/types"

import { clip, getSystemPrompt, paperHeader } from "./shared"

/** Generate a Mermaid flowchart capturing the paper's structure. */
export function buildMindMapMessages(
  paper: ProcessedPaper,
  mode: ExplanationMode = "standard"
): ChatMessageInput[] {
  const user = [
    paperHeader(paper),
    "",
    "PAPER TEXT:",
    clip(paper.fullText, MAX_CONTEXT_CHARS),
    "",
    "Produce a Mermaid flowchart that maps how this paper fits together:",
    "the problem, the proposed method and its key components, and the main results.",
    "",
    "Rules:",
    "- Output ONLY valid Mermaid code, nothing else. No prose, no code fences.",
    "- Start with `graph TD`.",
    '- Use short node labels wrapped in double quotes, e.g. A["Self-Attention"].',
    "- 10–18 nodes. Group logically (Problem, Method, Components, Results).",
    "- Use only [A-Za-z0-9] for node IDs. Avoid parentheses and special characters inside labels.",
  ].join("\n")

  return [
    { role: "system", content: getSystemPrompt(mode) },
    { role: "user", content: user },
  ]
}
