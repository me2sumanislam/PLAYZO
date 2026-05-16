 import { convertVapidKey } from "./convertVapidKey";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "https://playzo-vn8e.onrender.com/api";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

export const subscribeUserToPush = async () => {
  try {
    if (!("serviceWorker" in navigator)) return;
    if (!("PushManager" in window)) return;

    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      console.log("❌ Notification denied");
      return;
    }

    const registration = await navigator.serviceWorker.register("/sw.js");
    console.log("SW Registered");

    if (!VAPID_PUBLIC_KEY) {
      console.error("❌ VAPID key missing in .env");
      return;
    }

    const applicationServerKey = convertVapidKey(VAPID_PUBLIC_KEY);

    if (!applicationServerKey) {
      console.error("❌ Invalid VAPID key");
      return;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });

    console.log("Push subscribed");

    const user = JSON.parse(localStorage.getItem("user") || "{}");

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
    console.error("❌ Push subscribe error:", err);
  }
};