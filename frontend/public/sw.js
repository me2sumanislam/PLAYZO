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
      unreadCount: 1,
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
        icon: "/image/icon/icon-192x192.png",
      },
      {
        action: "close",
        title: "Close",
        icon: "/image/icon/icon-72x72.png",
      },
    ],
  };

  // ✅ FIX: পুরানো কোডে দুটো আলাদা event.waitUntil() ছিল — শুধু প্রথমটা কাজ করত,
  // badge set হত না। এখন সব কাজ একটাই Promise.all()-এ একসাথে করা হচ্ছে।
  event.waitUntil(
    Promise.all([
      // 1. Notification দেখাও (duplicate হলে আগেরটা বন্ধ করো)
      self.registration.getNotifications().then((existingNotifs) => {
        existingNotifs.forEach((n) => {
          if (n.tag === options.tag) n.close();
        });
        return self.registration.showNotification(data.title || "uthiYO", options);
      }),

      // 2. 🔴 App Icon Badge set করো
      self.navigator.setAppBadge
        ? self.navigator
            .setAppBadge(data.unreadCount || 1)
            .catch((err) => console.warn("SW Badge set failed:", err))
        : Promise.resolve(),

      // 3. React App কে message পাঠাও (NotificationBell আপডেট হবে)
      self.clients
        .matchAll({ type: "window", includeUncontrolled: true })
        .then((clients) => {
          clients.forEach((client) => {
            if (client.url.includes("/app")) {
              client.postMessage({
                type: "PUSH_RECEIVED",
                count: data.unreadCount || 1,
                notification: {
                  title: data.title,
                  body: data.body,
                  id: data.notificationId,
                },
              });
            }
          });
        }),

      // 4. Background Sync (offline থাকলে)
      self.registration.sync
        ? self.registration.sync.register("sync-notifications").catch(() => {})
        : Promise.resolve(),
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

  // ✅ FIX: পুরানো কোডে দুটো আলাদা event.waitUntil() ছিল — শুধু প্রথমটা কাজ করত,
  // badge update হত না। এখন একটাই Promise.all()-এ সব একসাথে।
  event.waitUntil(
    Promise.all([
      // 1. App focus বা open করো
      self.clients
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
              return client.navigate(targetUrl).then((c) => c.focus());
            }
          }
          if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
        }),

      // 2. API থেকে নতুন unread count নিয়ে badge আপডেট করো
      fetch(
        "https://playzo-vn8e.onrender.com/api/notifications?isRead=false&limit=1"
      )
        .then((res) => res.json())
        .then((resData) => {
          const count = resData.unreadCount || 0;

          // Badge আপডেট করো
          const badgePromise =
            self.navigator.setAppBadge
              ? count > 0
                ? self.navigator.setAppBadge(count).catch(() => {})
                : self.navigator.clearAppBadge().catch(() => {})
              : Promise.resolve();

          // React App কেও জানাও
          const messagePromise = self.clients
            .matchAll({ type: "window", includeUncontrolled: true })
            .then((clients) => {
              clients.forEach((client) => {
                if (client.url.includes("/app")) {
                  client.postMessage({
                    type: "BADGE_UPDATE",
                    count: count,
                    notificationId: notificationId,
                  });
                }
              });
            });

          return Promise.all([badgePromise, messagePromise]);
        })
        .catch((err) => {
          console.error("Failed to update badge after notification click:", err);
        }),
    ])
  );
});

// ================= BACKGROUND SYNC (Offline Support) =================
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-notifications") {
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
  // ✅ Badge Clear (অ্যাপ খুললে বা লগআউট করলে)
  if (event.data?.type === "CLEAR_BADGE") {
    if ("clearAppBadge" in self.navigator) {
      self.navigator.clearAppBadge().catch(console.error);
    }
    event.source?.postMessage({ type: "BADGE_CLEARED", success: true });
  }

  // ✅ Badge Update (App থেকে manually update)
  if (event.data?.type === "UPDATE_BADGE") {
    const count = event.data.count || 0;
    if (self.navigator.setAppBadge) {
      const p =
        count > 0
          ? self.navigator.setAppBadge(count)
          : self.navigator.clearAppBadge();
      p.catch((err) => console.warn("Badge update from app failed:", err));
    }
    event.source?.postMessage({ type: "BADGE_UPDATED", count, success: true });
  }

  // ✅ Store Token for API calls
  if (event.data?.type === "STORE_TOKEN") {
    self.__token = event.data.token || "";
  }

  // ✅ Skip Waiting (New version এলে)
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  // ✅ Cache Clear
  if (event.data?.type === "CLEAR_CACHE") {
    event.waitUntil(
      caches.keys().then((cacheNames) =>
        Promise.all(cacheNames.map((name) => caches.delete(name)))
      )
    );
  }
});

// ================= INSTALL EVENT =================
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open("uthiyo-v1").then((cache) =>
      cache.addAll([
        "/",
        "/app",
        "/index.html",
        "/manifest.json",
        "/image/icon/icon-192x192.png",
        "/image/icon/icon-72x72.png",
      ])
    )
  );
});

// ================= ACTIVATE EVENT =================
self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) =>
        Promise.all(
          cacheNames.map((name) => {
            if (name !== "uthiyo-v1") return caches.delete(name);
          })
        )
      ),
      self.clients.claim(),
    ])
  );
});

// ================= FETCH EVENT (Offline Support) =================
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
    const tx = db.transaction(["offline-notifications"], "readonly");
    const store = tx.objectStore("offline-notifications");
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

async function clearOfflineNotifications(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(["offline-notifications"], "readwrite");
    const store = tx.objectStore("offline-notifications");
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}