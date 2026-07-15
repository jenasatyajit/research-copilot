import { parseBody, readJson } from "@/lib/api"
import { getCachedArxivId, loadCachedData } from "@/lib/cache"
import { env } from "@/lib/env"
import { AppError, errorResponse } from "@/lib/errors"
import { completeJson } from "@/lib/openrouter"
import { paperInputSchema, sectionsResponseSchema } from "@/lib/schemas"
import { buildSectionsMessages, explainableSections } from "@/prompts/sections"
import type { ProcessedPaper, SectionExplanation } from "@/types"

export const runtime = "nodejs"
export const maxDuration = 120

export async function POST(req: Request) {
  try {
    const body = await readJson<{ paper?: unknown }>(req)
    const paper = parseBody(paperInputSchema, body.paper) as ProcessedPaper

    const cachedId = getCachedArxivId(paper.arxivId)
    if (cachedId) {
      const cachedSections = loadCachedData(cachedId, "sections.json")
      if (cachedSections) {
        return Response.json(cachedSections)
      }
    }

    const sections = explainableSections(paper.sections)
    if (sections.length === 0) {
      throw new AppError(
        "EMPTY_PAPER",
        "No explainable sections were detected in this paper."
      )
    }

    const result = await completeJson(
      {
        model: env.fastModel,
        messages: buildSectionsMessages(paper, sections),
        temperature: 0.3,
      },
      sectionsResponseSchema
    )

    // Merge AI output back with the detected titles, preserving paper order.
    const byId = new Map(result.sections.map((s) => [s.sectionId, s]))
    const explanations: SectionExplanation[] = sections.map((section) => {
      const ai = byId.get(section.id)
      return {
        sectionId: section.id,
        title: section.title,
        explanation: ai?.explanation ?? "",
        keyTakeaway: ai?.keyTakeaway ?? "",
        whyItMatters: ai?.whyItMatters ?? "",
      }
    })

    return Response.json({ sections: explanations })
  } catch (err) {
    return errorResponse(err)
  }
}
