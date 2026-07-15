"use client"

import { usePaperSession } from "@/components/providers/paper-session"
import { explainableSections } from "@/prompts/sections"
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty"

export function Outline() {
  const { paper } = usePaperSession()
  if (!paper) return null

  const sections = explainableSections(paper.sections)

  if (sections.length === 0) {
    return (
      <Empty className="border-0 py-10">
        <EmptyTitle className="text-sm">No sections detected</EmptyTitle>
        <EmptyDescription>
          This paper&apos;s structure couldn&apos;t be recovered.
        </EmptyDescription>
      </Empty>
    )
  }

  function scrollTo(id: string) {
    document
      .getElementById(`sec-${id}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <nav className="flex flex-col gap-0.5 p-2">
      {sections.map((section, i) => (
        <button
          key={section.id}
          type="button"
          onClick={() => scrollTo(section.id)}
          className="group flex items-start gap-2.5 rounded-md px-2.5 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <span className="mt-px w-4 shrink-0 font-mono text-xs text-muted-foreground/60 group-hover:text-primary">
            {String(i + 1).padStart(2, "0")}
          </span>
          <span className="min-w-0 truncate leading-snug">{section.title}</span>
        </button>
      ))}
    </nav>
  )
}
