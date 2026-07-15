import "server-only"

import type { ProcessedPaper } from "@/types"

import {
  buildArxivAbsUrl,
  buildArxivPdfUrl,
  fetchArxivMetadata,
  parseArxivId,
} from "./arxiv"
import { MAX_CONTEXT_CHARS } from "./constants"
import { AppError } from "./errors"
import { downloadPdf, extractPdfText } from "./pdf"
import { detectSections } from "./sections"

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

/** Guess a title from the first lines of extracted text (PDF without metadata). */
function guessTitle(text: string): string {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
  for (const line of lines.slice(0, 8)) {
    if (line.length >= 12 && line.length <= 160 && /[a-z]/.test(line)) {
      return line.replace(/\s+/g, " ")
    }
  }
  return "Untitled paper"
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length
}

/**
 * Full processing pipeline: resolve source → download → extract → detect
 * sections → assemble a ProcessedPaper. Throws typed AppErrors on failure.
 */
export async function processPaper(rawInput: string): Promise<ProcessedPaper> {
  const input = rawInput.trim()
  if (!input) {
    throw new AppError(
      "INVALID_URL",
      "Please paste an arXiv link or a PDF URL."
    )
  }

  const arxivId = parseArxivId(input)
  const isArxiv = arxivId !== null
  if (!isArxiv && !isHttpUrl(input)) {
    throw new AppError("INVALID_URL", "That doesn't look like a valid URL.")
  }

  const pdfUrl = isArxiv ? buildArxivPdfUrl(arxivId) : input
  const bytes = await downloadPdf(pdfUrl)
  const fullText = await extractPdfText(bytes)
  const sections = detectSections(fullText)

  let title = guessTitle(fullText)
  let authors: string[] = []
  let abstract = ""
  let published: string | undefined
  let categories: string[] | undefined
  let sourceUrl = input

  if (isArxiv) {
    try {
      const meta = await fetchArxivMetadata(arxivId)
      title = meta.title || title
      authors = meta.authors
      abstract = meta.abstract
      published = meta.published
      categories = meta.categories
      sourceUrl = buildArxivAbsUrl(arxivId)
    } catch {
      // Metadata is best-effort; extraction already succeeded.
    }
  }

  if (!abstract) {
    const abstractSection = sections.find((s) => /abstract/i.test(s.title))
    abstract = abstractSection?.content.slice(0, 1500) ?? ""
  }

  return {
    id: arxivId ?? `pdf-${Date.now()}`,
    title,
    authors,
    abstract,
    source: isArxiv ? "arxiv" : "pdf",
    sourceUrl,
    pdfUrl,
    arxivId: arxivId ?? undefined,
    published,
    categories,
    sections,
    fullText: fullText.slice(0, MAX_CONTEXT_CHARS),
    wordCount: countWords(fullText),
  }
}
