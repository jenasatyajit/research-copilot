import "server-only"

import type { z } from "zod"

import { AppError } from "./errors"

/** Parse a JSON request body, throwing a clean BAD_REQUEST on failure. */
export async function readJson<T = unknown>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T
  } catch {
    throw new AppError("BAD_REQUEST", "Request body was not valid JSON.")
  }
}

/** Validate a value against a Zod schema, throwing BAD_REQUEST on mismatch. */
export function parseBody<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value)
  if (!result.success) {
    const issue = result.error.issues[0]
    throw new AppError(
      "BAD_REQUEST",
      issue ? `Invalid request: ${issue.path.join(".")} ${issue.message}` : "Invalid request body.",
    )
  }
  return result.data
}
