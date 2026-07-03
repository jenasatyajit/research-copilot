"use client"

import { useState } from "react"
import { NetworkIcon, RotateCwIcon } from "lucide-react"

import { usePaperSession } from "@/components/providers/paper-session"
import { LoadError } from "@/components/shared/load-error"
import { MermaidDiagram } from "@/components/shared/mermaid-diagram"
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

export function MindMapDialog() {
  const { mindmap, generateMindMap } = usePaperSession()
  const [open, setOpen] = useState(false)

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next && mindmap.status === "idle") {
      void generateMindMap()
    }
  }

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
          </DialogDescription>
        </DialogHeader>

        <div className="scroll-thin min-h-[300px] flex-1 overflow-auto p-6">
          {mindmap.status === "loading" ? (
            <div className="flex h-full min-h-[260px] flex-col items-center justify-center gap-3 text-muted-foreground">
              <Spinner className="size-5" />
              <p className="text-sm">Mapping the paper…</p>
            </div>
          ) : mindmap.status === "error" && mindmap.error ? (
            <LoadError
              error={mindmap.error}
              onRetry={generateMindMap}
              title="Couldn't generate the mind map"
            />
          ) : mindmap.status === "done" && mindmap.mermaid ? (
            <MermaidDiagram chart={mindmap.mermaid} />
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
