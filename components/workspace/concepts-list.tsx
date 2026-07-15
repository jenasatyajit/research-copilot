"use client"

import { ChevronRightIcon, LightbulbIcon } from "lucide-react"

import { usePaperSession } from "@/components/providers/paper-session"
import { LoadError } from "@/components/shared/load-error"
import { Skeleton } from "@/components/ui/skeleton"

export function ConceptsList() {
  const { concepts, openConcept, retryConcepts, activeConcept } =
    usePaperSession()

  if (concepts.status === "error" && concepts.error) {
    return (
      <div className="p-3">
        <LoadError
          error={concepts.error}
          onRetry={retryConcepts}
          title="Couldn't extract concepts"
        />
      </div>
    )
  }

  if (concepts.status !== "done" || !concepts.data) {
    return (
      <div className="flex flex-col gap-1.5 p-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-12 rounded-md" />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-0.5 p-2">
      {concepts.data.map((concept) => {
        const isActive = activeConcept?.term === concept.term
        return (
          <button
            key={concept.id}
            type="button"
            onClick={() => openConcept(concept.term)}
            data-active={isActive}
            className="group flex items-start gap-2 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-accent data-[active=true]:bg-accent"
          >
            <LightbulbIcon className="mt-0.5 size-3.5 shrink-0 text-primary/70 group-hover:text-primary" />
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate text-sm font-medium text-foreground">
                {concept.term}
              </span>
              <span className="line-clamp-2 text-xs leading-snug text-muted-foreground">
                {concept.short}
              </span>
            </span>
            <ChevronRightIcon className="mt-1 size-3.5 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
          </button>
        )
      })}
    </div>
  )
}
