/**
 * Email sending abstraction.
 *
 * The production implementation uses Resend (https://resend.com). A stub is
 * used in development / when the API key is missing so the app doesn't crash
 * and developers can see what *would* have been sent in the server log.
 *
 * Env vars:
 *   RESEND_API_KEY     — Resend API key (server-only)
 *   EMAIL_FROM         — Default "from" address, e.g. "HobbyLink <noreply@hobbylink.example>"
 */

export interface SendEmailInput {
  to: string | string[]
  subject: string
  html: string
  text?: string
  replyTo?: string
}

export interface SendEmailResult {
  ok: boolean
  id?: string
  message?: string
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM ?? "HobbyLink <noreply@hobbylink.example>"

  if (!apiKey) {
    // Dev / preview fallback: log and pretend it succeeded.
    console.warn(
      "[email] RESEND_API_KEY not set — email not actually sent. Subject:",
      input.subject,
      "To:",
      input.to,
    )
    return { ok: true, id: "dev-noop" }
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
        reply_to: input.replyTo,
      }),
    })

    if (!response.ok) {
      const body = await response.text()
      return { ok: false, message: `Resend error ${response.status}: ${body}` }
    }

    const data = (await response.json()) as { id?: string }
    return { ok: true, id: data.id }
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Unknown email error",
    }
  }
}
