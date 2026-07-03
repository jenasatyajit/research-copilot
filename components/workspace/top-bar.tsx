"use client"

import { PanelLeftIcon, PanelRightIcon, PlusIcon, TelescopeIcon } from "lucide-react"

import { usePaperSession } from "@/components/providers/paper-session"
import { MindMapDialog } from "@/components/workspace/mind-map-dialog"
import { ThemeToggle } from "@/components/workspace/theme-toggle"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

interface TopBarProps {
  showLeft: boolean
  showRight: boolean
  onToggleLeft: () => void
  onToggleRight: () => void
}

export function TopBar({ showLeft, showRight, onToggleLeft, onToggleRight }: TopBarProps) {
  const { paper, reset } = usePaperSession()

  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b bg-sidebar px-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/12 text-primary">
          <TelescopeIcon className="size-3.5" />
        </span>
        <span className="truncate text-sm font-medium text-foreground/90">{paper?.title}</span>
      </div>

      <div className="ml-auto flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-pressed={showLeft}
              onClick={onToggleLeft}
              className="aria-pressed:text-primary"
            >
              <PanelLeftIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Toggle workspace</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-pressed={showRight}
              onClick={onToggleRight}
              className="aria-pressed:text-primary"
            >
              <PanelRightIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Toggle AI panel</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="mx-1 h-5" />

        <MindMapDialog />
        <ThemeToggle />

        <Separator orientation="vertical" className="mx-1 h-5" />

        <Button variant="outline" size="sm" onClick={reset}>
          <PlusIcon data-icon="inline-start" />
          New paper
        </Button>
      </div>
    </header>
  )
}
