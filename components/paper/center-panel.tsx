"use client"

import { ExternalLinkIcon } from "lucide-react"

import { usePaperSession } from "@/components/providers/paper-session"
import { SummaryCard } from "@/components/paper/summary-card"
import { ExplanationView } from "@/components/paper/explanation-view"
import { SectionsView } from "@/components/paper/sections-view"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { ViewMode } from "@/components/workspace/workspace"

interface CenterPanelProps {
  viewMode: ViewMode
}

export function CenterPanel({ viewMode }: CenterPanelProps) {
  const { paper } = usePaperSession()
  if (!paper) return null

  const authors =
    paper.authors.length > 0
      ? paper.authors.slice(0, 6).join(", ") +
        (paper.authors.length > 6 ? " et al." : "")
      : "Unknown authors"

  return (
    <div className="flex h-full flex-col bg-background">
      {viewMode === "analysis" ? (
        <>
          <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b px-6">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
              <Badge
                variant="secondary"
                className="h-4.5 px-1.5 font-mono text-[0.6rem] uppercase"
              >
                {paper.source}
              </Badge>
              {paper.published ? <span>{paper.published}</span> : null}
              <span>·</span>
              <span>{paper.wordCount.toLocaleString()} words</span>
              <span>·</span>
              <span className="truncate">{authors}</span>
            </div>
            <a
              href={paper.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Original
              <ExternalLinkIcon className="size-3" />
            </a>
          </header>
          <ScrollArea className="scroll-thin min-h-0 flex-1">
            <div className="flex w-full flex-col divide-y divide-border/60">
              <SummaryCard />
              <ExplanationView />
              <SectionsView />
            </div>
          </ScrollArea>
        </>
      ) : (
        <div className="min-h-0 flex-1 p-4">
          <iframe
            src={`/api/pdf?url=${encodeURIComponent(paper.pdfUrl)}`}
            className="h-full w-full rounded-lg border bg-muted/10 shadow-sm"
            title={`PDF viewer for ${paper.title}`}
          />
        </div>
      )}
    </div>
  )
}
