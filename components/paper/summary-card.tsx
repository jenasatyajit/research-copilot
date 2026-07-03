"use client"

import { ClockIcon, SparklesIcon } from "lucide-react"

import { usePaperSession } from "@/components/providers/paper-session"
import { LoadError } from "@/components/shared/load-error"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { PaperSummary } from "@/types"

const FIELDS: { key: keyof Omit<PaperSummary, "shouldYouRead">; label: string }[] = [
  { key: "problem", label: "Problem" },
  { key: "solution", label: "Solution" },
  { key: "keyInnovation", label: "Key innovation" },
  { key: "results", label: "Results" },
  { key: "whyItMatters", label: "Why it matters" },
]

export function SummaryCard() {
  const { summary, retrySummary } = usePaperSession()

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <CardHeader className="border-b py-3.5">
        <div className="flex items-center gap-2">
          <ClockIcon className="size-4 text-primary" />
          <CardTitle className="text-sm font-medium">30-second summary</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-5">
        {summary.status === "error" && summary.error ? (
          <LoadError error={summary.error} onRetry={retrySummary} />
        ) : summary.status === "done" && summary.data ? (
          <div className="flex flex-col gap-4">
            <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
              {FIELDS.map((field) => (
                <div key={field.key} className="flex flex-col gap-1">
                  <dt className="text-xs font-medium text-muted-foreground">{field.label}</dt>
                  <dd className="text-sm leading-relaxed text-foreground/90">
                    {summary.data![field.key]}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="flex items-start gap-2.5 rounded-lg bg-primary/8 p-3.5 ring-1 ring-primary/15">
              <SparklesIcon className="mt-0.5 size-4 shrink-0 text-primary" />
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-medium text-primary">Should you read this?</span>
                <p className="text-sm leading-relaxed text-foreground/90">
                  {summary.data.shouldYouRead}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <SummarySkeleton />
        )}
      </CardContent>
    </Card>
  )
}

function SummarySkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        ))}
      </div>
      <Skeleton className="h-16 w-full rounded-lg" />
    </div>
  )
}
