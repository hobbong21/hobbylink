import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * Called periodically by the client to stamp the caller's `last_active_at`.
 * Cheap enough that we don't rate-limit; in heavy traffic the server's own
 * HTTP gateway will drop excess requests.
 */
export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false }, { status: 401 })

  await supabase
    .from("profiles")
    .update({ last_active_at: new Date().toISOString() })
    .eq("id", user.id)

  return NextResponse.json({ ok: true })
}
