// Minimal Service Worker for Web Push notifications.
// Registered by /lib/push/register.ts on authenticated sessions.

self.addEventListener("push", (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { title: "HobbyLink", body: event.data ? event.data.text() : "" }
  }

  const title = data.title || "HobbyLink"
  const options = {
    body: data.body || "",
    icon: data.icon || "/hobbylink-logo.png",
    badge: data.badge || "/hobbylink-logo.png",
    data: { url: data.url || "/" },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || "/"
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url)
    }),
  )
})
