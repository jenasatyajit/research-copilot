# LLM Calls & Token Usage

## Overview

All LLM calls route through OpenRouter (`lib/openrouter.ts`) which provides three calling patterns:

- `complete()` — non-streaming, returns full text
- `completeJson()` — non-streaming, parses + validates response JSON with Zod
- `streamCompletion()` — streaming generator, yields text deltas via SSE

## Models

Configured in `lib/env.ts`:

| Alias | Default Model | Used For |
|-------|---------------|----------|
| `fastModel` | `google/gemini-2.5-flash` | Structured extraction (summary, sections, concepts) |
| `smartModel` | `anthropic/claude-sonnet-4` | Reasoning-heavy tasks (explanation, chat, concept detail, mind map) |

Both are overridable via environment variables:
- `OPENROUTER_FAST_MODEL`
- `OPENROUTER_SMART_MODEL`

---

## Call Sites

### On Paper Submission (4 parallel calls)

When a user submits a paper URL, the client fires all four simultaneously from `startGenerations()` in `paper-session.tsx`:

| API Route | Model | Function | Prompt Builder | Purpose | maxTokens |
|-----------|-------|----------|----------------|---------|-----------|
| `/api/summary` | fast | `completeJson()` | `buildSummaryMessages()` | 30-second summary (6 JSON fields) | uncapped |
| `/api/explanation` | smart | `streamCompletion()` | `buildExplanationMessages()` | 5-minute explanation (streamed markdown) | 2,200 |
| `/api/sections` | fast | `completeJson()` | `buildSectionsMessages()` | Section-by-section explanations (JSON) | uncapped |
| `/api/concepts` | fast | `completeJson()` | `buildConceptsMessages()` | 6–12 key concepts (JSON) | uncapped |

### On-Demand (user-triggered)

| API Route | Model | Function | Prompt Builder | Purpose | maxTokens |
|-----------|-------|----------|----------------|---------|-----------|
| `/api/chat` | smart | `streamCompletion()` | `buildChatMessages()` | Scoped Q&A about the paper | 1,600 |
| `/api/concept` | smart | `completeJson()` | `buildConceptMessages()` | Deep explanation of a single concept | uncapped |
| `/api/mindmap` | smart | `complete()` | `buildMindMapMessages()` | Mermaid flowchart generation | 1,200 |

---

## Context Budgets

### What goes into each prompt

Every prompt follows the structure:
1. **System message**: `TUTOR_SYSTEM` persona (~100 words, defined in `prompts/shared.ts`)
2. **User message**: `paperHeader(paper)` + paper content + task instructions

### Paper content per call

| Call | Content Sent | Truncation Rule |
|------|--------------|-----------------|
| Summary | Full `paper.fullText` | `clip(fullText, 120,000)` — only truncates if paper > 120k chars |
| Explanation | Full `paper.fullText` | `clip(fullText, 120,000)` — only truncates if paper > 120k chars |
| Sections | Partial — per-section content | 1,800 chars per section × max 12 sections = 21,600 chars max |
| Concepts | Full `paper.fullText` | `clip(fullText, 120,000)` — only truncates if paper > 120k chars |
| Chat | Full `paper.fullText` + last 10 turns | `clip(fullText, 120,000)` + history messages |
| Concept detail | Partial `paper.fullText` | `clip(fullText, 40,000)` — hardcoded smaller budget |
| Mind map | Full `paper.fullText` | `clip(fullText, 120,000)` — only truncates if paper > 120k chars |

### Key constants (`lib/constants.ts`)

```ts
MAX_CONTEXT_CHARS = 120_000  // ~30k tokens — main paper context budget
```

### Per-prompt limits (`prompts/sections.ts`)

```ts
MAX_SECTIONS = 12            // Skip references/bibliography/appendix
PER_SECTION_CHARS = 1_800    // Truncate each section's raw text
```

---

## Token Estimates (Initial Paper Submission)

For a typical ~6,000-word paper (~24,000 chars, e.g. "Attention Is All You Need"):

### Input Tokens

| Call | Context Chars | Estimated Input Tokens |
|------|---------------|----------------------|
| Summary | ~24,000 + header + instructions | ~7,000 |
| Explanation | ~24,000 + header + instructions | ~7,200 |
| Sections | ~21,600 (12 × 1,800) + header + instructions | ~6,400 |
| Concepts | ~24,000 + header + instructions | ~7,100 |
| **Total input** | | **~27,700** |

### Output Tokens

| Call | Typical Output | Estimated Output Tokens |
|------|----------------|------------------------|
| Summary | ~200 words JSON | ~300 |
| Explanation | ~1,500–2,000 words markdown | ~1,800 |
| Sections | ~1,200 words JSON (12 × ~100 words) | ~1,500 |
| Concepts | ~200 words JSON | ~300 |
| **Total output** | | **~3,900** |

### Combined: ~31,600 tokens per paper submission

For longer papers (12,000 words / ~48,000 chars), input roughly doubles. The 120k char cap means maximum possible input per call is ~30k tokens.

---

## Cost Analysis

### With a $0.01 / $0.03 per 1M model (single model)

| | Tokens | Cost |
|---|--------|------|
| Input | ~27,700 | $0.000277 |
| Output | ~3,900 | $0.000117 |
| **Per paper** | ~31,600 | **~$0.0004** |

### At scale (single model, $0.01/$0.03 per 1M)

| Papers | Cost |
|--------|------|
| 100 | ~$0.04 |
| 1,000 | ~$0.40 |
| 10,000 | ~$4.00 |
| 100,000 | ~$40.00 |

### On-demand call costs (per invocation)

| Call | Input Tokens | Output Tokens | Cost |
|------|-------------|---------------|------|
| Chat message | ~7,500 | ~400 | ~$0.000087 |
| Concept detail | ~11,500 | ~400 | ~$0.000127 |
| Mind map | ~7,200 | ~300 | ~$0.000081 |

### Typical session cost

1 paper + 5 chat messages + 2 concept lookups + 1 mind map ≈ **$0.001** (one tenth of a cent)

---

## With default models (Gemini Flash + Claude Sonnet 4)

| Model | Pricing (input/output per 1M) | Calls | Estimated cost per paper |
|-------|-------------------------------|-------|--------------------------|
| Gemini 2.5 Flash | ~$0.15 / $0.60 | 3 (summary, sections, concepts) | ~$0.003 |
| Claude Sonnet 4 | ~$3.00 / $15.00 | 1 (explanation) | ~$0.05 |
| **Total** | | 4 | **~$0.05–$0.06** |

---

## File Reference

| File | Role |
|------|------|
| `lib/openrouter.ts` | LLM client (complete, completeJson, streamCompletion) |
| `lib/env.ts` | Model + API key configuration |
| `lib/constants.ts` | MAX_CONTEXT_CHARS, STREAM_ERROR_MARKER |
| `prompts/shared.ts` | TUTOR_SYSTEM persona, clip(), paperHeader() |
| `prompts/summary.ts` | 30-second summary prompt |
| `prompts/explanation.ts` | 5-minute explanation prompt |
| `prompts/sections.ts` | Section-by-section prompt + section filtering |
| `prompts/concepts.ts` | Concept extraction prompt |
| `prompts/concept.ts` | Single concept deep-dive prompt |
| `prompts/chat.ts` | Chat Q&A prompt (includes history) |
| `prompts/mindmap.ts` | Mermaid mind map prompt |
| `app/api/summary/route.ts` | Summary endpoint |
| `app/api/explanation/route.ts` | Explanation endpoint (streaming) |
| `app/api/sections/route.ts` | Sections endpoint |
| `app/api/concepts/route.ts` | Concepts endpoint |
| `app/api/chat/route.ts` | Chat endpoint (streaming) |
| `app/api/concept/route.ts` | Concept detail endpoint |
| `app/api/mindmap/route.ts` | Mind map endpoint |
| `components/providers/paper-session.tsx` | Client-side orchestrator (fires parallel calls) |
