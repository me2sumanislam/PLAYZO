 // src/utils/adminApi.js
// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers for all admin pages
// ─────────────────────────────────────────────────────────────────────────────

export const API_BASE = "https://playzo-vn8e.onrender.com/api";

/** Generic API helper */
export const api = async (path, options = {}) => {
  const token = localStorage.getItem("adminToken") || localStorage.getItem("token");
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...options,
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