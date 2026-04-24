// deno-lint-ignore-file no-explicit-any
/**
 * Supabase Edge Function: weekly-digest
 *
 * Sends a personalized weekly summary (new matches, received follows, new
 * comments on your posts, upcoming events) to users who opted in via the
 * `email_on_event_reminder` flag. Re-uses that flag as a proxy for "send me
 * periodic emails" — introduce a dedicated pref if the product team wants to
 * separate the two.
 *
 * Schedule weekly (e.g. 매주 월요일 09:00 KST = 일요일 00:00 UTC):
 *
 *   select cron.schedule(
 *     'weekly-digest',
 *     '0 0 * * 0',
 *     $$select net.http_post(
 *       url := 'https://<project>.functions.supabase.co/weekly-digest',
 *       headers := jsonb_build_object('Authorization', 'Bearer ' || <service_role>)
 *     )$$
 *   );
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const RESEND_KEY = Deno.env.get("RESEND_API_KEY")
const EMAIL_FROM = Deno.env.get("EMAIL_FROM") ?? "HobbyLink <noreply@hobbylink.example>"
const SITE_URL = Deno.env.get("SITE_URL") ?? ""

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === '"' ? "&quot;" : "&#39;",
  )
}

async function sendEmail(to: string, subject: string, html: string, text: string) {
  if (!RESEND_KEY) {
    console.warn("[digest] RESEND_API_KEY missing, skipping", to)
    return false
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_KEY}`,
    },
    body: JSON.stringify({ from: EMAIL_FROM, to, subject, html, text }),
  })
  if (!res.ok) {
    console.error("[digest] resend failed", res.status, await res.text())
    return false
  }
  return true
}

Deno.serve(async (req) => {
  const authHeader = req.headers.get("Authorization") ?? ""
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : ""
  if (!token || token !== SERVICE_KEY) {
    return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  // Opt-in users
  const { data: prefs } = await admin
    .from("notification_prefs")
    .select("user_id")
    .eq("email_on_event_reminder", true)

  let sent = 0
  for (const pref of prefs ?? []) {
    const uid = (pref as any).user_id as string

    // Gather per-user stats.
    const [matches, newFollowers, comments, upcoming] = await Promise.all([
      admin
        .from("matches")
        .select("id", { count: "exact", head: true })
        .eq("status", "accepted")
        .or(`user_id.eq.${uid},matched_user_id.eq.${uid}`)
        .gte("updated_at", weekAgo),
      admin
        .from("follows")
        .select("follower_id", { count: "exact", head: true })
        .eq("followed_id", uid)
        .gte("created_at", weekAgo),
      admin
        .from("comments")
        .select("id, posts!inner(author_id)")
        .eq("posts.author_id", uid)
        .gte("created_at", weekAgo),
      admin
        .from("event_participants")
        .select("event_id, events!inner(title, event_date)")
        .eq("user_id", uid)
        .in("status", ["registered", "attended"])
        .gte("events.event_date", new Date().toISOString())
        .lte("events.event_date", new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()),
    ])

    const matchCount = matches.count ?? 0
    const followerCount = newFollowers.count ?? 0
    const commentCount = (comments.data ?? []).length
    const upcomingCount = (upcoming.data ?? []).length

    if (matchCount === 0 && followerCount === 0 && commentCount === 0 && upcomingCount === 0) {
      continue
    }

    // Resolve email
    const { data: userRes } = await admin.auth.admin.getUserById(uid)
    const email = userRes?.user?.email
    if (!email) continue

    const rows: string[] = []
    if (matchCount > 0) rows.push(`💞 새로운 매칭 ${matchCount}건`)
    if (followerCount > 0) rows.push(`👥 새로운 팔로워 ${followerCount}명`)
    if (commentCount > 0) rows.push(`💬 내 게시글의 새 댓글 ${commentCount}개`)
    if (upcomingCount > 0) rows.push(`📅 이번 주 예정된 모임 ${upcomingCount}개`)

    const listHtml = rows
      .map((r) => `<li style="margin: 4px 0">${escapeHtml(r)}</li>`)
      .join("")
    const listText = rows.map((r) => `- ${r}`).join("\n")

    const html = `<!doctype html><html lang="ko"><body style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;color:#0a0a0a;line-height:1.6">
      <div style="max-width:560px;margin:0 auto;padding:32px 20px">
        <h1 style="font-size:22px;margin:0 0 12px">이번 주 HobbyLink 요약</h1>
        <p>지난 7일 동안 이런 일들이 있었어요:</p>
        <ul style="padding-left:20px">${listHtml}</ul>
        <p style="margin-top:20px">
          <a href="${SITE_URL}/activity" style="display:inline-block;padding:10px 18px;background:#0a0a0a;color:#fff;text-decoration:none;border-radius:6px">활동 자세히 보기</a>
        </p>
        <p style="color:#737373;font-size:12px;margin-top:32px">
          이 메일이 불필요하면 설정 > 알림에서 끌 수 있습니다.
        </p>
      </div>
    </body></html>`

    const text = `이번 주 HobbyLink 요약\n\n${listText}\n\n${SITE_URL}/activity`

    if (await sendEmail(email, "[HobbyLink] 이번 주 활동 요약", html, text)) {
      sent++
    }
  }

  return new Response(JSON.stringify({ ok: true, sent }), {
    headers: { "Content-Type": "application/json" },
  })
})
