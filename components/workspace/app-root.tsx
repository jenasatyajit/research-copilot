"use client"

import { usePaperSession } from "@/components/providers/paper-session"
import { Landing } from "@/components/landing/landing"
import { Workspace } from "@/components/workspace/workspace"
import { useParams } from "next/navigation"
import { Spinner } from "@/components/ui/spinner"

export function AppRoot() {
  const { paper, processStatus, processError } = usePaperSession()
  const params = useParams()
  const hasId = !!params?.id

  if (hasId) {
    if (processStatus === "loading") {
      return (
        <div className="flex min-h-svh flex-col items-center justify-center bg-background">
          <Spinner className="size-8 text-primary" />
          <p className="mt-4 text-sm text-muted-foreground animate-pulse">
            Loading research paper...
          </p>
        </div>
      )
    }

    if (processStatus === "error" && processError) {
      return (
        <div className="flex min-h-svh flex-col items-center justify-center bg-background px-6 text-center">
          <h1 className="text-xl font-semibold text-destructive">Failed to load paper</h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-md">
            {processError.message}
          </p>
          <button
            onClick={() => window.location.href = "/"}
            className="mt-6 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            Go back home
          </button>
        </div>
      )
    }

    if (paper) {
      return <Workspace />
    }
  }

  return <Landing />
}
