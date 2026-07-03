"use client"

import { useState } from "react"

import { ChatPanel } from "@/components/ai/chat-panel"
import { CenterPanel } from "@/components/paper/center-panel"
import { ConceptSheet } from "@/components/concept/concept-sheet"
import { LeftPanel } from "@/components/workspace/left-panel"
import { TopBar } from "@/components/workspace/top-bar"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

export function Workspace() {
  const [showLeft, setShowLeft] = useState(true)
  const [showRight, setShowRight] = useState(true)

  return (
    <div className="flex h-svh flex-col overflow-hidden">
      <TopBar
        showLeft={showLeft}
        showRight={showRight}
        onToggleLeft={() => setShowLeft((v) => !v)}
        onToggleRight={() => setShowRight((v) => !v)}
      />

      <div className="min-h-0 flex-1">
        <ResizablePanelGroup orientation="horizontal">
          {showLeft ? (
            <>
              <ResizablePanel
                id="left"
                defaultSize="22%"
                minSize="15%"
                maxSize="32%"
                className="overflow-hidden"
              >
                <LeftPanel />
              </ResizablePanel>
              <ResizableHandle />
            </>
          ) : null}

          <ResizablePanel id="center" defaultSize="52%" minSize="30%" className="overflow-hidden">
            <CenterPanel />
          </ResizablePanel>

          {showRight ? (
            <>
              <ResizableHandle />
              <ResizablePanel
                id="right"
                defaultSize="26%"
                minSize="20%"
                maxSize="42%"
                className="overflow-hidden"
              >
                <ChatPanel />
              </ResizablePanel>
            </>
          ) : null}
        </ResizablePanelGroup>
      </div>

      <ConceptSheet />
    </div>
  )
}
