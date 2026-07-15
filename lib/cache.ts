import fs from "fs"
import path from "path"

import { parseArxivId } from "./arxiv"

export const CACHED_IDS = ["1706.03762", "1810.04805", "1512.03385"]

/**
 * Check if the input URL or ID corresponds to a cached example paper.
 * Returns the arXiv ID if cached, otherwise null.
 */
export function getCachedArxivId(
  input: string | undefined | null
): string | null {
  if (!input) return null
  const id = parseArxivId(input)
  if (id && CACHED_IDS.includes(id)) {
    return id
  }
  return null
}

/**
 * Load cached data for a given arXiv ID and filename.
 * Returns parsed JSON for .json files or a raw string for other formats.
 */
export function loadCachedData(arxivId: string, filename: string): any {
  try {
    const filePath = path.join(
      process.cwd(),
      "lib",
      "data",
      "cached",
      arxivId,
      filename
    )
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8")
      if (filename.endsWith(".json")) {
        return JSON.parse(content)
      }
      return content
    }
  } catch (err) {
    console.error(
      `Error loading cached data for paper ${arxivId}, file ${filename}:`,
      err
    )
  }
  return null
}
