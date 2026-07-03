"use client"

import { useEffect, useRef, useState } from "react"

import { usePaperSession } from "@/components/providers/paper-session"
import { Textarea } from "@/components/ui/textarea"

/** Per-paper notes, persisted to localStorage (no backend). */
export function Notes() {
  const { paper } = usePaperSession()
  const storageKey = paper ? `research-copilot:notes:${paper.id}` : null
  const [value, setValue] = useState("")
  const [saved, setSaved] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!storageKey) return
    setValue(window.localStorage.getItem(storageKey) ?? "")
  }, [storageKey])

  function handleChange(next: string) {
    setValue(next)
    setSaved(false)
    if (!storageKey) return
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      window.localStorage.setItem(storageKey, next)
      setSaved(true)
    }, 400)
  }

  return (
    <div className="flex h-full flex-col gap-2 p-3">
      <div className="flex items-center justify-between px-0.5">
        <span className="text-xs font-medium text-muted-foreground">Your notes</span>
        <span className="text-[0.7rem] text-muted-foreground/70">
          {saved ? "Saved" : value ? "Editing…" : ""}
        </span>
      </div>
      <Textarea
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Jot down questions, insights, or things to revisit. Saved on this device."
        className="scroll-thin min-h-0 flex-1 resize-none rounded-lg text-sm leading-relaxed"
      />
    </div>
  )
}
