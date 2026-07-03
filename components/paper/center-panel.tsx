"use client"

import { ExternalLinkIcon } from "lucide-react"

import { usePaperSession } from "@/components/providers/paper-session"
import { SummaryCard } from "@/components/paper/summary-card"
import { ExplanationView } from "@/components/paper/explanation-view"
import { SectionsView } from "@/components/paper/sections-view"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

export function CenterPanel() {
  const { paper } = usePaperSession()
  if (!paper) return null

  const authors =
    paper.authors.length > 0
      ? paper.authors.slice(0, 6).join(", ") + (paper.authors.length > 6 ? " et al." : "")
      : "Unknown authors"

  return (
    <ScrollArea className="scroll-thin h-full bg-background">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-6 py-8">
        <header className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="font-mono text-[0.7rem] uppercase">
              {paper.source}
            </Badge>
            {paper.published ? (
              <span className="text-xs text-muted-foreground">{paper.published}</span>
            ) : null}
            <span className="text-xs text-muted-foreground">
              {paper.wordCount.toLocaleString()} words
            </span>
          </div>
          <h1 className="reading-balance text-2xl font-semibold tracking-tight text-foreground">
            {paper.title}
          </h1>
          <p className="text-sm text-muted-foreground">{authors}</p>
          <a
            href={paper.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-fit items-center gap-1.5 text-xs text-primary transition-colors hover:text-primary/80"
          >
            View original
            <ExternalLinkIcon className="size-3" />
          </a>
        </header>

        <SummaryCard />
        <ExplanationView />
        <SectionsView />
      </div>
    </ScrollArea>
  )
}
