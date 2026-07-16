"use client"

import { useEffect, useState } from "react"
import {
  ArrowRightIcon,
  BookOpenIcon,
  CircleAlertIcon,
  Link2Icon,
  TelescopeIcon,
  ZapIcon,
} from "lucide-react"

import { APP_NAME, EXAMPLE_PAPERS } from "@/lib/constants"
import { usePaperSession } from "@/components/providers/paper-session"
import { useMode } from "@/components/providers/mode-provider"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"
import type { ExplanationMode, PaperMeta } from "@/types"

export function Landing() {
  const { processUrl, processStatus, processError } = usePaperSession()
  const { mode, setMode } = useMode()
  const [value, setValue] = useState("")
  const [recentPapers, setRecentPapers] = useState<PaperMeta[]>([])
  const isLoading = processStatus === "loading"

  useEffect(() => {
    fetch("/api/papers/recent")
      .then((r) => r.json() as Promise<{ papers: PaperMeta[] }>)
      .then((data) => {
        if (data && Array.isArray(data.papers)) {
          setRecentPapers(data.papers)
        }
      })
      .catch((err) => console.error("Failed to load recent papers list:", err))
  }, [])

  function submit() {
    const url = value.trim()
    if (!url || isLoading) return
    void processUrl(url)
  }

  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-6 py-16">
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

        {/* Mode Toggle */}
        <div className="mt-7 flex items-center gap-1 rounded-full bg-muted/50 p-1 ring-1 ring-border/50">
          <ModeButton
            active={mode === "standard"}
            onClick={() => setMode("standard")}
            icon={<ZapIcon className="size-3.5" />}
            label="Standard"
            description="Concise, direct"
          />
          <ModeButton
            active={mode === "learning"}
            onClick={() => setMode("learning")}
            icon={<BookOpenIcon className="size-3.5" />}
            label="Learning"
            description="Step-by-step, beginner-friendly"
          />
        </div>

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

          {!isLoading && recentPapers.length > 0 && (
            <div className="mt-12 flex flex-col items-center">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 mb-3.5">
                Recently Analyzed Papers
              </h2>
              <div className="flex flex-col gap-2.5 w-full max-w-xl">
                {recentPapers.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setValue(p.sourceUrl)
                      void processUrl(p.sourceUrl)
                    }}
                    className="flex flex-col items-start gap-1 rounded-2xl border border-border/50 bg-card/30 p-4 text-left transition-all hover:border-primary/30 hover:bg-card/70 group"
                  >
                    <span className="text-sm font-medium leading-snug line-clamp-1 group-hover:text-primary transition-colors">
                      {p.title}
                    </span>
                    {p.authors && p.authors.length > 0 && (
                      <span className="text-xs text-muted-foreground/80 line-clamp-1">
                        {p.authors.join(", ")}
                      </span>
                    )}
                  </button>
                ))}
              </div>
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

      <footer className="mt-16 text-center text-xs text-muted-foreground relative z-10">
        Learning-first · No account needed · arXiv &amp; PDF supported
      </footer>
    </main>
  )
}

function ModeButton({
  active,
  onClick,
  icon,
  label,
  description,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  description: string
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
        active
          ? "bg-background text-foreground shadow-sm ring-1 ring-border/60"
          : "text-muted-foreground hover:text-foreground"
      }`}
      aria-pressed={active}
    >
      <span className={active ? "text-primary" : "text-muted-foreground/70"}>
        {icon}
      </span>
      <span>{label}</span>
      <span
        className={`hidden text-xs sm:inline ${
          active ? "text-muted-foreground" : "text-muted-foreground/60"
        }`}
      >
        · {description}
      </span>
    </button>
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
