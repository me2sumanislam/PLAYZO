 export function convertVapidKey(base64String = "") {
  if (!base64String) return null;

  try {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const raw = atob(base64);

    return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
  } catch (err) {
    console.error("VAPID convert error:", err);
    return null;
  }
}