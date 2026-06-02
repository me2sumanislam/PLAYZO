 // =========================================================
// public/sw.js — PWA Service Worker (FIXED for Mobile)
// =========================================================

// ─── Workbox precache (vite-plugin-pwa inject করবে) ──────
// eslint-disable-next-line no-undef

// public/sw.js
importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");


if (typeof self.__WB_MANIFEST !== "undefined") {
  // workbox এর precacheAndRoute এখানে inject হয়
}

// ─── Global token store (NotificationBell থেকে পাঠানো হয়) ─
self.__token = "";

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

  // Category অনুযায়ী সঠিক URL
  const targetUrl =
    data.category === "ludo"
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
        icon: "/image/icon/icon-192x192.png",
      },
      {
        action: "close",
        title: "Close",
        icon: "/image/icon/icon-72x72.png",
      },
    ],
  };

  event.waitUntil(
    Promise.all([

      // 1. Notification দেখাও (duplicate থাকলে আগেরটা বন্ধ করো)
      self.registration.getNotifications().then((existing) => {
        existing.forEach((n) => {
          if (n.tag === options.tag) n.close();
        });
        return self.registration.showNotification(data.title || "uthiYO", options);
      }),

      // 2. App Icon Badge — FIX: self.navigator নয়, navigator ব্যবহার করো
      // mobile Chrome এ self.navigator কাজ করে না
      (typeof navigator !== "undefined" && "setAppBadge" in navigator)
        ? navigator.setAppBadge(data.unreadCount || 1).catch(() => {})
        : Promise.resolve(),

      // 3. React App কে message পাঠাও (NotificationBell update হবে)
      // FIX: শুধু /app নয়, সব client কে message পাঠাও
      self.clients
        .matchAll({ type: "window", includeUncontrolled: true })
        .then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: "PUSH_RECEIVED",
              count: data.unreadCount || 1,
              category: data.category || "general",
              notification: {
                title: data.title,
                body: data.body,
                id: data.notificationId,
              },
            });
          });
        }),

      // 4. Background sync (offline এর জন্য)
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

  event.waitUntil(
    Promise.all([

      // 1. App focus বা নতুন window খোলো
      self.clients
        .matchAll({ type: "window", includeUncontrolled: true })
        .then((windowClients) => {
          for (const client of windowClients) {
            if ("focus" in client) {
              client.postMessage({
                type: "NOTIFICATION_CLICK",
                matchId: matchId,
                notificationId: notificationId,
                url: targetUrl,
              });
              // FIX: client.navigate() অনেক browser এ নেই — client.focus() safe
              return client.focus();
            }
          }
          if (self.clients.openWindow) {
            return self.clients.openWindow(targetUrl);
          }
        }),

      // 2. API থেকে fresh unread count নিয়ে badge আপডেট করো
      // FIX: token header যোগ করা হয়েছে
      fetch(
        "https://playzo-vn8e.onrender.com/api/notifications?isRead=false&limit=1",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            // STORE_TOKEN message দিয়ে token রাখা হয়
            ...(self.__token ? { Authorization: `Bearer ${self.__token}` } : {}),
          },
        }
      )
        .then((res) => res.json())
        .then((resData) => {
          const count =
            typeof resData.unreadCount === "number" ? resData.unreadCount : 0;

          // FIX: self.navigator নয়, navigator ব্যবহার করো
          const badgePromise =
            typeof navigator !== "undefined" && "setAppBadge" in navigator
              ? count > 0
                ? navigator.setAppBadge(count).catch(() => {})
                : navigator.clearAppBadge().catch(() => {})
              : Promise.resolve();

          // React App কেও badge count জানাও
          const msgPromise = self.clients
            .matchAll({ type: "window", includeUncontrolled: true })
            .then((clients) => {
              clients.forEach((client) => {
                client.postMessage({
                  type: "BADGE_UPDATE",
                  count: count,
                  notificationId: notificationId,
                });
              });
            });

          return Promise.all([badgePromise, msgPromise]);
        })
        .catch(() => {}),

    ])
  );
});

// ================= BACKGROUND SYNC =================
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

  // Badge Clear
  if (event.data?.type === "CLEAR_BADGE") {
    // FIX: self.navigator নয়, navigator ব্যবহার করো
    if (typeof navigator !== "undefined" && "clearAppBadge" in navigator) {
      navigator.clearAppBadge().catch(() => {});
    }
    event.source?.postMessage({ type: "BADGE_CLEARED", success: true });
  }

  // Badge Update
  if (event.data?.type === "UPDATE_BADGE") {
    const count = event.data.count || 0;
    // FIX: self.navigator নয়, navigator ব্যবহার করো
    if (typeof navigator !== "undefined" && "setAppBadge" in navigator) {
      const p =
        count > 0
          ? navigator.setAppBadge(count)
          : navigator.clearAppBadge();
      p.catch(() => {});
    }
    event.source?.postMessage({ type: "BADGE_UPDATED", count, success: true });
  }

  // Token store (NotificationBell.jsx থেকে পাঠানো হয়)
  if (event.data?.type === "STORE_TOKEN") {
    self.__token = event.data.token || "";
  }

  // Skip waiting (নতুন SW version এলে)
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  // Cache clear
  if (event.data?.type === "CLEAR_CACHE") {
    event.waitUntil(
      caches.keys().then((cacheNames) =>
        Promise.all(cacheNames.map((name) => caches.delete(name)))
      )
    );
  }
});

// ================= INSTALL =================
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

// ================= ACTIVATE =================
self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      // পুরনো cache মুছো
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