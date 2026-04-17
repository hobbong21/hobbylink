import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * GET /api/mentions/suggest?q=<prefix>
 *
 * Lightweight autocomplete for @username-style mentions. Returns up to 8
 * matching display_names. Only accessible to authenticated users so bots
 * can't scrape the member directory.
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ suggestions: [] }, { status: 401 })

  const q = (req.nextUrl.searchParams.get("q") ?? "").trim()
  if (q.length < 1) return NextResponse.json({ suggestions: [] })

  const like = `${q.replace(/[%_]/g, (m) => `\\${m}`)}%`
  const { data } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .ilike("display_name", like)
    .eq("is_suspended", false)
    .neq("id", user.id)
    .limit(8)

  return NextResponse.json({ suggestions: data ?? [] })
}
