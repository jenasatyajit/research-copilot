"use client"

import { CircleAlertIcon, RotateCwIcon } from "lucide-react"

import type { ClientError } from "@/lib/errors"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

interface LoadErrorProps {
  error: ClientError
  onRetry?: () => void
  title?: string
}

/** Compact, recoverable error block used inside panels. */
export function LoadError({ error, onRetry, title = "Couldn't generate this" }: LoadErrorProps) {
  return (
    <Alert variant="destructive" className="rounded-lg">
      <CircleAlertIcon />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        <p>{error.message}</p>
        {error.hint ? <p className="text-muted-foreground">{error.hint}</p> : null}
        {onRetry ? (
          <Button variant="outline" size="sm" className="mt-1 w-fit" onClick={onRetry}>
            <RotateCwIcon data-icon="inline-start" />
            Try again
          </Button>
        ) : null}
      </AlertDescription>
    </Alert>
  )
}
