/**
 * Server-side Web Push sender.
 *
 * Requires:
 *   - `pnpm add web-push` (optional dep)
 *   - VAPID_PUBLIC_KEY  (same as NEXT_PUBLIC_VAPID_PUBLIC_KEY)
 *   - VAPID_PRIVATE_KEY
 *   - VAPID_SUBJECT (e.g. "mailto:ops@hobbylink.example")
 *
 * Generate keys once with:
 *   npx web-push generate-vapid-keys
 */

import { createClient } from "@/lib/supabase/server"

// Exact hosts for known push providers.
const PUSH_EXACT_HOSTS = new Set([
  "fcm.googleapis.com",
  "updates.push.services.mozilla.com",
  "push.apple.com",
  "web.push.apple.com",
  "notify.windows.com",
])

function isSafePushEndpoint(endpoint: string): boolean {
  try {
    const u = new URL(endpoint)
    if (u.protocol !== "https:") return false
    const host = u.hostname.toLowerCase()
    if (PUSH_EXACT_HOSTS.has(host)) return true
    if (host.endsWith(".push.services.mozilla.com")) return true
    if (/^wns2-[a-z0-9]+\.notify\.windows\.com$/.test(host)) return true
    if (host.endsWith(".push.apple.com")) return true
    return false
  } catch {
    return false
  }
}

export interface PushPayload {
  title: string
  body: string
  url?: string
  icon?: string
}

/**
 * Sends the given payload to every active subscription of `userId`.
 * Expired subscriptions (410 Gone) are pruned from the DB.
 */
export async function sendPushToUser(userId: string, payload: PushPayload) {
  const pub = process.env.VAPID_PUBLIC_KEY
  const priv = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT ?? "mailto:ops@hobbylink.example"
  if (!pub || !priv) return { ok: false, message: "VAPID keys not configured" }

  let webpush: {
    setVapidDetails(s: string, pub: string, priv: string): void
    sendNotification(sub: {
      endpoint: string
      keys: { p256dh: string; auth: string }
    }, payload: string): Promise<unknown>
  }
  try {
    const mod = (await import(/* webpackIgnore: true */ "web-push")) as {
      default?: typeof webpush
      setVapidDetails?: typeof webpush.setVapidDetails
      sendNotification?: typeof webpush.sendNotification
    }
    webpush = (mod.default ?? mod) as typeof webpush
  } catch {
    return { ok: false, message: "web-push not installed" }
  }
  webpush.setVapidDetails(subject, pub, priv)

  const supabase = await createClient()
  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("*")
    .eq("user_id", userId)

  if (!subs || subs.length === 0) return { ok: true, sent: 0 }

  let sent = 0
  const body = JSON.stringify(payload)
  for (const s of subs) {
    const endpoint = s.endpoint as string
    if (!isSafePushEndpoint(endpoint)) {
      // Defense-in-depth: skip any stored endpoint that doesn't belong to a
      // known browser push provider. This prevents blind SSRF even if a row
      // somehow bypassed the subscribe route validation.
      await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint)
      continue
    }
    try {
      await webpush.sendNotification(
        {
          endpoint,
          keys: { p256dh: s.p256dh as string, auth: s.auth as string },
        },
        body,
      )
      sent++
    } catch (err) {
      const e = err as { statusCode?: number }
      // 404/410 → endpoint gone, prune it.
      if (e?.statusCode === 404 || e?.statusCode === 410) {
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("endpoint", endpoint)
      }
    }
  }
  return { ok: true, sent }
}
