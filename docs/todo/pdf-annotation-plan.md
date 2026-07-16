# PDF Annotation & Chat Integration Plan

## Context

The app currently renders PDFs in an iframe via `/api/pdf?url=...`, which relies on the browser's native PDF viewer. This architecture blocks any text selection interception, highlighting, commenting, or custom actions from React code — the iframe is a sandboxed black box.

To enable text highlighting, commenting, and "send to AI chat" features, the iframe must be replaced with a PDF.js-based React viewer that renders pages as canvas + text layer within the app's DOM, giving full control over selection events and overlay rendering.

### Current Architecture

- `components/paper/center-panel.tsx` — renders `<iframe>` when `viewMode === "pdf"`
- `app/api/pdf/route.ts` — proxy that fetches/caches PDFs and serves them with `Content-Type: application/pdf`
- `components/ai/chat-panel.tsx` — chat UI with `sendMessage(question: string)` from paper session provider
- `components/providers/paper-session.tsx` — all state management; exposes `sendMessage`, `chat`, `chatStatus`
- `types/ai.ts` — `ChatMessage { id, role, content }`
- Dependencies: `unpdf` (text extraction), no PDF viewer library installed

### Target Features

1. Select and highlight text in the PDF
2. Add a comment to selected/highlighted text
3. Select text and send it directly to the AI chat panel

---

## Constraints

1. **No iframe** — must render PDF via PDF.js in React for DOM access
2. **Next.js 16 / React 19** — library must be compatible (check peer deps)
3. **Client-only rendering** — PDF viewer must be dynamically imported (`"use client"`, no SSR)
4. **Session-only persistence** — highlights/comments live in React state (no localStorage or DB for now); document this as a future enhancement point
5. **Performance** — large PDFs (50+ pages) must not block the main thread; use PDF.js web worker
6. **Existing design system** — use project's existing UI components (Button, Popover, Input) and OKLCH color tokens; no new design language
7. **Accessibility** — floating toolbar must be keyboard-accessible; highlights must not break screen reader text flow
8. **PDF proxy stays** — continue using `/api/pdf?url=` to avoid CORS issues with cross-origin PDFs; pass the proxied URL to the PDF.js loader

---

## Phase 1: Replace iframe with PDF.js viewer

### Goal
Render the PDF inside the app's DOM with selectable text.

### Tasks

- [ ] Install `pdfjs-dist` (pinned version compatible with React 19 / Next.js 16)
- [ ] Create `components/pdf/pdf-viewer.tsx` — client component that:
  - Loads PDF document via `pdfjs-dist` using the existing `/api/pdf?url=` endpoint
  - Renders each page as `<canvas>` + text layer overlay (`<div class="textLayer">`)
  - Supports scroll-based pagination (render visible pages + buffer)
  - Configures PDF.js worker via `pdfjs.GlobalWorkerOptions.workerSrc`
- [ ] Create `components/pdf/pdf-page.tsx` — renders a single page (canvas + text layer)
- [ ] Update `center-panel.tsx` to use `<PdfViewer>` instead of `<iframe>` in PDF mode
- [ ] Verify text is selectable and copy-paste works
- [ ] Add basic zoom controls (+/- buttons in a small toolbar)
- [ ] Handle loading and error states (skeleton / error message)

### Technical Notes

- Use `pdfjs-dist/build/pdf.mjs` for ESM import
- Set worker source to `pdfjs-dist/build/pdf.worker.mjs` (or copy to `/public`)
- Use `page.getTextContent()` + `pdfjs.renderTextLayer()` for the text layer
- Wrap in `dynamic(() => import(...), { ssr: false })` if needed for Next.js

---

## Phase 2: Selection toolbar (floating popover)

### Goal
When user selects text in the PDF, show a floating toolbar with actions.

### Tasks

- [ ] Create `components/pdf/selection-toolbar.tsx` — a floating popover that appears near the text selection
- [ ] Detect text selection via `document.getSelection()` scoped to the PDF container
- [ ] Show toolbar with three buttons:
  - **Highlight** — saves the selection as a highlight
  - **Comment** — opens a small inline input to attach a note
  - **Ask AI** — sends the selected text to the chat panel
- [ ] Position toolbar above/below the selection using `Range.getBoundingClientRect()`
- [ ] Dismiss toolbar when selection is cleared or user clicks elsewhere
- [ ] Ensure toolbar is keyboard-accessible (focus trap, Escape to close)

### Technical Notes

- Listen to `mouseup` + `selectionchange` events on the PDF container
- Use a portal (`createPortal`) to avoid overflow clipping
- Use existing `Button` component with `variant="ghost"` and lucide icons
- Debounce selection detection to avoid flicker during drag

---

## Phase 3: Highlights state & rendering

### Goal
Persist highlights in session state and render them as colored overlays on the PDF.

### Tasks

- [ ] Define highlight data types:
  ```ts
  interface PdfHighlight {
    id: string
    text: string
    color: "yellow" | "blue" | "green" | "pink"
    comment?: string
    position: {
      pageNumber: number
      rects: Array<{ x1: number; y1: number; x2: number; y2: number }>
      // Viewport-independent (percentage of page dimensions)
    }
    createdAt: number
  }
  ```
- [ ] Create `usePdfHighlights()` hook or add state to paper session provider
- [ ] On "Highlight" action: capture selection rects relative to the page, normalize to percentages, store in state
- [ ] Create `components/pdf/highlight-layer.tsx` — renders colored `<div>` overlays positioned over the text layer using the stored rects
- [ ] Support multiple highlight colors (default: yellow; could be a small color picker in toolbar)
- [ ] Clicking an existing highlight shows its comment (if any) in a small popover

### Technical Notes

- Convert pixel rects to percentage-of-page so highlights survive zoom changes
- Each page gets its own highlight layer overlay
- Use `mix-blend-mode: multiply` for the highlight color to look natural over text
- Z-index: canvas < textLayer < highlightLayer (pointer-events: none on highlight layer except on hover targets)

---

## Phase 4: Comments

### Goal
Allow users to attach text notes to highlights.

### Tasks

- [ ] When "Comment" is clicked in the selection toolbar, expand a small text input below the toolbar
- [ ] On submit, create a highlight with the comment attached
- [ ] Show a small indicator icon (chat bubble) on highlighted text that has a comment
- [ ] Clicking the indicator opens a popover showing the comment text with edit/delete options
- [ ] Create `components/pdf/comment-popover.tsx` for display/edit
- [ ] Allow editing and deleting comments on existing highlights
- [ ] Show comments list in the left panel "Notes" tab (optional enhancement)

### Technical Notes

- Comments are stored as `comment` field on `PdfHighlight`
- Use existing `Popover` / `Tooltip` components for the comment display
- Keep the comment input minimal: textarea + save/cancel buttons

---

## Phase 5: "Ask AI" integration

### Goal
Selected text from the PDF can be sent directly to the AI chat with context.

### Tasks

- [ ] On "Ask AI" click: pre-fill the chat input with the selected text so the user can add their question
- [ ] Format as: the selected text appears as a quoted block in the input, cursor positioned after for user's question
- [ ] Expose a `prefillChat(text: string)` function from paper session or chat panel
- [ ] Wire it through: PdfViewer → selection toolbar → workspace → chat panel (via lifted state or context)
- [ ] When message is sent, format it for the API as: `Regarding this excerpt from the paper:\n\n> "${selectedText}"\n\n${userQuestion}`
- [ ] Ensure the right panel (chat) is visible when "Ask AI" is triggered; auto-open if collapsed

### Technical Notes

- Add `prefillChat` to the session context or use a separate lightweight context/callback
- The chat panel's `InputGroupTextarea` value is controlled by `input` state — expose a setter or use a ref
- If the right panel is hidden (`showRight === false`), call `onToggleRight()` before prefilling

---

## Phase 6: Polish & edge cases

### Tasks

- [ ] Handle PDF loading failures gracefully (fallback to download link)
- [ ] Handle password-protected PDFs (show password prompt)
- [ ] Ensure `prefers-reduced-motion` is respected (no animated toolbar entrance)
- [ ] Test with large PDFs (50+ pages) — virtualize page rendering if needed
- [ ] Test with RTL text and multi-column layouts
- [ ] Ensure highlights don't break when zooming in/out
- [ ] Add keyboard shortcut: `Ctrl+Shift+H` to highlight selection
- [ ] Memory cleanup: revoke object URLs, cancel pending renders on unmount

---

## Dependency Installation

```bash
pnpm add pdfjs-dist
```

No additional UI library needed — the project already has radix primitives, lucide icons, and the full shadcn component set.

---

## File Structure (new files)

```
components/pdf/
├── pdf-viewer.tsx          # Main PDF viewer (loads doc, renders pages)
├── pdf-page.tsx            # Single page renderer (canvas + text layer)
├── selection-toolbar.tsx   # Floating toolbar on text selection
├── highlight-layer.tsx     # Overlay layer rendering saved highlights
├── comment-popover.tsx     # Popover for viewing/editing comments
└── use-pdf-highlights.ts   # Hook managing highlight state
```

---

## Open Decisions (resolve before implementation)

1. **Persistence** — Currently session-only. If localStorage persistence is wanted later, the hook is the single point to add it.
2. **Highlight colors** — Start with yellow-only or include a color picker from Phase 3?
3. **Notes tab integration** — Should PDF comments also appear in the left panel "Notes" tab alongside any existing notes?
4. **react-pdf-highlighter-extended vs raw pdfjs-dist** — The library provides selection/highlight primitives out of the box but adds ~100KB and has peer dep constraints. Raw pdfjs-dist gives more control and fewer compatibility risks with React 19 / Next.js 16. Recommend starting with raw pdfjs-dist for maximum control.
