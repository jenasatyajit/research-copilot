export type PaperSource = "arxiv" | "pdf"

export interface RawSection {
  /** Stable slug id, unique within the paper. */
  id: string
  /** Original section heading as it appears in the paper. */
  title: string
  /** Cleaned original text belonging to this section. */
  content: string
}

export interface PaperMeta {
  id: string
  title: string
  authors: string[]
  abstract: string
  source: PaperSource
  /** The URL the user originally pasted. */
  sourceUrl: string
  /** The resolved direct PDF URL that was downloaded. */
  pdfUrl: string
  arxivId?: string
  published?: string
  categories?: string[]
}

export interface ProcessedPaper extends PaperMeta {
  sections: RawSection[]
  /** Full cleaned text of the paper, used as AI context. */
  fullText: string
  wordCount: number
}
