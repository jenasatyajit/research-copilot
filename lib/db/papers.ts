import { db } from "./index"
import type { DBPaperRow } from "./types"
import type { ProcessedPaper, PaperMeta } from "@/types"
import { parseArxivId } from "@/lib/arxiv"
import crypto from "crypto"

/**
 * Computes a stable identifier (key) for a paper based on its arXiv ID or URL.
 */
export function getPaperKey(sourceUrl: string, arxivId?: string): string {
  if (arxivId) return arxivId
  const parsed = parseArxivId(sourceUrl)
  if (parsed) return parsed
  
  // For other PDFs, hash the normalized source URL
  const hash = crypto.createHash("sha256").update(sourceUrl.trim()).digest("hex")
  return `hash-${hash.slice(0, 16)}`
}

/**
 * Finds a processed paper in the database by its key (arxiv_id or URL hash).
 */
export function findPaper(arxivId: string): ProcessedPaper | null {
  const row = db.prepare("SELECT * FROM papers WHERE arxiv_id = ?").get(arxivId) as DBPaperRow | undefined
  if (!row) return null

  return {
    id: row.arxiv_id,
    title: row.title,
    authors: JSON.parse(row.authors),
    abstract: row.abstract || "",
    source: row.source,
    sourceUrl: row.source_url,
    pdfUrl: row.pdf_url,
    arxivId: row.arxiv_id,
    published: row.published || undefined,
    categories: row.categories ? JSON.parse(row.categories) : undefined,
    sections: JSON.parse(row.sections),
    fullText: row.full_text,
    references: row.references_text || undefined,
    wordCount: row.word_count,
  }
}

/**
 * Saves or updates a processed paper in the database.
 */
export function savePaper(paper: ProcessedPaper): void {
  const key = paper.arxivId || getPaperKey(paper.sourceUrl, paper.arxivId)
  const now = Date.now()

  db.prepare(`
    INSERT INTO papers (
      arxiv_id, title, authors, abstract, source, source_url, pdf_url,
      published, categories, sections, full_text, references_text, word_count, created_at, last_accessed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(arxiv_id) DO UPDATE SET
      title = excluded.title,
      authors = excluded.authors,
      abstract = excluded.abstract,
      source = excluded.source,
      source_url = excluded.source_url,
      pdf_url = excluded.pdf_url,
      published = excluded.published,
      categories = excluded.categories,
      sections = excluded.sections,
      full_text = excluded.full_text,
      references_text = excluded.references_text,
      word_count = excluded.word_count,
      last_accessed_at = excluded.last_accessed_at
  `).run(
    key,
    paper.title,
    JSON.stringify(paper.authors),
    paper.abstract,
    paper.source,
    paper.sourceUrl,
    paper.pdfUrl,
    paper.published || null,
    paper.categories ? JSON.stringify(paper.categories) : null,
    JSON.stringify(paper.sections),
    paper.fullText,
    paper.references || null,
    paper.wordCount,
    now,
    now
  )
}

/**
 * Updates the last accessed timestamp for a paper to support LRU eviction.
 */
export function updateLastAccessed(arxivId: string): void {
  db.prepare("UPDATE papers SET last_accessed_at = ? WHERE arxiv_id = ?").run(
    Date.now(),
    arxivId
  )
}

/**
 * Lists the most recently accessed papers metadata.
 */
export function listRecentPapers(limit = 10): PaperMeta[] {
  const rows = db
    .prepare(`
      SELECT arxiv_id, title, authors, abstract, source, source_url, pdf_url, published, categories
      FROM papers
      ORDER BY last_accessed_at DESC
      LIMIT ?
    `)
    .all(limit) as Omit<DBPaperRow, "sections" | "full_text" | "word_count" | "created_at" | "last_accessed_at">[]

  return rows.map((row) => ({
    id: row.arxiv_id,
    title: row.title,
    authors: JSON.parse(row.authors),
    abstract: row.abstract || "",
    source: row.source,
    sourceUrl: row.source_url,
    pdfUrl: row.pdf_url,
    arxivId: row.arxiv_id,
    published: row.published || undefined,
    categories: row.categories ? JSON.parse(row.categories) : undefined,
  }))
}

/**
 * Deletes a paper and all associated cascade records from the database.
 */
export function deletePaper(arxivId: string): void {
  db.prepare("DELETE FROM papers WHERE arxiv_id = ?").run(arxivId)
}

/**
 * Counts the total number of papers cached in the database.
 */
export function countPapers(): number {
  const row = db.prepare("SELECT COUNT(*) as count FROM papers").get() as { count: number } | undefined
  return row ? row.count : 0
}

/**
 * Evicts papers that exceed the maxCount limit, based on LRU (oldest last_accessed_at).
 */
export function evictOldest(maxCount: number): void {
  const count = countPapers()
  if (count <= maxCount) return

  // Fetch arxiv_ids of papers that exceed the max limit (ordered by access time descending)
  // LIMIT -1 OFFSET ? will retrieve all rows except the first `maxCount` most recent rows.
  const rows = db
    .prepare("SELECT arxiv_id FROM papers ORDER BY last_accessed_at DESC LIMIT -1 OFFSET ?")
    .all(maxCount) as { arxiv_id: string }[]

  if (rows.length > 0) {
    const deleteStmt = db.prepare("DELETE FROM papers WHERE arxiv_id = ?")
    // Run deletions in a transaction for efficiency
    const runEvictions = db.transaction(() => {
      for (const row of rows) {
        console.log(`[DB] Evicting oldest paper from cache: ${row.arxiv_id}`)
        deleteStmt.run(row.arxiv_id)
      }
    })
    runEvictions()
  }
}
