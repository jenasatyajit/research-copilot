import { parseBody, readJson } from "@/lib/api"
import { getCachedArxivId, loadCachedData } from "@/lib/cache"
import { env } from "@/lib/env"
import { AppError, errorResponse } from "@/lib/errors"
import { complete } from "@/lib/openrouter"
import { paperInputSchema } from "@/lib/schemas"
import { buildMindMapMessages } from "@/prompts/mindmap"
import type { ProcessedPaper } from "@/types"

export const runtime = "nodejs"
export const maxDuration = 60

/** Strip code fences and ensure the output is a usable Mermaid graph. */
function sanitizeMermaid(raw: string): string {
  let text = raw.trim()
  const fence = text.match(/```(?:mermaid)?\s*([\s\S]*?)\s*```/i)
  if (fence) text = fence[1].trim()
  const start = text.search(/\b(graph|flowchart|mindmap)\b/i)
  if (start > 0) text = text.slice(start)
  return text.trim()
}

export async function POST(req: Request) {
  try {
    const body = await readJson<{ paper?: unknown }>(req)
    const paper = parseBody(paperInputSchema, body.paper) as ProcessedPaper

    const cachedId = getCachedArxivId(paper.arxivId)
    if (cachedId) {
      const cachedMindmap = loadCachedData(cachedId, "mindmap.json")
      if (cachedMindmap) {
        return Response.json(cachedMindmap)
      }
    }

    const raw = await complete({
      model: env.smartModel,
      messages: buildMindMapMessages(paper),
      temperature: 0.3,
      maxTokens: 1200,
    })
    const mermaid = sanitizeMermaid(raw)
    if (!/\b(graph|flowchart|mindmap)\b/i.test(mermaid)) {
      throw new AppError(
        "AI_ERROR",
        "The model didn't return a valid mind map.",
        {
          hint: "Try generating it again.",
        }
      )
    }
    return Response.json({ mermaid })
  } catch (err) {
    return errorResponse(err)
  }
}
