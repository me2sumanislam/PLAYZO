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
    };
  }

  const options = {
    body: data.body,
    icon: data.icon || "/image/icon/icon-192x192.png",
    badge: data.badge || "/image/icon/icon-72x72.png",
    
    // 🔴 মোবাইল স্ক্রিনের ওপর পপ-আপ (Heads-Up) করানোর জন্য সেটিংস
    vibrate: data.vibrate || [200, 100, 200],
    tag: data.tag || "playzo-match-alert",
    renotify: data.renotify || true,
    
    data: {
      url: data.url || "/",
    },
  };

  // 🔢 মোবাইল স্ক্রিনের অ্যাপ আইকনে সংখ্যা (Badge) বসানোর লজিক
  if ("setAppBadge" in self.navigator) {
    // ব্যাকএন্ড থেকে পাঠানো unreadCount থাকলে সেটা বসবে, না থাকলে অন্তত ১টি কাউন্ট দেখাবে
    const badgeCount = data.unreadCount || 1;
    self.navigator.setAppBadge(badgeCount).catch((err) => 
      console.error("Failed to set app badge from background:", err)
    );
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// ================= নোটিফিকেশনে ক্লিক করার লজিক =================
self.addEventListener("notificationclick", (event) => {
  event.notification.close(); // ক্লিক করার সাথে সাথে প্যানেল থেকে নোটিফিকেশনটি মুছে যাবে

  const url = event.notification.data.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        // ১. যদি অ্যাপ অলরেডি ব্যাকগ্রাউন্ডে বা কোনো ট্যাবে ওপেন থাকে
        for (const client of windowClients) {
          // আমাদের অ্যাপের মেইন রুট বা ড্যাশবোর্ড ওপেন আছে কিনা চেক করছি
          if (client.url.includes("/app") && "focus" in client) {
            // এক্সিস্টিং ওপেন থাকা উইন্ডোটিকে নতুন ম্যাচের ইউআরএল-এ রিডাইরেক্ট করবে
            return client.navigate(url).then((focusedClient) => focusedClient.focus());
          }
        }
        
        // ২. যদি অ্যাপ একদম পুরোপুরি বন্ধ থাকে, তবে নতুন করে ওপেন করবে
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});