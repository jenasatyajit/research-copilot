"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react"

import type { ClientError } from "@/lib/errors"
import { postJson, streamText } from "@/lib/fetcher"
import type {
  ChatMessage,
  ConceptDetail,
  ConceptRef,
  PaperSummary,
  ProcessedPaper,
  SectionExplanation,
  Conversation,
} from "@/types"

export type AsyncStatus = "idle" | "loading" | "streaming" | "done" | "error"

interface Async<T> {
  status: AsyncStatus
  data?: T
  error?: ClientError
}

interface StreamState {
  status: AsyncStatus
  text: string
  error?: ClientError
}

export interface ActiveConcept {
  term: string
  status: AsyncStatus
  data?: ConceptDetail
  error?: ClientError
}

interface SessionValue {
  paper: ProcessedPaper | null
  processStatus: AsyncStatus
  processError?: ClientError
  summary: Async<PaperSummary>
  explanation: StreamState
  sections: Async<SectionExplanation[]>
  concepts: Async<ConceptRef[]>
  mindmap: { status: AsyncStatus; mermaid?: string; error?: ClientError }
  activeConcept: ActiveConcept | null
  chat: ChatMessage[]
  chatStatus: AsyncStatus
  chatError?: ClientError
  activeConversationId: string | null
  conversations: Conversation[]
  processUrl: (url: string) => Promise<void>
  reset: () => void
  retrySummary: () => void
  retryExplanation: () => void
  retrySections: () => void
  retryConcepts: () => void
  openConcept: (term: string) => void
  closeConcept: () => void
  generateMindMap: () => void
  sendMessage: (question: string) => void
  switchConversation: (id: string) => Promise<void>
  createNewConversation: (title?: string) => Promise<void>
  deleteConversation: (id: string) => Promise<void>
}

const PaperSessionContext = createContext<SessionValue | null>(null)

function isAbort(err: unknown): boolean {
  return err instanceof DOMException && err.name === "AbortError"
}

function asClientError(err: unknown): ClientError {
  if (err && typeof err === "object" && "code" in err && "message" in err) {
    return err as ClientError
  }
  return { code: "UNKNOWN", message: "Something went wrong. Please try again." }
}

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function PaperSessionProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [paper, setPaper] = useState<ProcessedPaper | null>(null)
  const [processStatus, setProcessStatus] = useState<AsyncStatus>("idle")
  const [processError, setProcessError] = useState<ClientError | undefined>()

  const [summary, setSummary] = useState<Async<PaperSummary>>({
    status: "idle",
  })
  const [explanation, setExplanation] = useState<StreamState>({
    status: "idle",
    text: "",
  })
  const [sections, setSections] = useState<Async<SectionExplanation[]>>({
    status: "idle",
  })
  const [concepts, setConcepts] = useState<Async<ConceptRef[]>>({
    status: "idle",
  })
  const [mindmap, setMindmap] = useState<{
    status: AsyncStatus
    mermaid?: string
    error?: ClientError
  }>({ status: "idle" })
  const [activeConcept, setActiveConcept] = useState<ActiveConcept | null>(null)
  const [chat, setChat] = useState<ChatMessage[]>([])
  const [chatStatus, setChatStatus] = useState<AsyncStatus>("idle")
  const [chatError, setChatError] = useState<ClientError | undefined>()

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)

  const paperRef = useRef<ProcessedPaper | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const signal = () => abortRef.current?.signal

  const runSummary = useCallback(async (target: ProcessedPaper) => {
    setSummary({ status: "loading" })
    try {
      const res = await postJson<{ summary: PaperSummary }>(
        "/api/summary",
        { paper: target },
        signal()
      )
      setSummary({ status: "done", data: res.summary })
    } catch (err) {
      if (isAbort(err)) return
      setSummary({ status: "error", error: asClientError(err) })
    }
  }, [])

  const runExplanation = useCallback(async (target: ProcessedPaper) => {
    setExplanation({ status: "streaming", text: "" })
    try {
      await streamText(
        "/api/explanation",
        { paper: target },
        {
          onChunk: (_, full) =>
            setExplanation({ status: "streaming", text: full }),
          signal: signal(),
        }
      )
      setExplanation((s) => ({ status: "done", text: s.text }))
    } catch (err) {
      if (isAbort(err)) return
      setExplanation((s) => ({
        status: "error",
        text: s.text,
        error: asClientError(err),
      }))
    }
  }, [])

  const runSections = useCallback(async (target: ProcessedPaper) => {
    setSections({ status: "loading" })
    try {
      const res = await postJson<{ sections: SectionExplanation[] }>(
        "/api/sections",
        { paper: target },
        signal()
      )
      setSections({ status: "done", data: res.sections })
    } catch (err) {
      if (isAbort(err)) return
      setSections({ status: "error", error: asClientError(err) })
    }
  }, [])

  const runConcepts = useCallback(async (target: ProcessedPaper) => {
    setConcepts({ status: "loading" })
    try {
      const res = await postJson<{ concepts: ConceptRef[] }>(
        "/api/concepts",
        { paper: target },
        signal()
      )
      setConcepts({ status: "done", data: res.concepts })
    } catch (err) {
      if (isAbort(err)) return
      setConcepts({ status: "error", error: asClientError(err) })
    }
  }, [])

  const startGenerations = useCallback(
    (target: ProcessedPaper) => {
      void runSummary(target)
      void runExplanation(target)
      void runSections(target)
      void runConcepts(target)
    },
    [runSummary, runExplanation, runSections, runConcepts]
  )

  const loadConversations = useCallback(async (paperId: string) => {
    try {
      const res = await fetch(`/api/conversations?paperId=${paperId}`).then(
        (r) => r.json() as Promise<{ conversations: Conversation[] }>
      )
      let list = res.conversations

      // If no conversations exist, create a default one
      if (list.length === 0) {
        const createRes = await postJson<{ conversation: Conversation }>(
          "/api/conversations",
          {
            paperId,
            title: "Initial Chat",
          }
        )
        list = [createRes.conversation]
      }

      setConversations(list)

      // Default to the first (most recently updated) conversation
      const activeId = list[0].id
      setActiveConversationId(activeId)

      // Load messages for this active conversation
      const msgRes = await fetch(`/api/conversations/${activeId}/messages`).then(
        (r) => r.json() as Promise<{ messages: ChatMessage[] }>
      )
      setChat(msgRes.messages)
    } catch (err) {
      console.error("Failed to load conversations:", err)
    }
  }, [])

  const reset = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    paperRef.current = null
    setPaper(null)
    setProcessStatus("idle")
    setProcessError(undefined)
    setSummary({ status: "idle" })
    setExplanation({ status: "idle", text: "" })
    setSections({ status: "idle" })
    setConcepts({ status: "idle" })
    setMindmap({ status: "idle" })
    setActiveConcept(null)
    setChat([])
    setChatStatus("idle")
    setChatError(undefined)
    setConversations([])
    setActiveConversationId(null)
  }, [])

  const processUrl = useCallback(
    async (url: string) => {
      abortRef.current?.abort()
      abortRef.current = new AbortController()
      setProcessStatus("loading")
      setProcessError(undefined)
      try {
        const res = await postJson<{ paper: ProcessedPaper }>(
          "/api/process",
          { url },
          abortRef.current.signal
        )
        paperRef.current = res.paper
        setPaper(res.paper)
        setProcessStatus("done")
        startGenerations(res.paper)
        // Load conversations
        void loadConversations(res.paper.arxivId || res.paper.id)
      } catch (err) {
        if (isAbort(err)) return
        setProcessStatus("error")
        setProcessError(asClientError(err))
      }
    },
    [startGenerations, loadConversations]
  )

  const retrySummary = useCallback(() => {
    if (paperRef.current) void runSummary(paperRef.current)
  }, [runSummary])
  const retryExplanation = useCallback(() => {
    if (paperRef.current) void runExplanation(paperRef.current)
  }, [runExplanation])
  const retrySections = useCallback(() => {
    if (paperRef.current) void runSections(paperRef.current)
  }, [runSections])
  const retryConcepts = useCallback(() => {
    if (paperRef.current) void runConcepts(paperRef.current)
  }, [runConcepts])

  const openConcept = useCallback(async (term: string) => {
    const target = paperRef.current
    if (!target) return
    setActiveConcept({ term, status: "loading" })
    try {
      const res = await postJson<{ concept: ConceptDetail }>(
        "/api/concept",
        { paper: target, term },
        signal()
      )
      setActiveConcept({ term, status: "done", data: res.concept })
    } catch (err) {
      if (isAbort(err)) return
      setActiveConcept({ term, status: "error", error: asClientError(err) })
    }
  }, [])

  const closeConcept = useCallback(() => setActiveConcept(null), [])

  const generateMindMap = useCallback(async () => {
    const target = paperRef.current
    if (!target) return
    setMindmap({ status: "loading" })
    try {
      const res = await postJson<{ mermaid: string }>(
        "/api/mindmap",
        { paper: target },
        signal()
      )
      setMindmap({ status: "done", mermaid: res.mermaid })
    } catch (err) {
      if (isAbort(err)) return
      setMindmap({ status: "error", error: asClientError(err) })
    }
  }, [])

  const switchConversation = useCallback(async (id: string) => {
    setActiveConversationId(id)
    setChatStatus("loading")
    try {
      const msgRes = await fetch(`/api/conversations/${id}/messages`).then(
        (r) => r.json() as Promise<{ messages: ChatMessage[] }>
      )
      setChat(msgRes.messages)
      setChatStatus("idle")
    } catch (err) {
      setChatStatus("error")
      setChatError(asClientError(err))
    }
  }, [])

  const createNewConversation = useCallback(async (title?: string) => {
    const target = paperRef.current
    if (!target) return
    try {
      const paperKey = target.arxivId || target.id
      const res = await postJson<{ conversation: Conversation }>(
        "/api/conversations",
        {
          paperId: paperKey,
          title: title || `Thread ${conversations.length + 1}`,
        }
      )
      setConversations((prev) => [res.conversation, ...prev])
      setActiveConversationId(res.conversation.id)
      setChat([])
      setChatStatus("idle")
    } catch (err) {
      console.error("Failed to create new conversation:", err)
    }
  }, [conversations])

  const deleteConversation = useCallback(async (id: string) => {
    const target = paperRef.current
    if (!target) return
    try {
      await fetch(`/api/conversations/${id}`, { method: "DELETE" })

      const updatedList = conversations.filter((c) => c.id !== id)

      // If we deleted the active one, switch to another
      if (activeConversationId === id) {
        if (updatedList.length > 0) {
          const nextActiveId = updatedList[0].id
          setConversations(updatedList)
          setActiveConversationId(nextActiveId)
          // Load messages
          const msgRes = await fetch(
            `/api/conversations/${nextActiveId}/messages`
          ).then((r) => r.json() as Promise<{ messages: ChatMessage[] }>)
          setChat(msgRes.messages)
        } else {
          // Create new default conversation
          const paperKey = target.arxivId || target.id
          const createRes = await postJson<{ conversation: Conversation }>(
            "/api/conversations",
            {
              paperId: paperKey,
              title: "Initial Chat",
            }
          )
          setConversations([createRes.conversation])
          setActiveConversationId(createRes.conversation.id)
          setChat([])
        }
      } else {
        setConversations(updatedList)
      }
    } catch (err) {
      console.error("Failed to delete conversation:", err)
    }
  }, [conversations, activeConversationId])

  const sendMessage = useCallback(
    async (question: string) => {
      const target = paperRef.current
      const trimmed = question.trim()
      if (!target || !trimmed || chatStatus === "streaming") return

      const history = chat
      const userMsgId = newId()
      const assistantMsgId = newId()

      const userMessage: ChatMessage = {
        id: userMsgId,
        role: "user",
        content: trimmed,
      }
      const assistantMessage: ChatMessage = {
        id: assistantMsgId,
        role: "assistant",
        content: "",
      }

      setChat([...history, userMessage, assistantMessage])
      setChatStatus("streaming")
      setChatError(undefined)

      try {
        await streamText(
          "/api/chat",
          {
            paper: target,
            history,
            question: trimmed,
            conversationId: activeConversationId,
            userMessageId: userMsgId,
            assistantMessageId: assistantMsgId,
          },
          {
            onChunk: (_, full) =>
              setChat((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId ? { ...m, content: full } : m
                )
              ),
            signal: signal(),
          }
        )
        setChatStatus("done")

        // Update updatedAt time of active conversation to sort it to the top
        if (activeConversationId) {
          setConversations((prev) =>
            prev
              .map((c) =>
                c.id === activeConversationId
                  ? { ...c, updatedAt: Date.now() }
                  : c
              )
              .sort((a, b) => b.updatedAt - a.updatedAt)
          )
        }
      } catch (err) {
        if (isAbort(err)) return
        const e = asClientError(err)
        setChatError(e)
        setChatStatus("error")
        setChat((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId && !m.content
              ? { ...m, content: `_${e.message}_` }
              : m
          )
        )
      }
    },
    [chat, chatStatus, activeConversationId]
  )

  const value = useMemo<SessionValue>(
    () => ({
      paper,
      processStatus,
      processError,
      summary,
      explanation,
      sections,
      concepts,
      mindmap,
      activeConcept,
      chat,
      chatStatus,
      chatError,
      activeConversationId,
      conversations,
      processUrl,
      reset,
      retrySummary,
      retryExplanation,
      retrySections,
      retryConcepts,
      openConcept,
      closeConcept,
      generateMindMap,
      sendMessage,
      switchConversation,
      createNewConversation,
      deleteConversation,
    }),
    [
      paper,
      processStatus,
      processError,
      summary,
      explanation,
      sections,
      concepts,
      mindmap,
      activeConcept,
      chat,
      chatStatus,
      chatError,
      activeConversationId,
      conversations,
      processUrl,
      reset,
      retrySummary,
      retryExplanation,
      retrySections,
      retryConcepts,
      openConcept,
      closeConcept,
      generateMindMap,
      sendMessage,
      switchConversation,
      createNewConversation,
      deleteConversation,
    ]
  )

  return (
    <PaperSessionContext.Provider value={value}>
      {children}
    </PaperSessionContext.Provider>
  )
}

export function usePaperSession(): SessionValue {
  const ctx = useContext(PaperSessionContext)
  if (!ctx) {
    throw new Error(
      "usePaperSession must be used within a PaperSessionProvider"
    )
  }
  return ctx
}
