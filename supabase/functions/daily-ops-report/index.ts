// deno-lint-ignore-file no-explicit-any
/**
 * Supabase Edge Function: daily-ops-report
 *
 * Sends an operational summary to every admin (`profiles.is_admin = true`).
 * Metrics: new signups, new events, new matches, new reports, mutual-match
 * rate (last 24h), active push subscriptions total.
 *
 * Scheduling (매일 09:00 KST = 00:00 UTC):
 *   select cron.schedule(
 *     'daily-ops-report',
 *     '0 0 * * *',
 *     $$select net.http_post(
 *       url := 'https://<project>.functions.supabase.co/daily-ops-report',
 *       headers := jsonb_build_object('Authorization', 'Bearer ' || <service_role>)
 *     )$$
 *   );
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const RESEND_KEY = Deno.env.get("RESEND_API_KEY")
const EMAIL_FROM =
  Deno.env.get("EMAIL_FROM") ?? "HobbyLink Ops <noreply@hobbylink.example>"
const SITE_URL = Deno.env.get("SITE_URL") ?? ""

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === '"' ? "&quot;" : "&#39;",
  )
}

async function sendEmail(to: string, subject: string, html: string, text: string) {
  if (!RESEND_KEY) {
    console.warn("[daily-ops] RESEND_API_KEY missing, would have sent to", to)
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
    console.error("[daily-ops] resend failed", res.status, await res.text())
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

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const [
    signups,
    events,
    matchesAttempted,
    matchesAccepted,
    reports,
    pushTotal,
    adminsRes,
  ] = await Promise.all([
    admin.from("profiles").select("*", { count: "exact", head: true })
      .gte("created_at", since),
    admin.from("events").select("*", { count: "exact", head: true })
      .gte("created_at", since),
    admin.from("matches").select("*", { count: "exact", head: true })
      .gte("updated_at", since),
    admin.from("matches").select("*", { count: "exact", head: true })
      .gte("updated_at", since).eq("status", "accepted"),
    admin.from("reports").select("*", { count: "exact", head: true })
      .gte("created_at", since),
    admin.from("push_subscriptions").select("*", { count: "exact", head: true }),
    admin.from("profiles").select("id").eq("is_admin", true),
  ])

  const acceptedCount = matchesAccepted.count ?? 0
  const attemptedCount = matchesAttempted.count ?? 0
  const rate = attemptedCount > 0
    ? Math.round((acceptedCount / attemptedCount) * 100)
    : 0

  const rows: string[] = [
    `가입자: ${signups.count ?? 0}명`,
    `새 모임: ${events.count ?? 0}개`,
    `매칭 시도: ${attemptedCount}건 (수락률 ${rate}%)`,
    `처리 대기 신고 누적 검토 필요 수: ${reports.count ?? 0}건`,
    `푸시 구독 총합: ${pushTotal.count ?? 0}`,
  ]

  const subject = `[HobbyLink] 일일 운영 리포트 — ${new Date().toLocaleDateString("ko-KR")}`
  const listHtml = rows
    .map((r) => `<li style="margin:4px 0">${escapeHtml(r)}</li>`)
    .join("")
  const html = `<!doctype html><html lang="ko"><body style="font-family:sans-serif;color:#0a0a0a;line-height:1.6">
    <div style="max-width:560px;margin:0 auto;padding:32px 20px">
      <h1 style="font-size:22px;margin:0 0 12px">일일 운영 요약</h1>
      <p>지난 24시간 지표:</p>
      <ul style="padding-left:20px">${listHtml}</ul>
      <p style="margin-top:20px">
        <a href="${SITE_URL}/admin/analytics" style="display:inline-block;padding:10px 18px;background:#0a0a0a;color:#fff;text-decoration:none;border-radius:6px">관리자 분석 보기</a>
      </p>
    </div>
  </body></html>`
  const text = `일일 운영 요약 (24h)\n\n${rows.map((r) => `- ${r}`).join("\n")}\n\n${SITE_URL}/admin/analytics`

  const adminProfiles = (adminsRes.data ?? []) as Array<{ id: string }>
  let sent = 0
  for (const p of adminProfiles) {
    const { data: userRes } = await admin.auth.admin.getUserById(p.id)
    const email = userRes?.user?.email
    if (!email) continue
    if (await sendEmail(email, subject, html, text)) sent++
  }

  return new Response(JSON.stringify({ ok: true, sent }), {
    headers: { "Content-Type": "application/json" },
  })
})
