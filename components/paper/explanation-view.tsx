"use client"

import { BookOpenIcon } from "lucide-react"

import { usePaperSession } from "@/components/providers/paper-session"
import { Markdown } from "@/components/shared/markdown"
import { LoadError } from "@/components/shared/load-error"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"

export function ExplanationView() {
  const { explanation, retryExplanation } = usePaperSession()
  const hasText = explanation.text.length > 0
  const isStreaming = explanation.status === "streaming"

  return (
    <section className="flex flex-col gap-5 px-6 py-6">
      <div className="flex items-center gap-2">
        <BookOpenIcon className="size-4 text-primary" />
        <h2 className="text-sm font-medium text-foreground">
          5-minute explanation
        </h2>
        {isStreaming ? (
          <span className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
            <Spinner className="size-3" />
            Writing…
          </span>
        ) : null}
      </div>

      {explanation.status === "error" && !hasText && explanation.error ? (
        <LoadError error={explanation.error} onRetry={retryExplanation} />
      ) : hasText ? (
        <div className="reading max-w-none">
          <Markdown>{explanation.text}</Markdown>
          {isStreaming ? (
            <span className="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-primary align-middle" />
          ) : null}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-3.5"
              style={{ width: `${90 - (i % 3) * 12}%` }}
            />
          ))}
        </div>
      )}
    </section>
  )
}
