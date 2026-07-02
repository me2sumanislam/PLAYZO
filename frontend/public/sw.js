 // public/sw.js
import { precacheAndRoute } from 'workbox-precaching'
precacheAndRoute(self.__WB_MANIFEST || [])

// ✅ message handler সবার আগে
self.addEventListener("message", (event) => {
  if (event.data?.type === "CLEAR_BADGE") {
    setBadge(0)
    event.source?.postMessage({ type: "BADGE_CLEARED", success: true })
  }
  if (event.data?.type === "UPDATE_BADGE") {
    const count = event.data.count || 0
    setBadge(count)
    event.source?.postMessage({ type: "BADGE_UPDATED", count, success: true })
  }
  if (event.data?.type === "STORE_TOKEN") {
    self.__token = event.data.token || ""
  }
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting()
  }
  if (event.data?.type === "CLEAR_CACHE") {
    event.waitUntil(
      caches.keys().then((cacheNames) =>
        Promise.all(cacheNames.map((name) => caches.delete(name)))
      )
    )
  }
})

const CACHE_VERSION = "uthiyo-v23"
self.__token = ""

function setBadge(count) {
  try {
    if ("setAppBadge" in self) {
      if (count > 0) {
        self.setAppBadge(count).catch(() => {})
      } else {
        self.clearAppBadge().catch(() => {})
      }
    }
  } catch (e) {}
}

self.addEventListener("install", (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) =>
      cache.addAll([
        "/",
        "/app",
        "/index.html",
        "/manifest.json",
        "/image/icon/icon-192x192.png",
        "/image/icon/icon-72x72.png",
      ]).catch(() => {})
    )
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      // পুরনো cache delete
      caches.keys().then((cacheNames) =>
        Promise.all(
          cacheNames.map((name) => {
            if (name !== CACHE_VERSION) return caches.delete(name)
          })
        )
      ),

      self.clients.claim(),

      // ✅ শুধু আগে কোনো cache ছিলে তখনই APP_UPDATED পাঠাও
      // fresh install এ পুরনো cache থাকবে না তাই message যাবে না
      caches.keys().then(async (cacheNames) => {
        const hasOldCache = cacheNames.some((name) => name !== CACHE_VERSION)
        if (!hasOldCache) return // fresh install — কিছু করো না

        const clients = await self.clients.matchAll({
          type: "window",
          includeUncontrolled: true,
        })
        clients.forEach((client) =>
          client.postMessage({ type: "APP_UPDATED" })
        )
      }),
    ])
  )
})

self.addEventListener("fetch", (event) => {
  if (event.request.url.includes("/api/")) return
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  )
})

self.addEventListener("push", (event) => {
  let data = {}
  try {
    data = event.data.json()
  } catch {
    data = { title: "uthiYO", body: "You have a new notification", unreadCount: 1 }
  }

  const targetUrl =
    data.category === "ludo"
      ? `/app?tab=ludo`
      : data.matchId
      ? `/app?tab=results&matchId=${data.matchId}`
      : data.url || "/app"

  const options = {
    body: data.body || data.message || "New notification",
    icon: data.icon || "/image/icon/icon-192x192.png",
    badge: data.badge || "/image/icon/icon-72x72.png",
    vibrate: [200, 100, 200, 100, 200],
    tag: data.tag || `notification-${data.notificationId || Date.now()}`,
    renotify: true,
    data: {
      url: targetUrl,
      matchId: data.matchId || null,
      notificationId: data.notificationId || null,
      category: data.category || "general",
    },
    actions: [
      { action: "open", title: "Open App", icon: "/image/icon/icon-192x192.png" },
      { action: "close", title: "Close", icon: "/image/icon/icon-72x72.png" },
    ],
  }

  event.waitUntil(
    Promise.all([
      self.registration.getNotifications().then((existing) => {
        existing.forEach((n) => { if (n.tag === options.tag) n.close() })
        return self.registration.showNotification(data.title || "uthiYO", options)
      }),
      setBadge(data.unreadCount || 1),
      self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: "PUSH_RECEIVED",
            count: data.unreadCount || 1,
            category: data.category || "general",
            notification: { title: data.title, body: data.body, id: data.notificationId },
          })
        })
      }),
      self.registration.sync
        ? self.registration.sync.register("sync-notifications").catch(() => {})
        : Promise.resolve(),
    ])
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const notifData = event.notification.data || {}
  const targetUrl = notifData.url || "/app"
  const matchId = notifData.matchId || null
  const notificationId = notifData.notificationId || null

  if (event.action === "close") return

  event.waitUntil(
    Promise.all([
      self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
        for (const client of clients) {
          if ("focus" in client) {
            client.postMessage({ type: "NOTIFICATION_CLICK", matchId, notificationId, url: targetUrl })
            return client.focus()
          }
        }
        if (self.clients.openWindow) return self.clients.openWindow(targetUrl)
      }),
      fetch("https://playzo-vn8e.onrender.com/api/notifications?isRead=false&limit=1", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(self.__token ? { Authorization: `Bearer ${self.__token}` } : {}),
        },
      })
        .then((res) => res.json())
        .then((resData) => {
          const count = typeof resData.unreadCount === "number" ? resData.unreadCount : 0
          setBadge(count)
          return self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
            clients.forEach((client) => {
              client.postMessage({ type: "BADGE_UPDATE", count, notificationId })
            })
          })
        })
        .catch(() => {}),
    ])
  )
})

self.addEventListener("sync", (event) => {
  if (event.tag === "sync-notifications") {
    event.waitUntil(syncNotifications())
  }
})

async function syncNotifications() {
  try {
    const db = await openDB()
    const notifications = await getOfflineNotifications(db)
    for (const n of notifications) {
      try { await self.registration.showNotification(n.title, n.options) }
      catch (err) { console.error("Failed to show offline notification:", err) }
    }
    await clearOfflineNotifications(db)
  } catch (err) { console.error("Sync failed:", err) }
}

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("uthiyo-notifications", 1)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains("offline-notifications")) {
        db.createObjectStore("offline-notifications", { keyPath: "id" })
      }
    }
  })
}

async function getOfflineNotifications(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(["offline-notifications"], "readonly")
    const store = tx.objectStore("offline-notifications")
    const request = store.getAll()
    request.onsuccess = () => resolve(request.result || [])
    request.onerror = () => reject(request.error)
  })
}

async function clearOfflineNotifications(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(["offline-notifications"], "readwrite")
    const store = tx.objectStore("offline-notifications")
    const request = store.clear()
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}