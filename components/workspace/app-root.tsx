"use client"

import { usePaperSession } from "@/components/providers/paper-session"
import { Landing } from "@/components/landing/landing"
import { Workspace } from "@/components/workspace/workspace"

export function AppRoot() {
  const { paper } = usePaperSession()
  return paper ? <Workspace /> : <Landing />
}
