import fs from "fs"
import path from "path"
import type Database from "better-sqlite3"

/**
 * Runs all pending migrations in the lib/db/migrations/ directory.
 * Runs each migration inside a separate transaction.
 */
export function runMigrations(db: Database.Database): void {
  // Create metadata migrations table if not exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at INTEGER NOT NULL
    );
  `)

  const migrationsDir = path.join(
    /*turbopackIgnore: true*/ process.cwd(),
    "lib",
    "db",
    "migrations"
  )

  if (!fs.existsSync(migrationsDir)) {
    console.warn(`[DB] Migrations directory not found at ${migrationsDir}`)
    return
  }

  // Find and sort all SQL migration files
  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort()

  for (const file of files) {
    // Check if migration is already applied
    const row = db.prepare("SELECT 1 FROM _migrations WHERE name = ?").get(file)
    if (row) {
      continue
    }

    console.log(`[DB] Applying database migration: ${file}`)
    const filePath = path.join(migrationsDir, file)
    const sql = fs.readFileSync(filePath, "utf-8")

    // Apply SQL and record migration entry in a single transaction
    const runInTx = db.transaction(() => {
      db.exec(sql)
      db.prepare("INSERT INTO _migrations (name, applied_at) VALUES (?, ?)")
        .run(file, Date.now())
    })

    try {
      runInTx()
      console.log(`[DB] Successfully applied migration: ${file}`)
    } catch (err) {
      console.error(`[DB] Failed to apply migration ${file}:`, err)
      throw err
    }
  }
}
