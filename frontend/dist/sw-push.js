 // public/sw-push.js

// ================= পুশ নোটিফিকেশন রিসিভ করার লজিক =================
self.addEventListener("push", (event) => {
  let data = {};

  try {
    data = event.data.json();
  } catch {
    data = {
      title: "New Notification",
      body: "Something happened",
      unreadCount: 1,
    };
  }

  const options = {
    body: data.body,
    icon: data.icon || "/image/icon/icon-192x192.png",
    badge: data.badge || "/image/icon/icon-72x72.png",
    vibrate: data.vibrate || [200, 100, 200],
    tag: data.tag || "playzo-match-alert",
    renotify: true,
    data: {
      url: data.url || "/",
    },
  };

  // ✅ FIX: badge set + notification show — সব একটাই event.waitUntil()-এ
  event.waitUntil(
    Promise.all([
      // 1. Notification দেখাও
      self.registration.showNotification(data.title || "Notification", options),

      // 2. 🔢 App Icon Badge set করো
      self.navigator.setAppBadge
        ? self.navigator
            .setAppBadge(data.unreadCount || 1)
            .catch((err) => console.error("Failed to set app badge:", err))
        : Promise.resolve(),

      // 3. React App কে জানাও (অ্যাপ খোলা থাকলে bell icon আপডেট হবে)
      self.clients
        .matchAll({ type: "window", includeUncontrolled: true })
        .then((clients) => {
          clients.forEach((client) => {
            if (client.url.includes("/app")) {
              client.postMessage({
                type: "PUSH_RECEIVED",
                count: data.unreadCount || 1,
              });
            }
          });
        }),
    ])
  );
});

// ================= নোটিফিকেশনে ক্লিক করার লজিক =================
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/";

  // ✅ FIX: সব কাজ একটাই event.waitUntil()-এ
  event.waitUntil(
    Promise.all([
      // 1. App focus বা open করো
      self.clients
        .matchAll({ type: "window", includeUncontrolled: true })
        .then((windowClients) => {
          for (const client of windowClients) {
            if (client.url.includes("/app") && "focus" in client) {
              client.postMessage({ type: "NOTIFICATION_CLICK" });
              return client.navigate(url).then((c) => c.focus());
            }
          }
          if (self.clients.openWindow) return self.clients.openWindow(url);
        }),

      // 2. Badge আপডেট করো — API থেকে নতুন count নিয়ে আসো
      fetch("https://playzo-vn8e.onrender.com/api/notifications?isRead=false&limit=1")
        .then((res) => res.json())
        .then((resData) => {
          const count = resData.unreadCount || 0;
          if (self.navigator.setAppBadge) {
            return count > 0
              ? self.navigator.setAppBadge(count).catch(() => {})
              : self.navigator.clearAppBadge().catch(() => {});
          }
        })
        .catch(() => {}),
    ])
  );
});