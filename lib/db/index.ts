import { getDbConnection } from "./connection"
import { runMigrations } from "./migrate"

const db = getDbConnection()

// Run database migrations on startup/first import
try {
  runMigrations(db)
} catch (err) {
  console.error("[DB] Failed to initialize database and run migrations:", err)
  throw err
}

export { db }
