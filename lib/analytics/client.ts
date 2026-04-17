"use client"

/**
 * Provider-agnostic analytics client.
 *
 * By default, events are sent to `/api/analytics/event` (first-party),
 * keeping data out of third-party cookies. If you wire up PostHog/Amplitude
 * later, add the SDK init in a `_init()` call and mirror events there.
 *
 * Never calls out if the user is on a DoNotTrack browser.
 */

type EventName =
  | "match.like"
  | "match.pass"
  | "match.mutual"
  | "message.sent"
  | "event.created"
  | "event.joined"
  | "event.review_submitted"
  | "post.created"
  | "post.liked"
  | "bookmark.added"
  | "follow.created"
  | "search.performed"
  | "subscription.checkout_started"
  | "push.enabled"

export async function track(name: EventName, props: Record<string, unknown> = {}) {
  if (typeof navigator !== "undefined" && navigator.doNotTrack === "1") return

  try {
    await fetch("/api/analytics/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // keepalive so the beacon survives page unload (e.g. form submit redirect).
      keepalive: true,
      body: JSON.stringify({
        name,
        props,
        ts: Date.now(),
        url: typeof window !== "undefined" ? window.location.pathname : null,
      }),
    })
  } catch {
    // analytics failures never break UX
  }
}
