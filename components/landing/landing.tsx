"use client"

import { useState } from "react"
import {
  ArrowRightIcon,
  CircleAlertIcon,
  Link2Icon,
  TelescopeIcon,
} from "lucide-react"

import { APP_NAME, EXAMPLE_PAPERS } from "@/lib/constants"
import { usePaperSession } from "@/components/providers/paper-session"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"

export function Landing() {
  const { processUrl, processStatus, processError } = usePaperSession()
  const [value, setValue] = useState("")
  const isLoading = processStatus === "loading"

  function submit() {
    const url = value.trim()
    if (!url || isLoading) return
    void processUrl(url)
  }

  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-6">
      <BackdropGlow />

      <div className="relative z-10 flex w-full max-w-2xl flex-col items-center text-center">
        <div className="mb-8 flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/20">
            <TelescopeIcon className="size-5" />
          </span>
          <span className="font-mono text-sm font-medium tracking-tight text-muted-foreground">
            {APP_NAME}
          </span>
        </div>

        <h1 className="reading-balance max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl">
          Understand any research paper in{" "}
          <span className="text-primary">under 10 minutes</span>.
        </h1>
        <p className="mt-4 max-w-md text-base text-pretty text-muted-foreground">
          Paste an arXiv link or PDF. Get a plain-English explanation, explore
          every concept, and ask anything — without leaving to Google.
        </p>

        <div className="mt-9 w-full max-w-xl">
          <InputGroup className="h-12 rounded-2xl bg-card/80 ring-1 ring-border backdrop-blur">
            <InputGroupAddon>
              <Link2Icon className="text-muted-foreground" />
            </InputGroupAddon>
            <InputGroupInput
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit()
              }}
              placeholder="https://arxiv.org/abs/1706.03762"
              aria-label="Paper URL"
              disabled={isLoading}
              autoFocus
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                variant="default"
                size="sm"
                className="rounded-xl px-3"
                onClick={submit}
                disabled={isLoading || !value.trim()}
              >
                {isLoading ? (
                  <>
                    <Spinner />
                    Analyzing
                  </>
                ) : (
                  <>
                    Analyze
                    <ArrowRightIcon />
                  </>
                )}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>

          {isLoading ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Downloading, extracting, and reading the paper — this can take up
              to 30 seconds.
            </p>
          ) : (
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs text-muted-foreground">Try:</span>
              {EXAMPLE_PAPERS.map((paper) => (
                <Button
                  key={paper.url}
                  variant="outline"
                  size="sm"
                  className="h-7 rounded-full text-xs font-normal text-muted-foreground"
                  onClick={() => {
                    setValue(paper.url)
                    void processUrl(paper.url)
                  }}
                >
                  {paper.title}
                </Button>
              ))}
            </div>
          )}
        </div>

        {processError && !isLoading ? (
          <Alert variant="destructive" className="mt-6 max-w-xl text-left">
            <CircleAlertIcon />
            <AlertTitle>Couldn&apos;t process that paper</AlertTitle>
            <AlertDescription>
              <p>{processError.message}</p>
              {processError.hint ? (
                <p className="text-muted-foreground">{processError.hint}</p>
              ) : null}
            </AlertDescription>
          </Alert>
        ) : null}
      </div>

      <footer className="absolute bottom-6 z-10 text-center text-xs text-muted-foreground">
        Learning-first · No account needed · arXiv &amp; PDF supported
      </footer>
    </main>
  )
}

function BackdropGlow() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="absolute top-1/3 left-1/2 size-[42rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/8 blur-[120px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_55%,var(--background))]" />
    </div>
  )
}
