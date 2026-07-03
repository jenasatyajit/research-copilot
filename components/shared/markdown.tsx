"use client"

import "katex/dist/katex.min.css"

import { memo } from "react"
import ReactMarkdown, { type Components } from "react-markdown"
import rehypeKatex from "rehype-katex"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"

import { cn } from "@/lib/utils"

const components: Components = {
  h1: ({ children }) => <h2 className="mt-6 mb-3 text-lg font-semibold tracking-tight">{children}</h2>,
  h2: ({ children }) => (
    <h2 className="mt-6 mb-2.5 text-base font-semibold tracking-tight text-foreground">{children}</h2>
  ),
  h3: ({ children }) => <h3 className="mt-4 mb-2 text-sm font-semibold text-foreground">{children}</h3>,
  p: ({ children }) => <p className="my-3 leading-relaxed">{children}</p>,
  ul: ({ children }) => <ul className="my-3 ml-1 flex list-none flex-col gap-1.5">{children}</ul>,
  ol: ({ children }) => (
    <ol className="my-3 ml-5 flex list-decimal flex-col gap-1.5 marker:text-muted-foreground">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="relative pl-5 leading-relaxed before:absolute before:left-0 before:top-[0.65em] before:size-1.5 before:-translate-y-1/2 before:rounded-full before:bg-primary/60 [ol_&]:pl-1 [ol_&]:before:hidden">
      {children}
    </li>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-primary underline decoration-primary/30 underline-offset-2 transition-colors hover:decoration-primary"
    >
      {children}
    </a>
  ),
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  em: ({ children }) => <em className="italic text-muted-foreground">{children}</em>,
  blockquote: ({ children }) => (
    <blockquote className="my-4 border-l-2 border-primary/40 bg-muted/40 py-1 pl-4 text-muted-foreground italic">
      {children}
    </blockquote>
  ),
  code: ({ className, children }) => {
    const isBlock = Boolean(className)
    if (isBlock) {
      return <code className={cn("font-mono text-[0.85em]", className)}>{children}</code>
    }
    return (
      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground">
        {children}
      </code>
    )
  },
  pre: ({ children }) => (
    <pre className="scroll-thin my-4 overflow-x-auto rounded-lg border bg-muted/50 p-4 text-sm leading-relaxed">
      {children}
    </pre>
  ),
  hr: () => <hr className="my-6 border-border" />,
  table: ({ children }) => (
    <div className="scroll-thin my-4 overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border-b bg-muted/50 px-3 py-2 text-left font-semibold">{children}</th>
  ),
  td: ({ children }) => <td className="border-b px-3 py-2 align-top">{children}</td>,
}

interface MarkdownProps {
  children: string
  className?: string
}

/** Styled Markdown renderer with GFM tables and KaTeX math support. */
export const Markdown = memo(function Markdown({ children, className }: MarkdownProps) {
  return (
    <div className={cn("text-sm text-foreground/90", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={components}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
})
