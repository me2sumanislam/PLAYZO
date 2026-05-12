const CACHE_NAME = "playzo-v3";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // সব navigate request সবসময় network থেকে নেবে
  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request));
    return;
  }
  // API cache করবে না
  if (event.request.url.includes("/api/")) {
    event.respondWith(fetch(event.request));
    return;
  }
  // বাকি সব (CSS, JS, images) cache থেকে নেবে
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
