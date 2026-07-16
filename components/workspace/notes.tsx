"use client"

import { useEffect, useRef, useState } from "react"

import { usePaperSession } from "@/components/providers/paper-session"
import { Textarea } from "@/components/ui/textarea"

/** Per-paper notes, persisted to SQLite DB (with client-side localStorage migration). */
export function Notes() {
  const { paper } = usePaperSession()
  const paperId = paper ? (paper.arxivId || paper.id) : null
  const storageKey = paper ? `research-copilot:notes:${paper.id}` : null

  const [value, setValue] = useState("")
  const [saved, setSaved] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!paperId) return

    let active = true
    setSaved(false)

    async function loadAndMigrateNotes() {
      try {
        const res = await fetch(`/api/notes?paperId=${paperId}`).then(
          (r) => r.json() as Promise<{ content: string }>
        )
        if (!active) return

        let noteText = res.content
        const localText = storageKey ? window.localStorage.getItem(storageKey) : null

        // One-time migration: server is empty, local has notes
        if (!noteText && localText) {
          noteText = localText
          await fetch("/api/notes", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paperId, content: localText }),
          })
          if (storageKey) {
            window.localStorage.removeItem(storageKey)
            console.log(`[Notes Migration] Migrated notes for ${paperId} to SQLite.`)
          }
        }

        setValue(noteText)
        setSaved(true)
      } catch (err) {
        console.error("Failed to load or migrate notes:", err)
      }
    }

    void loadAndMigrateNotes()

    return () => {
      active = false
    }
  }, [paperId, storageKey])

  function handleChange(next: string) {
    setValue(next)
    setSaved(false)
    if (!paperId) return
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/notes", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paperId, content: next }),
        })
        if (res.ok) {
          setSaved(true)
        }
      } catch (err) {
        console.error("Failed to save note:", err)
      }
    }, 400)
  }

  return (
    <div className="flex h-full flex-col gap-2 p-3">
      <div className="flex items-center justify-between px-0.5">
        <span className="text-xs font-medium text-muted-foreground">
          Your notes
        </span>
        <span className="text-[0.7rem] text-muted-foreground/70">
          {saved ? "Saved" : value ? "Editing…" : ""}
        </span>
      </div>
      <Textarea
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Jot down questions, insights, or things to revisit. Saved on server."
        className="scroll-thin min-h-0 flex-1 resize-none rounded-lg text-sm leading-relaxed"
      />
    </div>
  )
}
