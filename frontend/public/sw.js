 // =========================================================
// public/sw.js — PWA Service Worker with Badge Support
// =========================================================
import { precacheAndRoute } from 'workbox-precaching';

precacheAndRoute(self.__WB_MANIFEST || []);

// ================= PUSH NOTIFICATION RECEIVE =================
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data.json();
  } catch {
    data = { 
      title: "uthiYO", 
      body: "You have a new notification",
      unreadCount: 1
    };
  }

  // ✅ Category অনুযায়ী সঠিক URL
  const targetUrl = data.category === "ludo"
    ? `/app?tab=ludo`
    : data.matchId
      ? `/app?tab=results&matchId=${data.matchId}`
      : data.url || "/app";

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
      {
        action: "open",
        title: "Open App",
        icon: "/image/icon/icon-192x192.png"
      },
      {
        action: "close",
        title: "Close",
        icon: "/image/icon/icon-72x72.png"
      }
    ]
  };

  // ✅ সব কিছু একটাই event.waitUntil এ (আগে দুইটা ছিল — এটাই মূল bug ছিল)
  event.waitUntil(
    Promise.all([

      // 1. Notification দেখাও (duplicate বন্ধ)
      self.registration.getNotifications().then(notifications => {
        notifications.forEach(n => {
          if (n.tag === options.tag) n.close();
        });
        return self.registration.showNotification(data.title || "uthiYO", options);
      }),

      // 2. App icon এ badge (লাল সংখ্যা)
      self.navigator.setAppBadge
        ? self.navigator.setAppBadge(data.unreadCount || 1)
            .catch(err => console.warn("SW Badge set failed:", err))
        : Promise.resolve(),

      // 3. React app কে message পাঠাও (NotificationBell update)
      self.clients.matchAll({ type: "window", includeUncontrolled: true })
        .then(clients => {
          clients.forEach(client => {
            if (client.url.includes("/app")) {
              client.postMessage({
                type: "PUSH_RECEIVED",
                count: data.unreadCount || 1,
                category: data.category || "general",
                notification: {
                  title: data.title,
                  body: data.body,
                  id: data.notificationId
                }
              });
            }
          });
        }),

      // 4. Background sync
      self.registration.sync
        ? self.registration.sync.register('sync-notifications').catch(() => {})
        : Promise.resolve()

    ])
  );
});

// ================= NOTIFICATION CLICK =================
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const notifData = event.notification.data || {};
  const targetUrl = notifData.url || "/app";
  const matchId = notifData.matchId || null;
  const notificationId = notifData.notificationId || null;

  if (event.action === "close") return;

  // ✅ এখানেও একটাই event.waitUntil (আগে দুইটা ছিল)
  event.waitUntil(
    Promise.all([

      // 1. App focus বা নতুন window খোলো
      clients.matchAll({ type: "window", includeUncontrolled: true })
        .then((windowClients) => {
          for (const client of windowClients) {
            if (client.url.includes("/app") && "focus" in client) {
              client.postMessage({
                type: "NOTIFICATION_CLICK",
                matchId: matchId,
                notificationId: notificationId,
                url: targetUrl,
              });
              return client.focus();
            }
          }
          if (clients.openWindow) {
            return clients.openWindow(targetUrl);
          }
        }),

      // 2. Badge update (server থেকে real count নিয়ে)
      fetch("https://playzo-vn8e.onrender.com/api/notifications?isRead=false&limit=1", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${self.__token || ""}`
        }
      })
        .then(res => res.json())
        .then(data => {
          const count = data.unreadCount || 0;
          const badgePromise = "setAppBadge" in self.navigator
            ? (count > 0
                ? self.navigator.setAppBadge(count)
                : self.navigator.clearAppBadge()
              ).catch(err => console.warn("Badge update failed:", err))
            : Promise.resolve();

          return Promise.all([
            badgePromise,
            self.clients.matchAll({ type: "window", includeUncontrolled: true })
              .then(clients => {
                clients.forEach(client => {
                  if (client.url.includes("/app")) {
                    client.postMessage({
                      type: "BADGE_UPDATE",
                      count: count,
                      notificationId: notificationId
                    });
                  }
                });
              })
          ]);
        })
        .catch(err => console.error("Badge update after click failed:", err))

    ])
  );
});

// ================= BACKGROUND SYNC =================
self.addEventListener("sync", (event) => {
  if (event.tag === 'sync-notifications') {
    event.waitUntil(syncNotifications());
  }
});

async function syncNotifications() {
  try {
    const db = await openDB();
    const offlineNotifications = await getOfflineNotifications(db);
    for (const notification of offlineNotifications) {
      try {
        await self.registration.showNotification(
          notification.title,
          notification.options
        );
      } catch (err) {
        console.error("Failed to show offline notification:", err);
      }
    }
    await clearOfflineNotifications(db);
  } catch (err) {
    console.error("Sync failed:", err);
  }
}

// ================= MESSAGE HANDLER =================
self.addEventListener("message", (event) => {

  // Badge Clear
  if (event.data?.type === "CLEAR_BADGE") {
    if ("clearAppBadge" in self.navigator) {
      self.navigator.clearAppBadge().catch(console.error);
    }
    event.source?.postMessage({ type: "BADGE_CLEARED", success: true });
  }

  // Badge Update
  if (event.data?.type === "UPDATE_BADGE") {
    const count = event.data.count || 0;
    if ("setAppBadge" in self.navigator) {
      (count > 0
        ? self.navigator.setAppBadge(count)
        : self.navigator.clearAppBadge()
      ).catch(err => console.warn("Badge update from app failed:", err));
    }
    event.source?.postMessage({ type: "BADGE_UPDATED", count, success: true });
  }

  // Token store
  if (event.data?.type === "STORE_TOKEN") {
    self.__token = event.data.token || "";
  }

  // Skip waiting
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  // Cache clear
  if (event.data?.type === "CLEAR_CACHE") {
    event.waitUntil(
      caches.keys().then(cacheNames =>
        Promise.all(cacheNames.map(name => caches.delete(name)))
      )
    );
  }
});

// ================= INSTALL =================
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open("uthiyo-v1").then(cache =>
      cache.addAll([
        "/",
        "/app",
        "/index.html",
        "/manifest.json",
        "/image/icon/icon-192x192.png",
        "/image/icon/icon-72x72.png"
      ])
    )
  );
});

// ================= ACTIVATE =================
self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      // পুরনো cache মুছো
      caches.keys().then(cacheNames =>
        Promise.all(
          cacheNames.map(name => {
            if (name !== "uthiyo-v1") return caches.delete(name);
          })
        )
      ),
      // নতুন SW activate হলে app কে জানাও
      self.clients.matchAll({ includeUncontrolled: true, type: "window" })
        .then(clients => {
          clients.forEach(client => {
            client.postMessage({ type: "SW_ACTIVATED_CLEAR_AUTH" });
          });
        })
    ]).then(() => self.clients.claim())
  );
});

// ================= FETCH (Offline fallback) =================
self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

// ================= HELPER FUNCTIONS =================
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("uthiyo-notifications", 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("offline-notifications")) {
        db.createObjectStore("offline-notifications", { keyPath: "id" });
      }
    };
  });
}

async function getOfflineNotifications(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["offline-notifications"], "readonly");
    const store = transaction.objectStore("offline-notifications");
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

async function clearOfflineNotifications(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["offline-notifications"], "readwrite");
    const store = transaction.objectStore("offline-notifications");
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}