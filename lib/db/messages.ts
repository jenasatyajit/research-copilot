import { db } from "./index"
import type { DBMessageRow } from "./types"
import type { ChatMessage } from "@/types"

/**
 * Gets all messages in a conversation thread in chronological order.
 */
export function getMessages(conversationId: string): ChatMessage[] {
  const rows = db
    .prepare("SELECT id, role, content FROM messages WHERE conversation_id = ? ORDER BY created_at ASC")
    .all(conversationId) as Omit<DBMessageRow, "conversation_id" | "created_at">[]

  return rows.map((row) => ({
    id: row.id,
    role: row.role,
    content: row.content,
  }))
}

/**
 * Adds a new chat message to a conversation thread.
 * Automatically updates the parent conversation's updated_at timestamp.
 */
export function addMessage(
  conversationId: string,
  message: ChatMessage
): void {
  const now = Date.now()

  // Run both operations in a transaction for data consistency
  const insertMessageAndTouchConv = db.transaction(() => {
    db.prepare(`
      INSERT INTO messages (id, conversation_id, role, content, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(message.id, conversationId, message.role, message.content, now)

    db.prepare("UPDATE conversations SET updated_at = ? WHERE id = ?").run(
      now,
      conversationId
    )
  })

  insertMessageAndTouchConv()
}
