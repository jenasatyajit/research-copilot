"use client"

import { createContext, useContext, useState } from "react"

import type { ExplanationMode } from "@/types"

interface ModeContextValue {
  mode: ExplanationMode
  setMode: (mode: ExplanationMode) => void
}

const ModeContext = createContext<ModeContextValue | null>(null)

export function ModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ExplanationMode>("standard")

  return (
    <ModeContext.Provider value={{ mode, setMode }}>
      {children}
    </ModeContext.Provider>
  )
}

export function useMode(): ModeContextValue {
  const ctx = useContext(ModeContext)
  if (!ctx) throw new Error("useMode must be used within a ModeProvider")
  return ctx
}
