# SQLite Persistence Layer — Implementation Plan

## Context

The app currently holds all session data (paper metadata, LLM-generated outputs, chat history, concept details, mind maps) in React state that is lost on page refresh. The only persistence is:
- Pre-shipped file cache for 3 demo papers (`lib/data/cached/`)
- User notes in browser localStorage

This plan adds a **SQLite database** on the server so that:
- Revisiting a previously-analyzed paper skips all LLM calls
- Chat conversations persist across sessions (multiple threads per paper)
- User notes are centralized server-side
- "Recently viewed" papers can be listed

### Deployment

- Single-user, self-hosted via Docker (run locally)
- SQLite file stored as a Docker volume for persistence across container restarts

### Keying Strategy

- Papers are keyed by **arXiv ID** when available, otherwise by a normalized URL hash
- This means submitting the same paper URL twice will hit the cache

---

## Constraints

1. **SQLite only** — no external DB service; the `.db` file lives on the Docker volume
2. **Single-user** — no auth, no user isolation, flat data model
3. **No ORM overhead** — use `better-sqlite3` directly (synchronous, fast, zero-config) with a thin DAO layer
4. **Backward compatible** — existing API routes continue to work; the DB layer is an optimization added beneath them
5. **Graceful degradation** — if the DB file is missing/corrupt, the app should still function (just re-generates everything)
6. **Docker-friendly** — DB file path configurable via env var, defaults to `./data/research-copilot.db`
7. **Migration system** — simple versioned SQL scripts so schema can evolve
8. **No breaking API changes** — client code stays the same; caching is transparent to the frontend

---

## Schema Design

### Tables

```sql
-- Papers table: stores processed paper data
CREATE TABLE papers (
  arxiv_id TEXT PRIMARY KEY,          -- arXiv ID or URL hash
  title TEXT NOT NULL,
  authors TEXT NOT NULL,              -- JSON array
  abstract TEXT,
  source TEXT NOT NULL,               -- 'arxiv' | 'pdf'
  source_url TEXT NOT NULL,
  pdf_url TEXT NOT NULL,
  published TEXT,
  categories TEXT,                    -- JSON array
  sections TEXT NOT NULL,             -- JSON array of RawSection[]
  full_text TEXT NOT NULL,
  word_count INTEGER NOT NULL,
  created_at INTEGER NOT NULL,        -- Unix timestamp
  last_accessed_at INTEGER NOT NULL   -- Unix timestamp (for eviction/sorting)
);

-- Generated outputs: one row per paper per generation type
CREATE TABLE generations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  paper_id TEXT NOT NULL REFERENCES papers(arxiv_id) ON DELETE CASCADE,
  type TEXT NOT NULL,                 -- 'summary' | 'explanation' | 'sections' | 'concepts' | 'mindmap'
  data TEXT NOT NULL,                 -- JSON string (summary/sections/concepts) or raw text (explanation/mindmap)
  model TEXT,                         -- model slug used to generate
  created_at INTEGER NOT NULL,
  UNIQUE(paper_id, type)
);

-- Concept details: per-paper, per-term
CREATE TABLE concept_details (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  paper_id TEXT NOT NULL REFERENCES papers(arxiv_id) ON DELETE CASCADE,
  term TEXT NOT NULL,
  data TEXT NOT NULL,                 -- JSON (ConceptDetail)
  created_at INTEGER NOT NULL,
  UNIQUE(paper_id, term)
);

-- Chat conversations: multiple threads per paper
CREATE TABLE conversations (
  id TEXT PRIMARY KEY,                -- UUID
  paper_id TEXT NOT NULL REFERENCES papers(arxiv_id) ON DELETE CASCADE,
  title TEXT,                         -- Auto-generated from first message or user-set
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Chat messages
CREATE TABLE messages (
  id TEXT PRIMARY KEY,                -- UUID
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,                 -- 'user' | 'assistant'
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

-- User notes: per paper
CREATE TABLE notes (
  paper_id TEXT PRIMARY KEY REFERENCES papers(arxiv_id) ON DELETE CASCADE,
  content TEXT NOT NULL DEFAULT '',
  updated_at INTEGER NOT NULL
);
```

### Indexes

```sql
CREATE INDEX idx_generations_paper ON generations(paper_id);
CREATE INDEX idx_concept_details_paper ON concept_details(paper_id);
CREATE INDEX idx_conversations_paper ON conversations(paper_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_papers_last_accessed ON papers(last_accessed_at DESC);
```

---

## What Gets Stored

| Data | Table | Format | When Written |
|------|-------|--------|--------------|
| Processed paper (metadata + fullText + sections) | `papers` | Columns + JSON arrays | After `/api/process` succeeds |
| 30-second summary | `generations` (type='summary') | JSON | After `/api/summary` LLM completes |
| 5-minute explanation | `generations` (type='explanation') | Raw markdown text | After `/api/explanation` stream completes |
| Section explanations | `generations` (type='sections') | JSON array | After `/api/sections` LLM completes |
| Concepts list | `generations` (type='concepts') | JSON array | After `/api/concepts` LLM completes |
| Mind map | `generations` (type='mindmap') | Mermaid string | After `/api/mindmap` LLM completes |
| Concept deep-dives | `concept_details` | JSON | After `/api/concept` LLM completes |
| Chat threads | `conversations` + `messages` | Text | On each send/receive |
| User notes | `notes` | Plain text | On save (debounced) |
| Access timestamps | `papers.last_accessed_at` | Unix ms | On every paper load |

---

## Eviction Strategy

**LRU with max count**: Keep the most recent **100 papers** by `last_accessed_at`. When inserting a new paper and count exceeds 100, delete the oldest (CASCADE removes all related generations, concepts, conversations, messages, notes).

Run eviction check after each new paper insert. This keeps the DB file bounded (~50–200MB worst case for 100 papers with full text + chat history).

Configurable via env: `MAX_CACHED_PAPERS=100`

---

## Phase 1: Database setup & infrastructure

### Goal
Set up SQLite, migration system, and connection management.

### Tasks

- [ ] Install `better-sqlite3` and `@types/better-sqlite3`
- [ ] Create `lib/db/connection.ts` — singleton that opens/creates the DB file
  - Path from `process.env.DATABASE_PATH ?? './data/research-copilot.db'`
  - Enable WAL mode for better concurrent read performance
  - Enable foreign keys
- [ ] Create `lib/db/migrations/` directory with numbered SQL files:
  - `001_initial.sql` — all CREATE TABLE + CREATE INDEX statements
- [ ] Create `lib/db/migrate.ts` — reads and applies pending migrations on app start
  - Uses a `_migrations` table to track what's been applied
- [ ] Create `lib/db/index.ts` — exports the initialized db instance
- [ ] Add `data/` to `.gitignore` (the DB file should not be committed)
- [ ] Add `better-sqlite3` to Dockerfile build dependencies (needs native compilation)
- [ ] Verify DB initializes correctly on `npm run dev`

---

## Phase 2: Data Access Layer (DAO)

### Goal
Thin functions for reading/writing each entity, keeping SQL out of route handlers.

### Tasks

- [ ] Create `lib/db/papers.ts`:
  - `findPaper(arxivId: string): ProcessedPaper | null`
  - `savePaper(paper: ProcessedPaper): void`
  - `updateLastAccessed(arxivId: string): void`
  - `listRecentPapers(limit?: number): PaperMeta[]`
  - `deletePaper(arxivId: string): void`
  - `countPapers(): number`
  - `evictOldest(maxCount: number): void`
- [ ] Create `lib/db/generations.ts`:
  - `findGeneration(paperId: string, type: GenerationType): string | null`
  - `saveGeneration(paperId: string, type: GenerationType, data: string, model?: string): void`
- [ ] Create `lib/db/concepts.ts`:
  - `findConceptDetail(paperId: string, term: string): ConceptDetail | null`
  - `saveConceptDetail(paperId: string, term: string, data: ConceptDetail): void`
- [ ] Create `lib/db/conversations.ts`:
  - `listConversations(paperId: string): Conversation[]`
  - `createConversation(paperId: string, title?: string): Conversation`
  - `deleteConversation(id: string): void`
- [ ] Create `lib/db/messages.ts`:
  - `getMessages(conversationId: string): ChatMessage[]`
  - `addMessage(conversationId: string, message: ChatMessage): void`
- [ ] Create `lib/db/notes.ts`:
  - `getNote(paperId: string): string`
  - `saveNote(paperId: string, content: string): void`
- [ ] Define TypeScript types for DB rows in `lib/db/types.ts`

---

## Phase 3: Integrate with API routes

### Goal
Each API route checks the DB before calling the LLM. On LLM success, write result to DB.

### Tasks

- [ ] Update `/api/process` route:
  - Before processing: check `findPaper(arxivId)` → if found, return cached + update `lastAccessed`
  - After processing: call `savePaper()` + `evictOldest()`
- [ ] Update `/api/summary` route:
  - Before LLM: check `findGeneration(paperId, 'summary')`
  - After LLM: call `saveGeneration(paperId, 'summary', JSON.stringify(result))`
- [ ] Update `/api/explanation` route:
  - Before LLM: check `findGeneration(paperId, 'explanation')` → if found, stream from cache
  - After stream completes: accumulate full text and call `saveGeneration()`
  - Note: needs a tee/buffer approach to save while streaming
- [ ] Update `/api/sections` route:
  - Same pattern as summary
- [ ] Update `/api/concepts` route:
  - Same pattern as summary
- [ ] Update `/api/concept` route:
  - Check `findConceptDetail(paperId, term)` before LLM
  - Save after LLM
- [ ] Update `/api/mindmap` route:
  - Check `findGeneration(paperId, 'mindmap')` before LLM
  - Save after LLM
- [ ] Ensure existing file-based cache (`lib/cache.ts`) still works as a fallback for the 3 demo papers (check file cache first, then DB, then LLM)

---

## Phase 4: Chat persistence

### Goal
Store chat conversations server-side with support for multiple threads per paper.

### Tasks

- [ ] Create new API routes:
  - `GET /api/conversations?paperId=` — list conversations for a paper
  - `POST /api/conversations` — create a new conversation
  - `DELETE /api/conversations/[id]` — delete a conversation
  - `GET /api/conversations/[id]/messages` — get all messages in a conversation
- [ ] Update `/api/chat` route:
  - Accept `conversationId` in request body
  - After streaming completes, save both user message and assistant response to DB
- [ ] Update client-side `paper-session.tsx`:
  - Add `activeConversationId` state
  - On paper load, fetch conversations list
  - Support creating new / switching between conversations
  - Load messages from DB when switching conversations
- [ ] Update `ChatPanel` UI:
  - Add a conversation selector (dropdown or tabs at top)
  - "New conversation" button
  - Delete conversation option

---

## Phase 5: Notes migration & recently viewed

### Goal
Move notes from localStorage to the DB, and add a "recently viewed papers" feature.

### Tasks

- [ ] Create API routes for notes:
  - `GET /api/notes?paperId=` — get note content
  - `PUT /api/notes` — save note content (body: `{ paperId, content }`)
- [ ] Update `Notes` component to use API routes instead of localStorage
  - Keep debounced save behavior (400ms), just target the API
  - On mount, fetch from API
- [ ] Add migration path: on first API call, if DB note is empty but localStorage has content, migrate it up (one-time client-side logic)
- [ ] Create `GET /api/papers/recent` — returns last N papers (title, id, lastAccessed)
- [ ] Add "Recent papers" section to the home/landing screen
  - Click to re-open a cached paper instantly (no LLM calls)
- [ ] Update the home screen to show recently analyzed papers

---

## Phase 6: Docker & deployment

### Goal
Ensure the DB persists across container restarts and the app runs cleanly in Docker.

### Tasks

- [ ] Update `Dockerfile`:
  - Install build dependencies for `better-sqlite3` (python3, make, g++)
  - Set `DATABASE_PATH=/app/data/research-copilot.db`
- [ ] Update `docker-compose.yml`:
  - Add volume mount: `./data:/app/data`
  - Ensure the volume directory is created with correct permissions
- [ ] Add `DATABASE_PATH` to `.env.local` template / documentation
- [ ] Verify:
  - DB file survives container restart
  - App starts fresh with empty DB (migrations run automatically)
  - App works with existing pre-cached file data alongside DB
- [ ] Add a health check endpoint that confirms DB is accessible

---

## Phase 7: Polish & edge cases

### Tasks

- [ ] Handle DB corruption gracefully (if open fails, log warning and fall through to LLM-only mode)
- [ ] Add `PRAGMA integrity_check` on startup (optional, log-only)
- [ ] Handle race conditions: two concurrent requests for the same uncached paper should not double-insert (use INSERT OR IGNORE / ON CONFLICT)
- [ ] Add a "clear cache" mechanism (delete all non-demo papers, or specific papers)
- [ ] Test with 50+ papers to verify eviction works correctly
- [ ] Verify explanation streaming + save works (buffer the stream, save on completion)
- [ ] Add logging: log when serving from cache vs. calling LLM (helps with debugging cost)
- [ ] Consider adding a `regenerate` option in the UI that bypasses cache for a specific generation type

---

## File Structure (new files)

```
lib/db/
├── index.ts              # Exports initialized db instance
├── connection.ts         # Opens/creates SQLite, applies pragmas
├── migrate.ts            # Migration runner
├── migrations/
│   └── 001_initial.sql   # Schema creation
├── types.ts              # DB row types
├── papers.ts             # Paper CRUD
├── generations.ts        # Cached LLM output CRUD
├── concepts.ts           # Concept detail CRUD
├── conversations.ts      # Conversation CRUD
├── messages.ts           # Message CRUD
└── notes.ts              # Notes CRUD

data/                     # .gitignored, Docker volume
└── research-copilot.db   # SQLite database file

app/api/
├── conversations/
│   ├── route.ts          # GET (list) + POST (create)
│   └── [id]/
│       ├── route.ts      # DELETE conversation
│       └── messages/
│           └── route.ts  # GET messages
├── notes/
│   └── route.ts          # GET + PUT
└── papers/
    └── recent/
        └── route.ts      # GET recently viewed
```

---

## Dependencies

```bash
pnpm add better-sqlite3
pnpm add -D @types/better-sqlite3
```

---

## Environment Variables (new)

```env
# Path to SQLite database file (default: ./data/research-copilot.db)
DATABASE_PATH=./data/research-copilot.db

# Maximum number of papers to keep cached (LRU eviction)
MAX_CACHED_PAPERS=100
```

---

## Open Considerations

1. **Full-text search** — SQLite supports FTS5. Could add a virtual table for searching across all cached papers by content. Low priority but easy to add later.
2. **Export/import** — Since it's a single `.db` file, backing up or moving the entire cache is trivial (just copy the file).
3. **PDF storage** — Currently PDFs are stored as files. Could move them to a `BLOB` column in SQLite for single-file portability, but files are fine for Docker volume.
4. **Regeneration UI** — A "refresh" button per section that bypasses cache and re-runs the LLM, then overwrites the DB entry.
