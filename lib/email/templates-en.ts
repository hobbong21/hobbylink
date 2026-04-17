import { escapeHtml } from "./escape"

/**
 * English-language equivalents of the templates in templates.ts. Chosen at
 * send time based on recipient locale (read from profile or fall back to
 * Korean).
 */

interface MatchEmailArgs {
  peerName: string
  siteUrl: string
}

export function newMatchEmailEn({ peerName, siteUrl }: MatchEmailArgs) {
  const safeName = escapeHtml(peerName)
  const html = `
    <!doctype html>
    <html lang="en">
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0a0a0a; line-height: 1.6;">
        <div style="max-width: 560px; margin: 0 auto; padding: 32px 20px;">
          <h1 style="font-size: 24px; margin: 0 0 16px;">It's a match! 🎉</h1>
          <p>You matched with <strong>${safeName}</strong>. Send the first message and get the conversation going.</p>
          <p style="margin: 24px 0;">
            <a href="${siteUrl}/matches"
               style="display: inline-block; padding: 10px 20px; background: #0a0a0a; color: #fff; text-decoration: none; border-radius: 6px;">
              View matches
            </a>
          </p>
          <p style="color: #737373; font-size: 12px; margin-top: 32px;">
            You can opt out of these emails in HobbyLink Settings.
          </p>
        </div>
      </body>
    </html>
  `
  const text = `It's a match!\n\nYou matched with ${peerName}. Visit ${siteUrl}/matches to say hi.`
  return { html, text }
}

interface EventReminderArgs {
  eventTitle: string
  eventDateLocal: string
  eventUrl: string
}

export function eventReminderEmailEn({
  eventTitle,
  eventDateLocal,
  eventUrl,
}: EventReminderArgs) {
  const safeTitle = escapeHtml(eventTitle)
  const safeDate = escapeHtml(eventDateLocal)
  const html = `
    <!doctype html>
    <html lang="en">
      <body style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; color: #0a0a0a; line-height: 1.6;">
        <div style="max-width: 560px; margin: 0 auto; padding: 32px 20px;">
          <h1 style="font-size: 24px; margin: 0 0 16px;">Reminder: your meetup is tomorrow</h1>
          <p><strong>${safeTitle}</strong> — ${safeDate}</p>
          <p style="margin: 24px 0;">
            <a href="${eventUrl}"
               style="display: inline-block; padding: 10px 20px; background: #0a0a0a; color: #fff; text-decoration: none; border-radius: 6px;">
              Event details
            </a>
          </p>
        </div>
      </body>
    </html>
  `
  const text = `Reminder: your meetup is tomorrow.\n\n${eventTitle} — ${eventDateLocal}\n${eventUrl}`
  return { html, text }
}
