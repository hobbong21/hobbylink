import { NextResponse } from "next/server"
import { authenticatePublicRequest } from "@/lib/public-api"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/public/v1/hobbies
 *
 * Returns the full hobby catalog — id, name, category, member_count,
 * is_featured. Cached for 5 minutes at the CDN.
 */
export async function GET(req: Request) {
  const auth = await authenticatePublicRequest(req)
  if (!auth.ok) return auth.response

  const srv = process.env.SUPABASE_SERVICE_ROLE_KEY
  const dbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!srv || !dbUrl) {
    return NextResponse.json(
      { error: { code: "server_misconfigured", message: "Server misconfigured" } },
      { status: 500 },
    )
  }
  const { createClient } = await import("@supabase/supabase-js")
  const admin = createClient(dbUrl, srv, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data, error } = await admin
    .from("hobbies")
    .select("id, name, category, description, member_count, is_featured")
    .order("member_count", { ascending: false })

  if (error) {
    return NextResponse.json(
      { error: { code: "query_failed", message: error.message } },
      { status: 500 },
    )
  }

  return NextResponse.json(
    { data: data ?? [] },
    { headers: { "Cache-Control": "public, s-maxage=300" } },
  )
}
