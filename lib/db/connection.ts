import "server-only"
import path from "path"
import fs from "fs"
import Database from "better-sqlite3"

// Declare global cache for development hot-reloads
const globalForDb = global as unknown as {
  cachedDb?: Database.Database
}

const dbPath = process.env.DATABASE_PATH || "./data/research-copilot.db"
const absoluteDbPath = path.isAbsolute(dbPath)
  ? dbPath
  : path.resolve(/*turbopackIgnore: true*/ process.cwd(), dbPath)

/**
 * Gets or opens a connection to the SQLite database.
 * Uses a global cache in development to prevent connection leaks during hot-reloads.
 */
export function getDbConnection(): Database.Database {
  if (globalForDb.cachedDb) {
    return globalForDb.cachedDb
  }

  // Ensure target folder exists
  const dbDir = path.dirname(absoluteDbPath)
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true })
  }

  console.log(`[DB] Opening SQLite database at ${absoluteDbPath}`)
  const db = new Database(absoluteDbPath)

  // Configure SQLite performance and safety pragmas
  db.pragma("journal_mode = WAL")
  db.pragma("foreign_keys = ON")

  if (process.env.NODE_ENV !== "production") {
    globalForDb.cachedDb = db
  }

  return db
}
