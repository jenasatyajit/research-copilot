import { db } from "./index"
import type { DBNoteRow } from "./types"

/**
 * Gets the note content for a specific paper.
 * Returns an empty string if no note exists yet.
 */
export function getNote(paperId: string): string {
  const row = db
    .prepare("SELECT content FROM notes WHERE paper_id = ?")
    .get(paperId) as DBNoteRow | undefined

  return row ? row.content : ""
}

/**
 * Saves or updates note content for a specific paper.
 */
export function saveNote(paperId: string, content: string): void {
  const now = Date.now()

  db.prepare(`
    INSERT INTO notes (paper_id, content, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(paper_id) DO UPDATE SET
      content = excluded.content,
      updated_at = excluded.updated_at
  `).run(paperId, content, now)
}
