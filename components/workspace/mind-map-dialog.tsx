"use client"

import { useCallback, useRef, useState } from "react"
import {
  CopyIcon,
  DownloadIcon,
  MinusIcon,
  NetworkIcon,
  PlusIcon,
  RotateCwIcon,
  Maximize2Icon,
} from "lucide-react"

import { usePaperSession } from "@/components/providers/paper-session"
import { LoadError } from "@/components/shared/load-error"
import {
  MermaidDiagram,
  type MermaidDiagramHandle,
} from "@/components/shared/mermaid-diagram"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const ZOOM_MIN = 0.25
const ZOOM_MAX = 3
const ZOOM_STEP = 0.25

export function MindMapDialog() {
  const { mindmap, generateMindMap } = usePaperSession()
  const [open, setOpen] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [copyFeedback, setCopyFeedback] = useState(false)
  const diagramRef = useRef<MermaidDiagramHandle>(null)

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next && mindmap.status === "idle") {
      void generateMindMap()
    }
    // Reset zoom when closing
    if (!next) {
      setZoom(1)
    }
  }

  const zoomIn = useCallback(() => {
    setZoom((z) => Math.min(z + ZOOM_STEP, ZOOM_MAX))
  }, [])

  const zoomOut = useCallback(() => {
    setZoom((z) => Math.max(z - ZOOM_STEP, ZOOM_MIN))
  }, [])

  const resetZoom = useCallback(() => {
    setZoom(1)
  }, [])

  /**
   * Converts the rendered SVG to a PNG canvas at 2x resolution for clarity.
   */
  const svgToCanvas = useCallback(async (): Promise<HTMLCanvasElement | null> => {
    const svgEl = diagramRef.current?.getSvgElement()
    if (!svgEl) return null

    // Clone SVG and inline computed styles for export
    const clone = svgEl.cloneNode(true) as SVGSVGElement
    const bbox = svgEl.getBoundingClientRect()
    const width = bbox.width || svgEl.viewBox?.baseVal?.width || 800
    const height = bbox.height || svgEl.viewBox?.baseVal?.height || 600

    // Ensure the clone has explicit dimensions
    clone.setAttribute("width", String(width))
    clone.setAttribute("height", String(height))
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg")

    const serializer = new XMLSerializer()
    const svgString = serializer.serializeToString(clone)
    const svgBlob = new Blob([svgString], {
      type: "image/svg+xml;charset=utf-8",
    })
    const url = URL.createObjectURL(svgBlob)

    const scale = 2 // Retina export
    const canvas = document.createElement("canvas")
    canvas.width = width * scale
    canvas.height = height * scale
    const ctx = canvas.getContext("2d")!
    ctx.scale(scale, scale)

    // White background
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, width, height)

    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height)
        URL.revokeObjectURL(url)
        resolve(canvas)
      }
      img.onerror = () => {
        URL.revokeObjectURL(url)
        resolve(null)
      }
      img.src = url
    })
  }, [])

  const handleCopy = useCallback(async () => {
    try {
      const canvas = await svgToCanvas()
      if (!canvas) return

      canvas.toBlob(async (blob) => {
        if (!blob) return
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ])
        setCopyFeedback(true)
        setTimeout(() => setCopyFeedback(false), 2000)
      }, "image/png")
    } catch (err) {
      console.error("Failed to copy mind map:", err)
    }
  }, [svgToCanvas])

  const handleDownload = useCallback(async () => {
    try {
      const canvas = await svgToCanvas()
      if (!canvas) return

      const dataUrl = canvas.toDataURL("image/png")
      const link = document.createElement("a")
      link.download = "mindmap.png"
      link.href = dataUrl
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error("Failed to download mind map:", err)
    }
  }, [svgToCanvas])

  const zoomPercent = Math.round(zoom * 100)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <NetworkIcon data-icon="inline-start" />
          Mind map
        </Button>
      </DialogTrigger>
      <DialogContent
        showCloseButton
        className="flex max-h-[85vh] w-[min(92vw,900px)] flex-col gap-0 p-0 sm:max-w-none"
      >
        <DialogHeader className="border-b p-5">
          <DialogTitle className="flex items-center gap-2">
            <NetworkIcon className="size-4 text-primary" />
            Mind map
          </DialogTitle>
          <DialogDescription>
            A visual map of the paper&apos;s problem, method, and results.
            Drag to pan, use controls to zoom.
          </DialogDescription>
        </DialogHeader>

        <div className="relative min-h-[300px] flex-1 overflow-hidden">
          {mindmap.status === "loading" ? (
            <div className="flex h-full min-h-[260px] flex-col items-center justify-center gap-3 text-muted-foreground">
              <Spinner className="size-5" />
              <p className="text-sm">Mapping the paper…</p>
            </div>
          ) : mindmap.status === "error" && mindmap.error ? (
            <div className="p-6">
              <LoadError
                error={mindmap.error}
                onRetry={generateMindMap}
                title="Couldn't generate the mind map"
              />
            </div>
          ) : mindmap.status === "done" && mindmap.mermaid ? (
            <>
              <MermaidDiagram
                ref={diagramRef}
                chart={mindmap.mermaid}
                zoom={zoom}
              />

              {/* Zoom & export toolbar — floating bottom-center */}
              <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-lg border bg-popover/95 p-1 shadow-md backdrop-blur-sm">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={zoomOut}
                      disabled={zoom <= ZOOM_MIN}
                      aria-label="Zoom out"
                    >
                      <MinusIcon className="size-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Zoom out</TooltipContent>
                </Tooltip>

                <button
                  onClick={resetZoom}
                  className="min-w-[3.25rem] rounded px-1.5 py-0.5 text-center text-xs font-medium tabular-nums text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="Reset zoom"
                >
                  {zoomPercent}%
                </button>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={zoomIn}
                      disabled={zoom >= ZOOM_MAX}
                      aria-label="Zoom in"
                    >
                      <PlusIcon className="size-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Zoom in</TooltipContent>
                </Tooltip>

                <div className="mx-1 h-4 w-px bg-border" />

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={resetZoom}
                      aria-label="Fit to view"
                    >
                      <Maximize2Icon className="size-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Reset view</TooltipContent>
                </Tooltip>

                <div className="mx-1 h-4 w-px bg-border" />

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={handleCopy}
                      aria-label="Copy as image"
                    >
                      <CopyIcon className="size-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    {copyFeedback ? "Copied!" : "Copy as image"}
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={handleDownload}
                      aria-label="Download as PNG"
                    >
                      <DownloadIcon className="size-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Download PNG</TooltipContent>
                </Tooltip>
              </div>
            </>
          ) : null}
        </div>

        {mindmap.status === "done" ? (
          <div className="flex justify-end border-t p-3">
            <Button variant="ghost" size="sm" onClick={generateMindMap}>
              <RotateCwIcon data-icon="inline-start" />
              Regenerate
            </Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
