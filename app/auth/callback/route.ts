import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * OAuth callback handler.
 * Exchanges the `code` for a session, then:
 *   - If `next` is provided and is a safe relative path, redirects there.
 *   - Else, routes new users (no display_name or <3 hobbies) to /onboarding.
 *   - Else, falls back to /.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const nextParam = searchParams.get("next") ?? ""
  const safeNext =
    nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : ""

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=oauth_callback_failed`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=oauth_callback_failed`)
  }

  if (safeNext) {
    return NextResponse.redirect(`${origin}${safeNext}`)
  }

  // Smart default: send new users to onboarding.
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) {
    const [{ data: profile }, { count }] = await Promise.all([
      supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
      supabase
        .from("user_hobbies")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id),
    ])
    if (!profile?.display_name || (count ?? 0) < 3) {
      return NextResponse.redirect(`${origin}/onboarding`)
    }
  }
  return NextResponse.redirect(`${origin}/`)
}
