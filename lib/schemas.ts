import { z } from "zod"

/** Validates the paper context sent by the client to AI endpoints. */
export const rawSectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
})

export const paperInputSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  authors: z.array(z.string()).default([]),
  abstract: z.string().default(""),
  fullText: z.string().min(1),
  sections: z.array(rawSectionSchema).default([]),
  source: z.string().optional(),
  sourceUrl: z.string().optional(),
  pdfUrl: z.string().optional(),
  arxivId: z.string().optional(),
  published: z.string().optional(),
  categories: z.array(z.string()).optional(),
  wordCount: z.number().optional(),
})

/** Validates the AI summary JSON. */
export const summarySchema = z.object({
  problem: z.string(),
  solution: z.string(),
  keyInnovation: z.string(),
  results: z.string(),
  whyItMatters: z.string(),
  shouldYouRead: z.string(),
})

/** Validates the AI section-explanations JSON. */
export const sectionsResponseSchema = z.object({
  sections: z
    .array(
      z.object({
        sectionId: z.string(),
        explanation: z.string(),
        keyTakeaway: z.string(),
        whyItMatters: z.string(),
      })
    )
    .min(1),
})

/** Validates the AI concept-list JSON. */
export const conceptsResponseSchema = z.object({
  concepts: z
    .array(
      z.object({
        term: z.string(),
        short: z.string(),
      })
    )
    .min(1),
})

/** Validates the AI single-concept-detail JSON. */
export const conceptDetailSchema = z.object({
  definition: z.string(),
  simpleExplanation: z.string(),
  analogy: z.string(),
  whyUsedHere: z.string(),
  prerequisites: z.array(z.string()).default([]),
  related: z.array(z.string()).default([]),
})
