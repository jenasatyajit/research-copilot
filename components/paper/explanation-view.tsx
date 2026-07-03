"use client"

import { BookOpenIcon } from "lucide-react"

import { usePaperSession } from "@/components/providers/paper-session"
import { Markdown } from "@/components/shared/markdown"
import { LoadError } from "@/components/shared/load-error"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"

export function ExplanationView() {
  const { explanation, retryExplanation } = usePaperSession()
  const hasText = explanation.text.length > 0
  const isStreaming = explanation.status === "streaming"

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <CardHeader className="border-b py-3.5">
        <div className="flex items-center gap-2">
          <BookOpenIcon className="size-4 text-primary" />
          <CardTitle className="text-sm font-medium">5-minute explanation</CardTitle>
          {isStreaming ? (
            <span className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
              <Spinner className="size-3" />
              Writing…
            </span>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="p-5">
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
              <Skeleton key={i} className="h-3.5" style={{ width: `${90 - (i % 3) * 12}%` }} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
