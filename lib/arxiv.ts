import "server-only"

import { AppError } from "./errors"

export interface ArxivMetadata {
  title: string
  authors: string[]
  abstract: string
  published?: string
  categories: string[]
}

const NEW_ID = /(\d{4}\.\d{4,5})(v\d+)?/
const OLD_ID = /([a-z-]+(?:\.[A-Z]{2})?\/\d{7})(v\d+)?/i

/** Extract an arXiv id from a URL or bare id, or return null. */
export function parseArxivId(input: string): string | null {
  const trimmed = input.trim()
  if (/arxiv\.org/i.test(trimmed) || /^\d{4}\.\d{4,5}/.test(trimmed) || OLD_ID.test(trimmed)) {
    const newMatch = trimmed.match(NEW_ID)
    if (newMatch) return newMatch[1] + (newMatch[2] ?? "")
    const oldMatch = trimmed.match(OLD_ID)
    if (oldMatch) return oldMatch[1] + (oldMatch[2] ?? "")
  }
  return null
}

export function buildArxivPdfUrl(id: string): string {
  return `https://arxiv.org/pdf/${id}.pdf`
}

export function buildArxivAbsUrl(id: string): string {
  return `https://arxiv.org/abs/${id}`
}

function decodeXmlEntities(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim()
}

/** Fetch paper metadata from the arXiv Atom API. */
export async function fetchArxivMetadata(id: string): Promise<ArxivMetadata> {
  const baseId = id.replace(/v\d+$/, "")
  const url = `https://export.arxiv.org/api/query?id_list=${encodeURIComponent(baseId)}`

  let xml: string
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "ResearchCopilot/1.0 (mailto:hello@example.com)" },
      signal: AbortSignal.timeout(15_000),
    })
    if (!res.ok) throw new Error(`arXiv API ${res.status}`)
    xml = await res.text()
  } catch (err) {
    throw new AppError("DOWNLOAD_FAILED", "Couldn't reach the arXiv metadata API.", {
      cause: err,
    })
  }

  const entry = xml.match(/<entry>([\s\S]*?)<\/entry>/)?.[1]
  if (!entry) {
    throw new AppError("UNSUPPORTED_SOURCE", "No paper found for that arXiv id.")
  }

  const title = decodeXmlEntities(entry.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "Untitled")
  const abstract = decodeXmlEntities(entry.match(/<summary>([\s\S]*?)<\/summary>/)?.[1] ?? "")
  const published = entry.match(/<published>([\s\S]*?)<\/published>/)?.[1]?.slice(0, 10)
  const authors = [...entry.matchAll(/<name>([\s\S]*?)<\/name>/g)].map((m) =>
    decodeXmlEntities(m[1]),
  )
  const categories = [...entry.matchAll(/<category[^>]*term="([^"]+)"/g)].map((m) => m[1])

  return { title, authors, abstract, published, categories }
}
