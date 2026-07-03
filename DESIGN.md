# Design

## Theme

Dark-mode-first, IDE-inspired (Cursor / Antigravity). A near-black, faintly cool
content surface with layered panels separated by hairline borders rather than
heavy shadows. The working surface is quiet so the paper content and AI output
carry the color. A working light theme exists but dark is the default.

Color strategy: **Restrained.** Neutral zinc/slate ramp tinted very slightly
cool, plus a single confident teal-cyan accent used only for primary actions,
the current selection, focus rings, and live/streaming indicators — never as
decoration.

## Color (OKLCH)

Dark (default):
- `background` (content/editor): `oklch(0.165 0.005 265)`
- `sidebar` / left + right panels: `oklch(0.149 0.005 265)` (a hair darker for separation)
- `card` / popover / elevated: `oklch(0.198 0.006 265)`
- `foreground`: `oklch(0.955 0.004 265)`
- `muted-foreground`: `oklch(0.68 0.012 265)` (passes 4.5:1 on background)
- `border`: `oklch(1 0 0 / 8%)`, hover/strong `oklch(1 0 0 / 14%)`
- `primary` (accent): `oklch(0.78 0.13 195)` teal-cyan, `primary-foreground` `oklch(0.18 0.03 210)`
- `destructive`: `oklch(0.62 0.21 22)`

Light: clean off-white `oklch(0.99 0 0)` content, zinc panels, same teal accent
darkened to `oklch(0.55 0.12 200)` for contrast.

## Typography

Contrast-axis pairing, intentional reading mode:
- **Sans (UI, chrome, headings):** Geist — crisp, neutral, modern product sans.
- **Serif (paper reading prose — summary, explanation, sections):** Newsreader —
  signals "you are reading a paper," improves long-form legibility.
- **Mono (metadata, labels, code, equations fallback, mind-map):** Geist Mono.

Scale: fixed rem, tight ratio (~1.2). Reading prose capped at ~68ch. Headings use
`text-wrap: balance`, prose uses `text-wrap: pretty`.

## Layout

Three resizable panels (react-resizable-panels via shadcn `Resizable`):
- **Left (workspace):** paper outline, detected concepts, notes. Collapsible.
- **Middle (viewer):** title/authors, 30s summary, 5-min explanation, sections.
  The primary reading column, centered measure.
- **Right (AI):** scoped chat + mind-map trigger. Collapsible.

Top bar holds the paper identity + global actions. Responsive: panels collapse to
tabs / sheets below `lg`.

## Components

shadcn `radix-luma`, zinc base, lucide icons. Every interactive element ships
default/hover/focus/active/disabled/loading states. Skeletons (not spinners) for
content loading. `Empty` for first-run states. `sonner` for toasts. `Alert` for
recoverable errors with a clear next action.

## Motion

150–250ms, ease-out with custom curves; conveys state only (stream start, panel
collapse, concept panel open, message arrival). No orchestrated page-load
sequences in the working surface. Streaming text is its own motion. Full
`prefers-reduced-motion` fallbacks.

Curves:
- `--ease-out`: `cubic-bezier(0.23, 1, 0.32, 1)`
- `--ease-out-quart`: `cubic-bezier(0.25, 1, 0.5, 1)`
