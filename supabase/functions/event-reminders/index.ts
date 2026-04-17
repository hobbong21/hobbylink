// deno-lint-ignore-file no-explicit-any
/**
 * Supabase Edge Function: event-reminders
 *
 * Sends one reminder per user per event for events starting within the next
 * 24 hours. Intended to be invoked by Supabase's scheduler (pg_cron) or
 * an external uptime service once per hour.
 *
 * Deploy:
 *   supabase functions deploy event-reminders
 *
 * Schedule (Supabase Dashboard → Edge Functions → Cron or SQL):
 *   select cron.schedule('event-reminders', '0 * * * *',
 *     $$select net.http_post(
 *       url:= 'https://<project>.functions.supabase.co/event-reminders',
 *       headers:= jsonb_build_object('Authorization', 'Bearer ' || <service_role>)
 *     )$$);
 *
 * Required env (set via `supabase secrets set`):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, EMAIL_FROM,
 *   SITE_URL (used in the reminder link)
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")
const EMAIL_FROM = Deno.env.get("EMAIL_FROM") ?? "HobbyLink <noreply@hobbylink.example>"
const SITE_URL = Deno.env.get("SITE_URL") ?? ""

async function sendEmail(to: string, subject: string, html: string, text: string) {
  if (!RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not set — skipping send to", to)
    return
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({ from: EMAIL_FROM, to, subject, html, text }),
  })
  if (!res.ok) {
    const body = await res.text()
    console.error("[email] send failed", res.status, body)
  }
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === '"' ? "&quot;" : "&#39;",
  )
}

Deno.serve(async (req) => {
  if (req.method !== "POST" && req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  const now = new Date()
  const soon = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  // Events starting in the next 24h.
  const { data: events, error: evErr } = await supabase
    .from("events")
    .select("id, title, event_date")
    .gte("event_date", now.toISOString())
    .lt("event_date", soon.toISOString())

  if (evErr) {
    return new Response(JSON.stringify({ ok: false, error: evErr.message }), { status: 500 })
  }

  let sent = 0
  for (const ev of events ?? []) {
    // Active participants
    const { data: participants } = await supabase
      .from("event_participants")
      .select("user_id")
      .eq("event_id", ev.id)
      .in("status", ["registered", "attended"])

    const userIds = (participants ?? []).map((p: any) => p.user_id)
    if (userIds.length === 0) continue

    // Respect notification prefs
    const { data: prefs } = await supabase
      .from("notification_prefs")
      .select("user_id, email_on_event_reminder")
      .in("user_id", userIds)
    const prefsMap = new Map<string, boolean>()
    for (const p of prefs ?? []) {
      prefsMap.set(p.user_id, (p as any).email_on_event_reminder)
    }

    const eventDateLocal = new Date(ev.event_date).toLocaleString("ko-KR")
    const eventUrl = `${SITE_URL}/events/${ev.id}`

    for (const uid of userIds) {
      // Default is opt-in if no pref row exists.
      const wantsEmail = prefsMap.get(uid) ?? true
      if (!wantsEmail) continue

      // Create in-app notification (idempotency: skip if one already exists today for this event+user).
      const since = new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString()
      const { data: existing } = await supabase
        .from("notifications")
        .select("id")
        .eq("user_id", uid)
        .eq("type", "event_reminder")
        .gte("created_at", since)
        .contains("payload", { event_id: ev.id })
        .maybeSingle()

      if (existing) continue

      await supabase.from("notifications").insert({
        user_id: uid,
        type: "event_reminder",
        payload: {
          event_id: ev.id,
          event_title: ev.title,
          event_date: ev.event_date,
        },
      })

      // Email
      const { data: userRes } = await supabase.auth.admin.getUserById(uid)
      const email = userRes?.user?.email
      if (email) {
        const safeTitle = escapeHtml(ev.title)
        const safeDate = escapeHtml(eventDateLocal)
        const html = `<!doctype html><html><body style="font-family:sans-serif">
          <h1>내일 모임이 있어요</h1>
          <p><strong>${safeTitle}</strong> — ${safeDate}</p>
          <p><a href="${eventUrl}">상세 보기</a></p>
        </body></html>`
        const text = `내일 모임이 있어요.\n${ev.title} — ${eventDateLocal}\n${eventUrl}`
        await sendEmail(email, `내일 모임 리마인더: ${ev.title}`, html, text)
        sent++
      }
    }
  }

  return new Response(JSON.stringify({ ok: true, sent }), {
    headers: { "Content-Type": "application/json" },
  })
})
