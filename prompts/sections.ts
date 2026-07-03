import type { ChatMessageInput } from "@/lib/openrouter"
import type { ProcessedPaper, RawSection } from "@/types"

import { clip, paperHeader, TUTOR_SYSTEM } from "./shared"

const SKIP = /(references|bibliography|acknowledg|appendix)/i
const MAX_SECTIONS = 12
const PER_SECTION_CHARS = 1800

/** Sections worth explaining (skips references/appendix/acknowledgments). */
export function explainableSections(sections: RawSection[]): RawSection[] {
  return sections.filter((s) => !SKIP.test(s.title)).slice(0, MAX_SECTIONS)
}

/** Section-by-section explanations as a JSON array keyed by sectionId. */
export function buildSectionsMessages(
  paper: Pick<ProcessedPaper, "title" | "authors" | "abstract">,
  sections: RawSection[],
): ChatMessageInput[] {
  const sectionBlocks = sections
    .map(
      (s) =>
        `### sectionId: ${s.id}\nHeading: ${s.title}\nText: ${clip(s.content, PER_SECTION_CHARS)}`,
    )
    .join("\n\n")

  const user = [
    paperHeader(paper),
    "",
    "Below are the paper's sections. For EACH one, write a plain-English explanation.",
    "",
    sectionBlocks,
    "",
    'Return ONLY JSON: {"sections": [{ "sectionId", "explanation", "keyTakeaway", "whyItMatters" }]}.',
    "- sectionId: copy the exact sectionId given above",
    "- explanation: 2–4 sentences in plain English (what this section says and means)",
    "- keyTakeaway: one sentence — the single thing to remember",
    "- whyItMatters: one sentence — why this section exists in the paper",
    "Include one entry per section, in the same order.",
  ].join("\n")

  return [
    { role: "system", content: TUTOR_SYSTEM },
    { role: "user", content: user },
  ]
}
