import { db } from "./index"
import type { DBConversationRow, DBConversation } from "./types"
import { randomUUID } from "crypto"

/**
 * Lists all conversations (threads) associated with a paper, ordered by last update first.
 */
export function listConversations(paperId: string): DBConversation[] {
  const rows = db
    .prepare("SELECT * FROM conversations WHERE paper_id = ? ORDER BY updated_at DESC")
    .all(paperId) as DBConversationRow[]

  return rows.map((row) => ({
    id: row.id,
    paperId: row.paper_id,
    title: row.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }))
}

/**
 * Creates a new conversation thread for a paper.
 */
export function createConversation(
  paperId: string,
  title?: string
): DBConversation {
  const id = randomUUID()
  const now = Date.now()
  const convTitle = title || "New Conversation"

  db.prepare(`
    INSERT INTO conversations (id, paper_id, title, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, paperId, convTitle, now, now)

  return {
    id,
    paperId,
    title: convTitle,
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * Updates the title of a conversation thread.
 */
export function updateConversationTitle(id: string, title: string): void {
  db.prepare("UPDATE conversations SET title = ?, updated_at = ? WHERE id = ?").run(
    title,
    Date.now(),
    id
  )
}

/**
 * Deletes a conversation thread and all its messages (via ON DELETE CASCADE).
 */
export function deleteConversation(id: string): void {
  db.prepare("DELETE FROM conversations WHERE id = ?").run(id)
}
