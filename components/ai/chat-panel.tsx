"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowUpIcon, SparklesIcon, ChevronDownIcon, CheckIcon, PlusIcon, TrashIcon } from "lucide-react"

import { usePaperSession } from "@/components/providers/paper-session"
import { Markdown } from "@/components/shared/markdown"
import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import type { ChatMessage } from "@/types"

const SUGGESTIONS = [
  "Explain the core idea as simply as possible",
  "What are the main limitations?",
  "How would I implement this?",
  "How does this compare to prior work?",
]

export function ChatPanel() {
  const {
    paper,
    chat,
    chatStatus,
    sendMessage,
    conversations,
    activeConversationId,
    switchConversation,
    createNewConversation,
    deleteConversation,
  } = usePaperSession()
  const [input, setInput] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)
  const isStreaming = chatStatus === "streaming"

  const activeConv = conversations.find((c) => c.id === activeConversationId)

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    })
  }, [chat])

  function submit() {
    const text = input.trim()
    if (!text || isStreaming) return
    setInput("")
    void sendMessage(text)
  }

  return (
    <div className="flex h-full flex-col bg-sidebar">
      <header className="flex h-14 shrink-0 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2">
          <SparklesIcon className="size-4 text-primary" />
          <span className="text-sm font-medium">Ask the paper</span>
        </div>
        <div className="flex items-center gap-1.5">
          {isStreaming ? (
            <Spinner className="size-3.5 text-muted-foreground mr-1" />
          ) : null}
          {paper && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs font-normal px-2.5">
                  <span className="max-w-[100px] truncate">
                    {activeConv?.title || "Threads"}
                  </span>
                  <ChevronDownIcon className="size-3 opacity-60 shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>Chat Threads</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {conversations.map((c) => (
                  <DropdownMenuItem
                    key={c.id}
                    onClick={() => switchConversation(c.id)}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="truncate flex-1">{c.title || "Untitled Chat"}</span>
                    {activeConversationId === c.id && (
                      <CheckIcon className="size-3.5 text-primary shrink-0" />
                    )}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => createNewConversation()} className="text-primary focus:text-primary">
                  <PlusIcon className="size-3.5 mr-2" />
                  New Thread
                </DropdownMenuItem>
                {conversations.length > 1 && activeConversationId && (
                  <DropdownMenuItem
                    onClick={() => deleteConversation(activeConversationId)}
                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                  >
                    <TrashIcon className="size-3.5 mr-2" />
                    Delete Thread
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>

      <div
        ref={scrollRef}
        className="scroll-thin min-h-0 flex-1 overflow-y-auto px-4 py-4"
      >
        {chat.length === 0 ? (
          <div className="flex flex-col gap-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Ask anything about this paper. Answers are grounded in its
              content.
            </p>
            <div className="flex flex-col gap-1.5">
              {SUGGESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => sendMessage(q)}
                  className="rounded-lg border border-border/70 bg-card/50 px-3 py-2 text-left text-sm text-foreground/80 transition-colors hover:border-primary/40 hover:bg-accent hover:text-foreground"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {chat.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                streaming={isStreaming}
              />
            ))}
          </div>
        )}
      </div>

      <div className="border-t p-3">
        <InputGroup className="rounded-2xl bg-card/60">
          <InputGroupTextarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                submit()
              }
            }}
            placeholder="Ask about a section, figure, or equation…"
            aria-label="Message"
            className="max-h-40 min-h-16"
          />
          <InputGroupAddon align="block-end">
            <InputGroupButton
              variant="default"
              size="icon-sm"
              className="ml-auto rounded-full"
              onClick={submit}
              disabled={isStreaming || !input.trim()}
              aria-label="Send"
            >
              <ArrowUpIcon />
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </div>
    </div>
  )
}

function MessageBubble({
  message,
  streaming,
}: {
  message: ChatMessage
  streaming: boolean
}) {
  const isUser = message.role === "user"
  const isEmptyAssistant = !isUser && message.content.length === 0

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[88%] rounded-2xl rounded-br-md bg-primary px-3.5 py-2 text-sm text-primary-foreground">
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col gap-1", isEmptyAssistant && "min-h-5")}>
      {isEmptyAssistant && streaming ? (
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Spinner className="size-3.5" />
          Thinking…
        </span>
      ) : (
        <Markdown>{message.content}</Markdown>
      )}
    </div>
  )
}
