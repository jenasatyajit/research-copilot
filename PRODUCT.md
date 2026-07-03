# Product

## Register

product

## Users

Individual technical learners — students, engineers, and researchers in AI, CS,
ML, robotics, and systems. They open the app with a specific paper they need to
understand and limited time. Their context is focused, single-session reading:
they want to go from "I have this PDF/arXiv link" to "I actually understand this
paper" without leaving to Google every unfamiliar term.

## Product Purpose

Research Copilot is a learning-first reading companion for research papers. It is
not a summarizer. It turns a paper into an explained, explorable workspace:
30-second summary, 5-minute explanation, section-by-section breakdowns,
clickable concept explanations, scoped chat, and an on-demand mind map. Success
is one sentence from the user: "I finally understand the paper." No accounts, no
persistence — the value is delivered in the session.

## Brand Personality

Focused, knowledgeable, calm. Three words: clear, capable, quiet. The tool
should feel like a sharp study partner that already read the paper — confident
and direct, never noisy or padded. It earns trust by disappearing into the task.

## Anti-references

- Generic AI-chat wrappers (purple gradients on white, a single chat box bolted
  onto a marketing page).
- "Summary tool" dashboards with stat cards and hero metrics.
- Heavy, animated marketing-style motion inside the working surface.
- Cluttered academic-PDF skeuomorphism.

## Design Principles

1. **Explanation over extraction.** Every surface answers "what does this mean?"
   not just "what does it say?"
2. **The tool disappears.** Earned familiarity from the best dev tools (Cursor,
   Linear, Raycast). Standard affordances, no invented controls.
3. **Reading is a mode.** The paper-reading surface is calm and long-form; the
   chrome around it is crisp and dense. They look intentionally different.
4. **Fast where the system responds, considered where the user reads.** Snappy
   UI transitions; generous, legible reading typography.
5. **State is never ambiguous.** Loading, streaming, empty, and error states are
   first-class, not afterthoughts.

## Accessibility & Inclusion

Target WCAG 2.1 AA. Body text ≥ 4.5:1 contrast, large text ≥ 3:1. Full keyboard
operability across the three panels. Respect `prefers-reduced-motion` (crossfade
or instant instead of movement). Dark-mode-first, with a working light theme.
