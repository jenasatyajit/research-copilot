"use client"

import { ArrowRightIcon, LightbulbIcon } from "lucide-react"

import { usePaperSession } from "@/components/providers/paper-session"
import { LoadError } from "@/components/shared/load-error"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <h3 className="text-xs font-medium tracking-wide text-muted-foreground">{label}</h3>
      <div className="text-sm leading-relaxed text-foreground/90">{children}</div>
    </div>
  )
}

export function ConceptSheet() {
  const { activeConcept, openConcept, closeConcept } = usePaperSession()
  const open = activeConcept !== null

  return (
    <Sheet open={open} onOpenChange={(next) => (next ? null : closeConcept())}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b">
          <div className="flex items-center gap-2">
            <LightbulbIcon className="size-4 text-primary" />
            <SheetTitle className="text-base">{activeConcept?.term ?? "Concept"}</SheetTitle>
          </div>
          <SheetDescription>Concept explained in the context of this paper.</SheetDescription>
        </SheetHeader>

        <div className="scroll-thin flex-1 overflow-y-auto p-5">
          {activeConcept?.status === "error" && activeConcept.error ? (
            <LoadError
              error={activeConcept.error}
              onRetry={() => openConcept(activeConcept.term)}
              title="Couldn't explain this concept"
            />
          ) : activeConcept?.status === "done" && activeConcept.data ? (
            <ConceptDetailBody />
          ) : (
            <div className="flex flex-col gap-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-5/6" />
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function ConceptDetailBody() {
  const { activeConcept, openConcept } = usePaperSession()
  const data = activeConcept?.data
  if (!data) return null

  return (
    <div className="flex flex-col gap-5">
      <Field label="Definition">{data.definition}</Field>
      <Field label="In plain terms">{data.simpleExplanation}</Field>
      <Field label="Analogy">
        <div className="rounded-lg bg-muted/60 p-3 italic text-foreground/80">{data.analogy}</div>
      </Field>
      <Field label="Why it's used here">{data.whyUsedHere}</Field>

      {data.prerequisites.length > 0 ? (
        <Field label="Prerequisites">
          <div className="flex flex-wrap gap-1.5">
            {data.prerequisites.map((p) => (
              <Badge key={p} variant="secondary" className="font-normal">
                {p}
              </Badge>
            ))}
          </div>
        </Field>
      ) : null}

      {data.related.length > 0 ? (
        <Field label="Explore next">
          <div className="flex flex-col gap-1.5">
            {data.related.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => openConcept(r)}
                className="group flex items-center justify-between rounded-md border border-border/70 px-3 py-2 text-left text-sm transition-colors hover:border-primary/40 hover:bg-accent"
              >
                {r}
                <ArrowRightIcon className="size-3.5 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </button>
            ))}
          </div>
        </Field>
      ) : null}
    </div>
  )
}
