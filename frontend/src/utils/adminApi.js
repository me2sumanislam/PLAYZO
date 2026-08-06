 // src/utils/adminApi.js
// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers for all admin pages
// ─────────────────────────────────────────────────────────────────────────────

export const API_BASE = "https://playzo-vn8e.onrender.com/api";

/** Generic API helper */
export const api = async (path, options = {}) => {
  const token = localStorage.getItem("adminToken") || localStorage.getItem("token");
  try {
    // ✅ FIX: body FormData (ছবি আপলোড) হলে Content-Type নিজে বসাবেন না —
    // ব্রাউজার নিজেই সঠিক "multipart/form-data; boundary=..." হেডার বসায়।
    // আগে সবসময় "application/json" জোর করে বসানো হতো, ফলে multipart
    // request-এও JSON header যেত আর backend-এর express.json() সেটা parse
    // করতে গিয়ে crash করত (এটাই "Unexpected token '-'" error-এর কারণ)।
    const isFormData = options.body instanceof FormData;

    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
    if (res.status === 401) {
      localStorage.clear();
      window.location.reload();
      return { success: false };
    }
    return res.ok ? await res.json() : { success: false, status: res.status };
  } catch {
    return { success: false };
  }
};

/** Format money */
export const fmt = (n) => "৳" + Number(n || 0).toLocaleString();

/** Time ago */
export const timeAgo = (date) => {
  if (!date) return "";
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

export default api;