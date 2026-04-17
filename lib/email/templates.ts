/**
 * Minimal HTML email templates. Deliberately plain — no external images, no
 * tracking pixels. Every template returns both an HTML and plain-text variant.
 */

import { escapeHtml } from "./escape"

interface MatchEmailArgs {
  peerName: string
  siteUrl: string
}

export function newMatchEmail({ peerName, siteUrl }: MatchEmailArgs) {
  const safeName = escapeHtml(peerName)
  const html = `
    <!doctype html>
    <html lang="ko">
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #0a0a0a; line-height: 1.6;">
        <div style="max-width: 560px; margin: 0 auto; padding: 32px 20px;">
          <h1 style="font-size: 24px; margin: 0 0 16px;">새로운 매칭이 성사되었어요 🎉</h1>
          <p><strong>${safeName}</strong>님과 매칭되었습니다. 지금 바로 첫 메시지를 보내보세요.</p>
          <p style="margin: 24px 0;">
            <a href="${siteUrl}/matches"
               style="display: inline-block; padding: 10px 20px; background: #0a0a0a; color: #fff; text-decoration: none; border-radius: 6px;">
              매칭 목록 보기
            </a>
          </p>
          <p style="color: #737373; font-size: 12px; margin-top: 32px;">
            알림을 그만 받으시려면 HobbyLink 설정 페이지에서 변경하실 수 있습니다.
          </p>
        </div>
      </body>
    </html>
  `
  const text = `새로운 매칭이 성사되었어요 🎉\n\n${peerName}님과 매칭되었습니다. ${siteUrl}/matches 에서 확인하세요.`
  return { html, text }
}

interface EventReminderArgs {
  eventTitle: string
  eventDateLocal: string
  eventUrl: string
}

export function eventReminderEmail({
  eventTitle,
  eventDateLocal,
  eventUrl,
}: EventReminderArgs) {
  const safeTitle = escapeHtml(eventTitle)
  const safeDate = escapeHtml(eventDateLocal)
  const html = `
    <!doctype html>
    <html lang="ko">
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #0a0a0a; line-height: 1.6;">
        <div style="max-width: 560px; margin: 0 auto; padding: 32px 20px;">
          <h1 style="font-size: 24px; margin: 0 0 16px;">내일 모임이 있어요</h1>
          <p><strong>${safeTitle}</strong> — ${safeDate}</p>
          <p style="margin: 24px 0;">
            <a href="${eventUrl}"
               style="display: inline-block; padding: 10px 20px; background: #0a0a0a; color: #fff; text-decoration: none; border-radius: 6px;">
              상세 보기
            </a>
          </p>
        </div>
      </body>
    </html>
  `
  const text = `내일 모임이 있어요.\n\n${eventTitle} — ${eventDateLocal}\n${eventUrl}`
  return { html, text }
}
