import "server-only"

import { extractText, getDocumentProxy } from "unpdf"

import { AppError } from "./errors"

const MAX_PDF_BYTES = 40 * 1024 * 1024 // 40 MB

/** Download a PDF, validating it's actually a PDF and not too large. */
export async function downloadPdf(url: string): Promise<Uint8Array> {
  let res: Response
  try {
    res = await fetch(url, {
      headers: { "User-Agent": "ResearchCopilot/1.0", Accept: "application/pdf,*/*" },
      redirect: "follow",
      signal: AbortSignal.timeout(25_000),
    })
  } catch (err) {
    throw new AppError("DOWNLOAD_FAILED", "Couldn't download that file.", { cause: err })
  }

  if (!res.ok) {
    throw new AppError("DOWNLOAD_FAILED", `The server returned ${res.status} for that link.`)
  }

  const contentType = res.headers.get("content-type")?.toLowerCase() ?? ""
  const looksLikePdf =
    contentType.includes("pdf") ||
    contentType.includes("octet-stream") ||
    url.toLowerCase().endsWith(".pdf")
  if (contentType.includes("text/html")) {
    throw new AppError("UNSUPPORTED_SOURCE", "That link is a web page, not a PDF.", {
      hint: "Use the direct PDF link or an arXiv abstract URL.",
    })
  }
  if (!looksLikePdf) {
    throw new AppError("UNSUPPORTED_SOURCE", "That link doesn't appear to be a PDF.")
  }

  const buffer = await res.arrayBuffer()
  if (buffer.byteLength === 0) {
    throw new AppError("EMPTY_PAPER", "The downloaded file was empty.")
  }
  if (buffer.byteLength > MAX_PDF_BYTES) {
    throw new AppError("UNSUPPORTED_SOURCE", "That PDF is larger than the 40 MB limit.")
  }
  return new Uint8Array(buffer)
}

/** Collapse hyphenation and excess whitespace from extracted PDF text. */
function cleanText(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/-\n(?=\w)/g, "") // join words split across line breaks
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .trim()
}

/** Extract cleaned text from PDF bytes. */
export async function extractPdfText(bytes: Uint8Array): Promise<string> {
  let text: string
  try {
    const pdf = await getDocumentProxy(bytes)
    const result = await extractText(pdf, { mergePages: false })
    text = Array.isArray(result.text) ? result.text.join("\n\n") : result.text
  } catch (err) {
    throw new AppError("EXTRACTION_FAILED", "Couldn't parse this PDF.", { cause: err })
  }

  const cleaned = cleanText(text)
  if (cleaned.length < 500) {
    throw new AppError("EMPTY_PAPER", "This PDF has too little selectable text to analyze.", {
      hint: "It may be a scanned or image-only document. Try a different source.",
    })
  }
  return cleaned
}
