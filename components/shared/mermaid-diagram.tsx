"use client"

import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
} from "react"
import { useTheme } from "next-themes"

interface MermaidDiagramProps {
  chart: string
  /** Current zoom level (1 = 100%). Controlled externally. */
  zoom?: number
}

export interface MermaidDiagramHandle {
  /** Returns the rendered SVG element (or null if not yet rendered). */
  getSvgElement: () => SVGSVGElement | null
}

/**
 * Renders a Mermaid graph to inline SVG with pan & zoom support.
 * Exposes a ref handle so parent components can access the raw SVG for export.
 */
export const MermaidDiagram = forwardRef<MermaidDiagramHandle, MermaidDiagramProps>(
  function MermaidDiagram({ chart, zoom = 1 }, ref) {
    const rawId = useId()
    const renderId = `mermaid-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`
    const { resolvedTheme } = useTheme()
    const [svg, setSvg] = useState<string>("")
    const [error, setError] = useState<string | null>(null)

    const containerRef = useRef<HTMLDivElement>(null)

    // Pan state
    const [isPanning, setIsPanning] = useState(false)
    const [translate, setTranslate] = useState({ x: 0, y: 0 })
    const panStart = useRef({ x: 0, y: 0 })
    const translateStart = useRef({ x: 0, y: 0 })

    // Expose SVG element to parent
    useImperativeHandle(ref, () => ({
      getSvgElement: () => {
        return containerRef.current?.querySelector("svg") ?? null
      },
    }))

    useEffect(() => {
      let cancelled = false

      async function render() {
        try {
          const mermaid = (await import("mermaid")).default
          mermaid.initialize({
            startOnLoad: false,
            securityLevel: "strict",
            theme: resolvedTheme === "dark" ? "dark" : "neutral",
            fontFamily: "var(--font-sans)",
            flowchart: { curve: "basis", htmlLabels: true, padding: 16 },
          })
          const { svg: rendered } = await mermaid.render(renderId, chart)
          if (!cancelled) {
            setSvg(rendered)
            setError(null)
          }
        } catch {
          if (!cancelled) {
            setError("This diagram couldn't be rendered.")
            setSvg("")
          }
        }
      }

      void render()
      return () => {
        cancelled = true
      }
    }, [chart, renderId, resolvedTheme])

    // Reset pan when chart changes
    useEffect(() => {
      setTranslate({ x: 0, y: 0 })
    }, [chart])

    // --- Pan handlers ---
    const handlePointerDown = useCallback(
      (e: React.PointerEvent) => {
        // Only pan on left mouse button or touch
        if (e.button !== 0) return
        setIsPanning(true)
        panStart.current = { x: e.clientX, y: e.clientY }
        translateStart.current = { ...translate }
        ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
      },
      [translate]
    )

    const handlePointerMove = useCallback(
      (e: React.PointerEvent) => {
        if (!isPanning) return
        const dx = e.clientX - panStart.current.x
        const dy = e.clientY - panStart.current.y
        setTranslate({
          x: translateStart.current.x + dx,
          y: translateStart.current.y + dy,
        })
      },
      [isPanning]
    )

    const handlePointerUp = useCallback(
      (e: React.PointerEvent) => {
        if (!isPanning) return
        setIsPanning(false)
        ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
      },
      [isPanning]
    )

    if (error) {
      return (
        <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          {error}
          <pre className="scroll-thin mt-2 max-h-40 overflow-auto rounded bg-muted/50 p-2 font-mono text-xs">
            {chart}
          </pre>
        </div>
      )
    }

    return (
      <div
        className="mermaid-container relative h-full w-full overflow-hidden"
        style={{ cursor: isPanning ? "grabbing" : "grab" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div
          ref={containerRef}
          className="flex h-full w-full items-center justify-center [&_svg]:h-auto [&_svg]:max-w-none"
          style={{
            transform: `translate(${translate.x}px, ${translate.y}px) scale(${zoom})`,
            transformOrigin: "center center",
            transition: isPanning ? "none" : "transform 0.15s ease-out",
          }}
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>
    )
  }
)
