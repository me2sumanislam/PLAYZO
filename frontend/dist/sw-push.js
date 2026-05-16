 // public/sw-push.js

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
    data: {
      url: data.url || "/",
    },
  };

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
          if (client.url.includes(url) && "focus" in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});