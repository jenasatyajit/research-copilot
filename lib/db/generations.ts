import { db } from "./index"
import type { DBGenerationRow } from "./types"

/**
 * Finds a cached LLM generation by paper ID and generation type.
 * Returns the raw string (which can be a JSON string or raw text depending on the type).
 */
export function findGeneration(paperId: string, type: string): string | null {
  const row = db
    .prepare("SELECT data FROM generations WHERE paper_id = ? AND type = ?")
    .get(paperId, type) as DBGenerationRow | undefined

  return row ? row.data : null
}

/**
 * Saves or updates a cached LLM generation for a paper.
 */
export function saveGeneration(
  paperId: string,
  type: string,
  data: string,
  model?: string
): void {
  const now = Date.now()

  db.prepare(`
    INSERT INTO generations (paper_id, type, data, model, created_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(paper_id, type) DO UPDATE SET
      data = excluded.data,
      model = excluded.model,
      created_at = excluded.created_at
  `).run(paperId, type, data, model || null, now)
}
