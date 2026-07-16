import { db } from "@/lib/db"
import { errorResponse } from "@/lib/errors"

export const runtime = "nodejs"

export async function GET() {
  try {
    // Query database to ensure connection is live and migrations are applied
    const result = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()
    return Response.json({
      status: "healthy",
      database: "connected",
      tablesCount: result.length,
    })
  } catch (err) {
    return errorResponse(err)
  }
}
