import type { RawSection } from "@/types"

/** Common top-level section names found in research papers. */
const KEYWORD_HEADINGS = [
  "abstract",
  "introduction",
  "background",
  "related work",
  "preliminaries",
  "motivation",
  "problem statement",
  "method",
  "methods",
  "methodology",
  "approach",
  "model",
  "architecture",
  "experiments",
  "experimental setup",
  "evaluation",
  "results",
  "analysis",
  "ablation",
  "discussion",
  "limitations",
  "future work",
  "conclusion",
  "conclusions",
  "acknowledgments",
  "acknowledgements",
  "references",
  "appendix",
]

const NUMBERED = /^(?:(\d{1,2}(?:\.\d{1,2}){0,2})\.?|([IVXLCDM]+)\.|([A-Z])\.)\s+([A-Za-z].{0,75})$/
const KEYWORD = new RegExp(`^(${KEYWORD_HEADINGS.join("|")})\\b[:.]?\\s*$`, "i")

function slugify(value: string, index: number): string {
  const base = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
  return `${index}-${base || "section"}`
}

function isHeading(line: string): boolean {
  const trimmed = line.trim()
  if (trimmed.length < 3 || trimmed.length > 80) return false
  if (NUMBERED.test(trimmed)) return true
  if (KEYWORD.test(trimmed)) return true
  return false
}

function titleCase(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase())
}

/**
 * Detect sections from cleaned paper text using heading heuristics.
 * Falls back to a single section when structure can't be recovered.
 */
export function detectSections(fullText: string): RawSection[] {
  const lines = fullText.split("\n")
  const markers: { title: string; lineIndex: number }[] = []

  for (let i = 0; i < lines.length; i++) {
    if (isHeading(lines[i])) {
      markers.push({ title: lines[i].trim(), lineIndex: i })
    }
  }

  if (markers.length < 3) {
    return [
      {
        id: slugify("full-paper", 0),
        title: "Full paper",
        content: fullText,
      },
    ]
  }

  const sections: RawSection[] = []
  for (let m = 0; m < markers.length; m++) {
    const start = markers[m].lineIndex + 1
    const end = m + 1 < markers.length ? markers[m + 1].lineIndex : lines.length
    const content = lines.slice(start, end).join("\n").trim()
    if (content.length < 40) continue // skip empty / heading-only blocks
    sections.push({
      id: slugify(markers[m].title, m),
      title: titleCase(markers[m].title),
      content,
    })
  }

  return sections.length >= 2
    ? sections
    : [{ id: slugify("full-paper", 0), title: "Full paper", content: fullText }]
}
