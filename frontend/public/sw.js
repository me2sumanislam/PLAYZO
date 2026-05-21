 // =========================================================
// public/sw.js  — injectManifest strategy (Vite PWA)
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
    data = { title: "New Notification", body: "Something happened" };
  }

  // 🔑 KEY FIX: matchId সহ URL তৈরি করা হচ্ছে
  // Backend থেকে data.matchId পাঠাতে হবে (নিচে backend fix দেখুন)
  const targetUrl = data.matchId
    ? `/app?tab=results&matchId=${data.matchId}`
    : data.url || "/app";

  const options = {
    body: data.body,
    icon: data.icon || "/image/icon/icon-192x192.png",
    badge: data.badge || "/image/icon/icon-72x72.png",
    vibrate: [200, 100, 200, 100, 200],
    tag: `match-${data.matchId || "general"}`, // একই match-এর duplicate notification আসবে না
    renotify: true,
    data: {
      url: targetUrl,
      matchId: data.matchId || null,
    },
  };

  // 🔢 App icon badge (Android Chrome / Samsung Browser support করে)
  if ("setAppBadge" in self.navigator) {
    const badgeCount = data.unreadCount || 1;
    self.navigator
      .setAppBadge(badgeCount)
      .catch((err) => console.error("Badge error:", err));
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// ================= NOTIFICATION CLICK =================
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const notifData = event.notification.data || {};
  const targetUrl = notifData.url || "/app";
  const matchId = notifData.matchId || null;

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        // অ্যাপ ইতিমধ্যে খোলা থাকলে — সেই window-কে focus করে navigate করো
        for (const client of windowClients) {
          if (client.url.includes("/app") && "focus" in client) {
            // React এ message পাঠাও, সেখানে tab/screen switch হবে
            client.postMessage({
              type: "NOTIFICATION_CLICK",
              matchId: matchId,
              url: targetUrl,
            });
            return client.focus();
          }
        }

        // অ্যাপ বন্ধ থাকলে — নতুন করে খোলো
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});

// ================= APP BADGE CLEAR (অ্যাপ খুললে badge সরাও) =================
self.addEventListener("message", (event) => {
  if (event.data?.type === "CLEAR_BADGE") {
    if ("clearAppBadge" in self.navigator) {
      self.navigator.clearAppBadge().catch(console.error);
    }
  }
});