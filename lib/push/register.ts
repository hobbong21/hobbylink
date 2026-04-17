/**
 * Client-side helper that subscribes the current browser/device to Web Push
 * and sends the subscription payload to the server to persist.
 *
 * Requirements:
 *   - HTTPS (or localhost)
 *   - NEXT_PUBLIC_VAPID_PUBLIC_KEY env
 *   - /sw.js service worker at site root
 */

export async function registerPushSubscription(): Promise<{ ok: boolean; message?: string }> {
  if (typeof window === "undefined") return { ok: false, message: "client only" }
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return { ok: false, message: "Web Push를 지원하지 않는 브라우저입니다" }
  }
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  if (!vapidKey) {
    return { ok: false, message: "Web Push가 아직 설정되지 않았습니다" }
  }

  const perm = await Notification.requestPermission()
  if (perm !== "granted") {
    return { ok: false, message: "알림 권한이 거부되었습니다" }
  }

  const reg = await navigator.serviceWorker.register("/sw.js")
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    }))

  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      subscription: sub.toJSON(),
      userAgent: navigator.userAgent,
    }),
  })
  if (!res.ok) {
    return { ok: false, message: `서버 저장 실패 (${res.status})` }
  }
  return { ok: true }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const raw = atob(base64)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; ++i) out[i] = raw.charCodeAt(i)
  return out
}
