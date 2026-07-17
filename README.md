# Research Copilot

Research Copilot is a learning-first assistant for understanding research papers quickly. Instead of only summarizing a paper, it helps users understand concepts, sections, and context in plain language.

## Goal

Help users understand any research paper in under 10 minutes through:

- 30-second summary
- 5-minute explanation
- Section-by-section explanations
- Concept exploration
- Context-aware chat
- On-demand mind maps

## Core User Flow

1. Paste an arXiv or direct PDF URL
2. Process and extract paper content
3. Read a 30-second summary
4. Read a 5-minute explanation
5. Explore section explanations
6. Click concepts for deeper explanations
7. Chat with the paper
8. Generate a Mermaid mind map on demand

## MVP Scope

### Included

- arXiv and PDF URL input
- Automatic paper extraction and section detection
- AI-generated summaries and explanations
- Concept explorer
- Paper-scoped chat
- Mermaid mind map generation
- Responsive desktop-first UI

### Excluded

- Authentication
- Persistent storage and saved papers
- Notes and collections
- Search and recommendations
- Multi-paper comparison

## Product Experience

The app is designed around one success metric:

> “I finally understand the paper.”

## Tech Stack

- **Frontend:** Next.js, TypeScript, Tailwind CSS, shadcn/ui, React Markdown, Mermaid
- **Backend:** Next.js Route Handlers
- **AI:** OpenRouter-based model pipeline

## Run Locally

```bash
npm ci
npm run dev
```

## Key Scripts

```bash
npm run dev
npm run lint
npm run build
npm run typecheck
```

## Specification

Product and MVP details live in:

- `/home/runner/work/research-copilot/research-copilot/docs/SPEC.md`
