 export const API = "https://playzo-vn8e.onrender.com/api";

export const fmt = (n) => "৳" + Number(n || 0).toLocaleString("bn-BD");

export const timeAgo = (d) => {
  if (!d) return "";
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};
 export const api = async (path, opts = {}) => {
  const token =
    localStorage.getItem("adminToken") || localStorage.getItem("token");

  try {
    const res = await fetch(`${API}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      ...opts,
    });

    if (res.status === 401) {
      localStorage.clear();
      window.location.reload();
      return { success: false };
    }

    if (!res.ok) return { success: false, status: res.status };

    return await res.json();
  } catch (err) {
    return { success: false };
  }
};

export default api;