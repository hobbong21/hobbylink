import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * GET /api/tags/suggest?q=<prefix>
 *
 * Returns up to 8 existing tag names whose prefix matches `q`. Used by
 * MentionTextarea-style autocompletes during post composition.
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ suggestions: [] }, { status: 401 })

  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().toLowerCase()
  if (q.length < 1) return NextResponse.json({ suggestions: [] })

  const like = `${q.replace(/[%_]/g, (m) => `\\${m}`)}%`
  const { data } = await supabase
    .from("tags")
    .select("name")
    .ilike("name", like)
    .order("name", { ascending: true })
    .limit(8)

  return NextResponse.json({
    suggestions: (data ?? []).map((r) => r.name as string),
  })
}
