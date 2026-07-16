import { db } from "./index"
import type { DBConceptDetailRow } from "./types"
import type { ConceptDetail } from "@/types"

/**
 * Finds a cached concept deep-dive detail by paper ID and term name.
 */
export function findConceptDetail(
  paperId: string,
  term: string
): ConceptDetail | null {
  const row = db
    .prepare("SELECT data FROM concept_details WHERE paper_id = ? AND term = ?")
    .get(paperId, term) as DBConceptDetailRow | undefined

  return row ? JSON.parse(row.data) : null
}

/**
 * Saves or updates a cached concept deep-dive detail for a paper.
 */
export function saveConceptDetail(
  paperId: string,
  term: string,
  data: ConceptDetail
): void {
  const now = Date.now()

  db.prepare(`
    INSERT INTO concept_details (paper_id, term, data, created_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(paper_id, term) DO UPDATE SET
      data = excluded.data,
      created_at = excluded.created_at
  `).run(paperId, term, JSON.stringify(data), now)
}
