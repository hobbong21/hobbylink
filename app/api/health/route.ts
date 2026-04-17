import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * Lightweight healthcheck endpoint.
 *
 *   GET /api/health
 *
 * Returns 200 if the server boots and Supabase is reachable, 503 otherwise.
 * Safe to hit from uptime monitors (no auth required, no secrets returned).
 */
export async function GET() {
  const startedAt = Date.now()
  try {
    const supabase = await createClient()
    // A cheap, RLS-safe check that always returns — schema presence ping.
    const { error } = await supabase.from("hobbies").select("id").limit(1)
    const latencyMs = Date.now() - startedAt

    if (error) {
      return NextResponse.json(
        { status: "degraded", latencyMs, error: error.message },
        { status: 503 },
      )
    }

    return NextResponse.json({ status: "ok", latencyMs })
  } catch (err) {
    return NextResponse.json(
      {
        status: "error",
        message: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 503 },
    )
  }
}
