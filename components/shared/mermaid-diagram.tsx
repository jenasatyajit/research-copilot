"use client"

import { useEffect, useId, useState } from "react"
import { useTheme } from "next-themes"

interface MermaidDiagramProps {
  chart: string
}

/** Renders a Mermaid graph to inline SVG, reacting to the active theme. */
export function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const rawId = useId()
  const renderId = `mermaid-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`
  const { resolvedTheme } = useTheme()
  const [svg, setSvg] = useState<string>("")
  const [error, setError] = useState<string | null>(null)

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
      className="mermaid-container flex w-full justify-center overflow-x-auto [&_svg]:h-auto [&_svg]:max-w-full"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
