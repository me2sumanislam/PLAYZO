 // =========================================================
// public/sw.js — PWA Service Worker with Badge Support
// =========================================================
import { precacheAndRoute } from 'workbox-precaching';

// Workbox-এর precache manifest inject করবে এখানে
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

  const targetUrl = data.matchId
    ? `/app?tab=results&matchId=${data.matchId}`
    : data.url || "/app";

  const options = {
    body: data.body || data.message || "New notification",
    icon: data.icon || "/image/icon/icon-192x192.png",
    badge: data.badge || "/image/icon/icon-72x72.png",
    vibrate: [200, 100, 200, 100, 200],
    tag: `notification-${data.notificationId || Date.now()}`,
    renotify: true,
    data: {
      url: targetUrl,
      matchId: data.matchId || null,
      notificationId: data.notificationId || null,
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

  // একই notification duplicate আসবে না
  event.waitUntil(
    self.registration.getNotifications().then(notifications => {
      notifications.forEach(notification => {
        if (notification.tag === options.tag) {
          notification.close();
        }
      });
      return self.registration.showNotification(data.title || "uthiYO", options);
    })
  );

  // 🔴 App Icon Badge Update
  event.waitUntil(
    Promise.all([
      self.navigator.setAppBadge ? 
        self.navigator.setAppBadge(data.unreadCount || 1)
          .catch(err => console.warn("SW Badge set failed:", err)) 
        : Promise.resolve(),
      
      self.clients.matchAll({ type: "window", includeUncontrolled: true })
        .then(clients => {
          clients.forEach(client => {
            if (client.url.includes("/app")) {
              client.postMessage({
                type: "PUSH_RECEIVED",
                count: data.unreadCount || 1,
                notification: {
                  title: data.title,
                  body: data.body,
                  id: data.notificationId
                }
              });
            }
          });
        }),
      
      self.registration.sync ? 
        self.registration.sync.register('sync-notifications')
          .catch(() => {}) 
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
  
  if (event.action === "close") {
    return;
  }
  
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
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
      })
  );

  event.waitUntil(
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
        if ("setAppBadge" in self.navigator) {
          if (count > 0) {
            self.navigator.setAppBadge(count)
              .catch(err => console.warn("Badge update failed:", err));
          } else {
            self.navigator.clearAppBadge()
              .catch(err => console.warn("Badge clear failed:", err));
          }
        }
        return self.clients.matchAll({ type: "window", includeUncontrolled: true })
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
          });
      })
      .catch(err => {
        console.error("Failed to update badge after notification click:", err);
      })
  );
});

// ================= BACKGROUND SYNC (Offline Support) =================
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
  // ✅ Badge Clear
  if (event.data?.type === "CLEAR_BADGE") {
    if ("clearAppBadge" in self.navigator) {
      self.navigator.clearAppBadge().catch(console.error);
    }
    event.source?.postMessage({
      type: "BADGE_CLEARED",
      success: true
    });
  }
  
  // ✅ Badge Update
  if (event.data?.type === "UPDATE_BADGE") {
    const count = event.data.count || 0;
    if ("setAppBadge" in self.navigator) {
      if (count > 0) {
        self.navigator.setAppBadge(count)
          .catch(err => console.warn("Badge update from app failed:", err));
      } else {
        self.navigator.clearAppBadge()
          .catch(err => console.warn("Badge clear from app failed:", err));
      }
    }
    event.source?.postMessage({
      type: "BADGE_UPDATED",
      count: count,
      success: true
    });
  }
  
  // ✅ Store Token for API calls
  if (event.data?.type === "STORE_TOKEN") {
    self.__token = event.data.token || "";
  }
  
  // ✅ Skip Waiting
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
  
  // ✅ Cache Clear
  if (event.data?.type === "CLEAR_CACHE") {
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      })
    );
  }
});

// ================= INSTALL EVENT =================
self.addEventListener("install", (event) => {
  // ✅ নতুন version আসলে সাথে সাথে activate হবে
  self.skipWaiting();
  
  event.waitUntil(
    caches.open("uthiyo-v1").then(cache => {
      return cache.addAll([
        "/",
        "/app",
        "/index.html",
        "/manifest.json",
        "/image/icon/icon-192x192.png",
        "/image/icon/icon-72x72.png"
      ]);
    })
  );
});

// ================= ACTIVATE EVENT =================
self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      // ✅ পুরনো cache মুছো
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== "uthiyo-v1") {
              return caches.delete(cacheName);
            }
          })
        );
      }),

      // ✅ নতুন: সব open client কে logout message পাঠাও
      // PWA uninstall → reinstall হলে নতুন SW activate হয়
      // তখন App.jsx এই message পেয়ে localStorage clear করবে
      self.clients
        .matchAll({ includeUncontrolled: true, type: "window" })
        .then(clients => {
          clients.forEach(client => {
            client.postMessage({ type: "SW_ACTIVATED_CLEAR_AUTH" });
          });
        })
    ]).then(() => {
      // ✅ সব page এর control নাও
      return self.clients.claim();
    })
  );
});

// ================= FETCH EVENT (Offline Support) =================
self.addEventListener("fetch", (event) => {
  // Network first, fallback to cache
  event.respondWith(
    fetch(event.request)
      .catch(() => caches.match(event.request))
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