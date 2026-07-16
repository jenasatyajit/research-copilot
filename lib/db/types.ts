import type { ChatRole, Conversation } from "@/types"

export interface DBPaperRow {
  arxiv_id: string
  title: string
  authors: string // JSON string (string[])
  abstract: string | null
  source: "arxiv" | "pdf"
  source_url: string
  pdf_url: string
  published: string | null
  categories: string | null // JSON string (string[])
  sections: string // JSON string (RawSection[])
  full_text: string
  word_count: number
  created_at: number
  last_accessed_at: number
}

export interface DBGenerationRow {
  id?: number
  paper_id: string
  type: "summary" | "explanation" | "sections" | "concepts" | "mindmap"
  data: string // JSON string or raw text depending on type
  model: string | null
  created_at: number
}

export interface DBConceptDetailRow {
  id?: number
  paper_id: string
  term: string
  data: string // JSON string (ConceptDetail)
  created_at: number
}

export interface DBConversationRow {
  id: string
  paper_id: string
  title: string | null
  created_at: number
  updated_at: number
}

export interface DBMessageRow {
  id: string
  conversation_id: string
  role: ChatRole
  content: string
  created_at: number
}

export interface DBNoteRow {
  paper_id: string
  content: string
  updated_at: number
}

/** Client-friendly Conversation object mapped from the DB row */
export type DBConversation = Conversation
