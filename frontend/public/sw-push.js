self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data.json();
  } catch {
    data = {
      title: "New Notification",
      body: "Something happened",
    };
  }
  const options = {
    body: data.body,
    icon: data.icon || "/image/icon/icon-192x192.png",
    badge: data.badge || "/image/icon/icon-72x72.png",
    vibrate: data.vibrate || [200, 100, 200],
    tag: data.tag || "playzo-match-alert",
    renotify: true,
    data: { url: data.url || "/" },
  };
  if ("setAppBadge" in self.navigator) {
    self.navigator.setAppBadge(data.unreadCount || 1).catch(() => {});
  }
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url.includes("/app") && "focus" in client) {
            return client.navigate(url).then((c) => c.focus());
          }
        }
        if (clients.openWindow) return clients.openWindow(url);
      })
  );
});