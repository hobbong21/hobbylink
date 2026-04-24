import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

/**
 * Allowlist of hostnames used by real browser push services.
 * Exact matches or suffix patterns are kept as narrow as possible.
 *
 * Chrome / Android  – https://fcm.googleapis.com/...
 * Firefox           – https://updates.push.services.mozilla.com/...
 * Safari / Apple    – https://web.push.apple.com/...
 * Edge / Windows    – https://wns2-*.notify.windows.com/... and the root domain
 */
const PUSH_EXACT_HOSTS = new Set([
  "fcm.googleapis.com",
  "updates.push.services.mozilla.com",
  "push.apple.com",
  "web.push.apple.com",
  "notify.windows.com",
])

function isAllowedPushEndpoint(raw: string): boolean {
  try {
    const u = new URL(raw)
    if (u.protocol !== "https:") return false
    const host = u.hostname.toLowerCase()
    if (PUSH_EXACT_HOSTS.has(host)) return true
    // Firefox can use region-prefixed push hosts
    if (host.endsWith(".push.services.mozilla.com")) return true
    // Windows Notification Service uses region-prefixed wns2-* subdomains
    if (/^wns2-[a-z0-9]+\.notify\.windows\.com$/.test(host)) return true
    // Apple uses region-scoped push subdomains (e.g. web.push.apple.com is already exact above)
    if (host.endsWith(".push.apple.com")) return true
    return false
  } catch {
    return false
  }
}

const Schema = z.object({
  subscription: z.object({
    endpoint: z
      .string()
      .url()
      .refine(isAllowedPushEndpoint, {
        message: "endpoint must be a recognised browser push service URL",
      }),
    keys: z.object({
      p256dh: z.string().min(1),
      auth: z.string().min(1),
    }),
  }),
  userAgent: z.string().max(500).optional(),
})

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false }, { status: 401 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, message: "invalid JSON" }, { status: 400 })
  }
  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: parsed.error.issues[0]?.message ?? "invalid payload" },
      { status: 400 },
    )
  }

  const { subscription, userAgent } = parsed.data
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      user_agent: userAgent ?? null,
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: "endpoint" },
  )
  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false }, { status: 401 })

  const url = new URL(req.url)
  const endpoint = url.searchParams.get("endpoint")
  if (!endpoint) {
    return NextResponse.json({ ok: false, message: "endpoint required" }, { status: 400 })
  }

  await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", user.id)
    .eq("endpoint", endpoint)

  return NextResponse.json({ ok: true })
}
