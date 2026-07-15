import type { ProcessedPaper } from "@/types"

/** Shared tutor persona used across all prompt modules. */
export const TUTOR_SYSTEM = [
  "You are Research Copilot, an expert research tutor.",
  "Your single goal is to help the reader genuinely understand a paper, not just summarize it.",
  "Write for a sharp computer-science undergraduate: clear, direct, and concrete.",
  "Explain jargon the first time it appears. Prefer intuition and concrete examples over restating the abstract.",
  "Never invent results, numbers, or citations. If something isn't in the paper, say so plainly.",
  "Be concise. No filler, no hype, no 'in conclusion'.",
].join(" ")

/** Truncate text to a character budget, on a word boundary. */
export function clip(text: string, max: number): string {
  if (text.length <= max) return text
  const slice = text.slice(0, max)
  const lastSpace = slice.lastIndexOf(" ")
  return `${slice.slice(0, lastSpace > 0 ? lastSpace : max)}…`
}

/** Compact header describing the paper for prompt context. */
export function paperHeader(
  paper: Pick<ProcessedPaper, "title" | "authors" | "abstract">
): string {
  const authors = paper.authors.length
    ? paper.authors.slice(0, 8).join(", ") +
      (paper.authors.length > 8 ? " et al." : "")
    : "Unknown authors"
  const parts = [`Title: ${paper.title}`, `Authors: ${authors}`]
  if (paper.abstract) parts.push(`Abstract: ${clip(paper.abstract, 1500)}`)
  return parts.join("\n")
}
