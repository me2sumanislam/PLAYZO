 // public/sw.js
import { precacheAndRoute } from 'workbox-precaching'

// ✅ FIX: নেটওয়ার্ক সাময়িকভাবে fail করলে (flaky connection, timeout, deploy transition)
// Workbox-এর internal precache routing মাঝে মাঝে unhandled promise rejection
// ছুঁড়ে দেয় ("Failed to fetch" — sw.js:1 এর নিচে stack trace)। এটা app-এর
// আসল কাজে কোনো প্রভাব ফেলে না, শুধু console-এ noise তৈরি করে। এই handler
// সেই noise permanently silence করে দেয়।
self.addEventListener("unhandledrejection", (event) => {
  event.preventDefault()
})

// ✅ FIX: আগের filter শুধু "/" এবং "/index.html" (leading slash সহ) বাদ দিত।
// কিন্তু vite-plugin-pwa এর manifest এ entry অনেক সময় leading slash ছাড়া
// "index.html" আকারে থাকে — সেটা আগের filter মিস করত, precache এ থেকে যেত,
// আর Workbox নিজে থেকে "/" রিকোয়েস্টকে সেটার সাথে map করে (directoryIndex
// behavior) নিজে handle করে ফেলত। Network fail হলে Workbox নিজেই unhandled
// promise reject করত — এটাই "Failed to fetch" / sw.js এররের আসল কারণ।
const isRootOrIndex = (url) => {
  const clean = url.split("?")[0]
  return (
    clean === "/" ||
    clean === "" ||
    clean === "index.html" ||
    clean === "/index.html" ||
    clean.endsWith("/index.html")
  )
}

const precacheEntries = (self.__WB_MANIFEST || []).filter((entry) => {
  const url = typeof entry === "string" ? entry : entry.url
  if (url.includes("manifest.webmanifest")) return false
  if (isRootOrIndex(url)) return false
  return true
})

// ✅ FIX: directoryIndex ও cleanURLs বন্ধ রাখা হলো। এর ফলে manifest এ যদি
// ভবিষ্যতে কোনোভাবে "index.html"-জাতীয় entry ঢুকেও যায়, তাও Workbox
// কখনো "/" কে নিজে থেকে map করে নিজের precache route এ ধরবে না —
// "/" সবসময় নিচের custom fetch handler-ই handle করবে, network-first +
// safe cache fallback সহ, যেটা কখনো promise reject করে না।
precacheAndRoute(precacheEntries, {
  directoryIndex: null,
  cleanURLs: false,
})

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

const CACHE_VERSION = "uthiyo-v52" // ✅ v48 থেকে বাড়ানো হলো যাতে সব ইউজারের পুরনো (bug থাকা) SW replace হয়
self.__token = ""
self.__isFreshInstall = false

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
    (async () => {
      const cacheNames = await caches.keys()
      const hasAnyOwnCache = cacheNames.some((name) => name.startsWith("uthiyo-"))

      // ✅ কোনো পুরনো "uthiyo-" cache-ই নেই — মানে এটা fresh install
      // (প্রথমবার visit অথবা uninstall-এর পর reinstall — দুটোই একই সিগন্যাল দেয়)
      if (!hasAnyOwnCache) {
        self.__isFreshInstall = true
      }

      const cache = await caches.open(CACHE_VERSION)
      await cache
        .addAll([
          "/",
          "/app",
          "/index.html",
          "/manifest.webmanifest", // ✅ /manifest.json থেকে বদলানো হলো — আসল ফাইলনেমের সাথে মিলিয়ে
          "/image/icon/icon-192x192.png",
          "/image/icon/icon-72x72.png",
        ])
        .catch((err) => console.error("Precache addAll failed:", err))
    })()
  )
})

// ✅✅✅ এটাই এখন "/" এবং manifest.webmanifest-এর একমাত্র handler
// (Workbox আর এগুলো নিয়ে হাত দেয় না, উপরের filter + directoryIndex:null দেখুন)
self.addEventListener("fetch", (event) => {
  const { request } = event

  // শুধু GET রিকোয়েস্ট handle করুন, বাকি সব default browser behavior-এ ছেড়ে দিন
  if (request.method !== "GET") return

  const url = new URL(request.url)

  const isNavigation = request.mode === "navigate"
  const isManifest = url.pathname === "/manifest.webmanifest"

  if (isNavigation || isManifest) {
    event.respondWith(
      (async () => {
        try {
          // আগে নেটওয়ার্ক থেকে চেষ্টা করুন (সবসময় লেটেস্ট ভার্সন পাওয়ার জন্য)
          return await fetch(request)
        } catch (networkErr) {
          // নেটওয়ার্ক fail করলে (offline / flaky connection) cache থেকে fallback —
          // এই ব্লকটা নিজেও try/catch-এ মোড়ানো, কারণ caches.open/match নিজেও
          // fail করতে পারে (quota, corrupted cache, ইত্যাদি) এবং সেটা যেন
          // কখনো unhandled rejection না হয়ে যায়।
          try {
            const cache = await caches.open(CACHE_VERSION)
            const cached =
              (await cache.match(request)) ||
              (isNavigation ? await cache.match("/index.html") : null)

            if (cached) return cached
          } catch (cacheErr) {
            console.error("SW cache fallback failed:", cacheErr)
          }

          // কিছুই cache-এ না থাকলে বা cache access-ই fail করলে —
          // সবসময় একটা valid Response রিটার্ন করুন, promise কখনো reject হতে দেবেন না
          return new Response(
            isManifest ? "{}" : "You are offline",
            {
              status: 503,
              statusText: "Offline",
              headers: {
                "Content-Type": isManifest
                  ? "application/manifest+json"
                  : "text/plain",
              },
            }
          )
        }
      })()
    )
  }
  // বাকি সব রিকোয়েস্ট workbox-এর precacheAndRoute হ্যান্ডেল করবে
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys()

      // পুরনো cache delete
      await Promise.all(
        cacheNames.map((name) => (name !== CACHE_VERSION ? caches.delete(name) : null))
      )

      await self.clients.claim()

      const clients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      })

      if (self.__isFreshInstall) {
        // ✅ Fresh install (প্রথমবার অথবা uninstall→reinstall) —
        // client-কে বলো সব local data (localStorage/sessionStorage/IndexedDB) clear করে
        // একদম নতুন করে শুরু করতে
        clients.forEach((client) =>
          client.postMessage({ type: "FRESH_INSTALL_RESET" })
        )
      } else {
        // ✅ Normal update — শুধু তখনই APP_UPDATED পাঠাও যখন সত্যিই আগে
        // অন্য version-এর cache ছিল (auth data অক্ষত থাকবে)
        const ownCaches = cacheNames.filter((name) => name.startsWith("uthiyo-"))
        const hasOldOwnCache = ownCaches.some((name) => name !== CACHE_VERSION)
        if (hasOldOwnCache) {
          clients.forEach((client) => client.postMessage({ type: "APP_UPDATED" }))
        }
      }
    })()
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