import fs from "fs"
import path from "path"
import { parseArxivId } from "@/lib/arxiv"
import { CACHED_IDS } from "@/lib/cache"

export const runtime = "nodejs"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const url = searchParams.get("url")

  if (!url) {
    return new Response("Missing 'url' query parameter", { status: 400 })
  }

  try {
    const arxivId = parseArxivId(url)
    const isCachedId = arxivId && CACHED_IDS.includes(arxivId)

    if (isCachedId) {
      const cacheDir = path.join(
        process.cwd(),
        "lib",
        "data",
        "cached",
        arxivId
      )
      const pdfPath = path.join(cacheDir, "paper.pdf")

      if (fs.existsSync(pdfPath)) {
        const fileBuffer = fs.readFileSync(pdfPath)
        return new Response(fileBuffer, {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": "inline",
          },
        })
      }

      const res = await fetch(url, {
        headers: {
          "User-Agent": "ResearchCopilot/1.0",
        },
      })

      if (!res.ok) {
        return new Response(`Failed to fetch PDF: ${res.statusText}`, {
          status: res.status,
        })
      }

      const pdfBuffer = await res.arrayBuffer()

      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true })
      }
      fs.writeFileSync(pdfPath, Buffer.from(pdfBuffer))

      return new Response(pdfBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": "inline",
        },
      })
    }

    const res = await fetch(url, {
      headers: {
        "User-Agent": "ResearchCopilot/1.0",
      },
    })

    if (!res.ok) {
      return new Response(`Failed to fetch PDF: ${res.statusText}`, {
        status: res.status,
      })
    }

    const pdfBuffer = await res.arrayBuffer()

    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline",
      },
    })
  } catch (err) {
    console.error("Error in PDF proxy:", err)
    const message = err instanceof Error ? err.message : String(err)
    return new Response(`Server error fetching PDF: ${message}`, {
      status: 500,
    })
  }
}
