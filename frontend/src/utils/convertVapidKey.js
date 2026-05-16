 // FILE: frontend/src/utils/convertVapidKey.js

export function convertVapidKey(base64String = "") {
  if (!base64String || typeof base64String !== "string") {
    console.error("❌ Invalid VAPID key");
    return null;
  }

  try {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const raw = atob(base64);

    return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
  } catch (err) {
    console.error("❌ VAPID convert failed:", err);
    return null;
  }
}