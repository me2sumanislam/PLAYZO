 // components/NotificationBell/NotificationBell.jsx
import { useState, useEffect, useCallback, useRef } from "react";

const API_BASE = (
  (import.meta.env.VITE_API_URL || "https://playzo-vn8e.onrender.com") + "/api"
).replace(/\/api\/api/, "/api");

export default function NotificationBell({ onOpen }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const unreadCountRef = useRef(0);

  // ─── App Badge update ───────────────────────────────────────────────────────
  const updateAppBadge = useCallback((count) => {
    try {
      if ("setAppBadge" in navigator) {
        if (count > 0) {
          navigator.setAppBadge(count).catch(() => {});
        } else {
          navigator.clearAppBadge().catch(() => {});
        }
      }
    } catch {}

    // Service Worker কেও badge জানাও
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready
        .then((reg) => {
          reg.active?.postMessage({ type: "UPDATE_BADGE", count });
        })
        .catch(() => {});
    }
  }, []);

  // ─── SW তে token পাঠাও (app open হলেই) ────────────────────────────────────
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready
        .then((reg) => {
          const token = localStorage.getItem("token") || "";
          if (token) {
            reg.active?.postMessage({ type: "STORE_TOKEN", token });
          }
        })
        .catch(() => {});
    }
  }, []);

  // ─── OneSignal এ user login করাও (external_id set) ─────────────────────────
  useEffect(() => {
    const user = (() => {
      try {
        return JSON.parse(localStorage.getItem("user") || "{}");
      } catch {
        return {};
      }
    })();
    const userId = user?.id || user?._id;
    if (!userId) return;

    if (window.OneSignalDeferred) {
      window.OneSignalDeferred.push((OneSignal) => {
        OneSignal.login(userId.toString()).catch(() => {});
      });
    }
  }, []);

  // ─── API থেকে unread count fetch ────────────────────────────────────────────
  const fetchUnread = useCallback(async () => {
    try {
      const token = localStorage.getItem("token") || "";
      if (!token) return;
      const res = await fetch(
        `${API_BASE}/notifications?isRead=false&limit=1`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) return;
      const data = await res.json();
      const count = typeof data.unreadCount === "number" ? data.unreadCount : 0;

      if (count !== unreadCountRef.current) {
        unreadCountRef.current = count;
        setUnreadCount(count);
        updateAppBadge(count);
      }
    } catch {}
  }, [updateAppBadge]);

  // ─── প্রথম load + ৩০ সেকেন্ড polling ─────────────────────────────────────
  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30_000);
    return () => clearInterval(interval);
  }, [fetchUnread]);

  // ─── Page visible হলে আবার fetch ───────────────────────────────────────────
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") fetchUnread();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [fetchUnread]);

  // ─── SW থেকে push এলে count update ────────────────────────────────────────
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const handler = (event) => {
      if (event.data?.type === "PUSH_RECEIVED") {
        fetchUnread();
      }
      if (event.data?.type === "BADGE_UPDATE") {
        const count = event.data.count || 0;
        unreadCountRef.current = count;
        setUnreadCount(count);
        updateAppBadge(count);
      }
    };
    navigator.serviceWorker.addEventListener("message", handler);
    return () => navigator.serviceWorker.removeEventListener("message", handler);
  }, [fetchUnread, updateAppBadge]);

  // ─── OneSignal foreground notification ─────────────────────────────────────
  useEffect(() => {
    if (!window.OneSignalDeferred) return;
    window.OneSignalDeferred.push((OneSignal) => {
      OneSignal.Notifications.addEventListener("foregroundWillDisplay", () => {
        fetchUnread();
      });
      OneSignal.Notifications.addEventListener("click", () => {
        fetchUnread();
      });
    });
  }, [fetchUnread]);

  // ─── Bell click — read all + badge clear ────────────────────────────────────
  const handleOpen = async () => {
    if (unreadCount > 0) {
      try {
        unreadCountRef.current = 0;
        setUnreadCount(0);
        updateAppBadge(0);

        const token = localStorage.getItem("token") || "";
        await fetch(`${API_BASE}/notifications/read-all`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
      } catch {
        fetchUnread();
      }
    }
    onOpen?.();
  };

  return (
    <button
      onClick={handleOpen}
      aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
      className="relative flex items-center justify-center w-10 h-10 rounded-full bg-white/10 active:scale-95 transition-all"
    >
      {/* Bell Icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-5 h-5 text-white"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>

      {/* Unread Badge */}
      {unreadCount > 0 && (
        <span
          className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 shadow-lg shadow-red-500/50 animate-pulse"
          aria-hidden="true"
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </button>
  );
}