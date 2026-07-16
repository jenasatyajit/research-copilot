-- Papers table: stores processed paper metadata and full text
CREATE TABLE IF NOT EXISTS papers (
  arxiv_id TEXT PRIMARY KEY,          -- arXiv ID or URL hash
  title TEXT NOT NULL,
  authors TEXT NOT NULL,              -- JSON array of strings
  abstract TEXT,
  source TEXT NOT NULL,               -- 'arxiv' | 'pdf'
  source_url TEXT NOT NULL,
  pdf_url TEXT NOT NULL,
  published TEXT,
  categories TEXT,                    -- JSON array of strings
  sections TEXT NOT NULL,             -- JSON array of RawSection[]
  full_text TEXT NOT NULL,
  word_count INTEGER NOT NULL,
  created_at INTEGER NOT NULL,        -- Unix timestamp (ms)
  last_accessed_at INTEGER NOT NULL   -- Unix timestamp (ms)
);

-- Generated outputs: one row per paper per generation type (summary, explanation, sections, etc.)
CREATE TABLE IF NOT EXISTS generations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  paper_id TEXT NOT NULL REFERENCES papers(arxiv_id) ON DELETE CASCADE,
  type TEXT NOT NULL,                 -- 'summary' | 'explanation' | 'sections' | 'concepts' | 'mindmap'
  data TEXT NOT NULL,                 -- JSON string or raw text depending on type
  model TEXT,                         -- model slug used to generate
  created_at INTEGER NOT NULL,        -- Unix timestamp (ms)
  UNIQUE(paper_id, type)
);

-- Concept details: per-paper, per-term deep-dives
CREATE TABLE IF NOT EXISTS concept_details (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  paper_id TEXT NOT NULL REFERENCES papers(arxiv_id) ON DELETE CASCADE,
  term TEXT NOT NULL,
  data TEXT NOT NULL,                 -- JSON string (ConceptDetail)
  created_at INTEGER NOT NULL,        -- Unix timestamp (ms)
  UNIQUE(paper_id, term)
);

-- Chat conversations: multiple threads per paper
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,                -- UUID / unique string
  paper_id TEXT NOT NULL REFERENCES papers(arxiv_id) ON DELETE CASCADE,
  title TEXT,                         -- Conversation title (e.g. from first message)
  created_at INTEGER NOT NULL,        -- Unix timestamp (ms)
  updated_at INTEGER NOT NULL         -- Unix timestamp (ms)
);

-- Chat messages: belonging to a conversation thread
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,                -- UUID / unique string
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,                 -- 'user' | 'assistant'
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL        -- Unix timestamp (ms)
);

-- User notes: single notes draft per paper
CREATE TABLE IF NOT EXISTS notes (
  paper_id TEXT PRIMARY KEY REFERENCES papers(arxiv_id) ON DELETE CASCADE,
  content TEXT NOT NULL DEFAULT '',
  updated_at INTEGER NOT NULL         -- Unix timestamp (ms)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_generations_paper ON generations(paper_id);
CREATE INDEX IF NOT EXISTS idx_concept_details_paper ON concept_details(paper_id);
CREATE INDEX IF NOT EXISTS idx_conversations_paper ON conversations(paper_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_papers_last_accessed ON papers(last_accessed_at DESC);
