 const API_BASE =
  import.meta.env.VITE_API_URL ||
  "https://playzo-vn8e.onrender.com/api";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);

  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export const subscribeUserToPush = async () => {
  try {
    // browser support check
    if (!("serviceWorker" in navigator)) {
      console.log("Service worker not supported");
      return;
    }

    if (!("PushManager" in window)) {
      console.log("Push not supported");
      return;
    }

    // permission
    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      console.log("Notification permission denied");
      return;
    }

    // register sw
    const registration = await navigator.serviceWorker.register("/sw.js");

    console.log("SW Registered");

    // subscribe
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        VAPID_PUBLIC_KEY
      ),
    });

    console.log("Push subscribed");

    const user = JSON.parse(localStorage.getItem("user") || "{}");

    // send backend
    await fetch(`${API_BASE}/notifications/subscribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        subscription,
        userId: user?._id || null,
      }),
    });

    console.log("Subscription saved");
  } catch (err) {
    console.error("Push subscribe error:", err);
  }
};