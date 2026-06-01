 import { useState, useEffect, useCallback, useRef } from "react";

const API_BASE = ((import.meta.env.VITE_API_URL || 'https://playzo-vn8e.onrender.com') + '/api').replace(/\/api\/api/, '/api');

export default function NotificationBell({ onOpen }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const unreadCountRef = useRef(0);

  const updateAppBadge = useCallback((count) => {
    try {
      if ("setAppBadge" in navigator) {
        if (count > 0) {
          navigator.setAppBadge(count).catch(() => {});
        } else {
          navigator.clearAppBadge().catch(() => {});
        }
      }
      if (navigator.serviceWorker?.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: "UPDATE_BADGE",
          count: count,
        });
      }
    } catch {
      // silent fail
    }
  }, []);

  const fetchUnread = useCallback(async () => {
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${API_BASE}/notifications?isRead=false&limit=1`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) return;
      const data = await res.json();
      const count = typeof data.unreadCount === "number" ? data.unreadCount : 0;

      if (count !== unreadCountRef.current) {
        unreadCountRef.current = count;
        setUnreadCount(count);
        updateAppBadge(count);
      }
    } catch {
      // silent fail
    }
  }, [updateAppBadge]);

  // প্রথমবার load এবং ৩০ সেকেন্ড পরপর refresh
  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30_000);
    return () => clearInterval(interval);
  }, [fetchUnread]);

  // Service Worker থেকে message handle
  useEffect(() => {
    if (!navigator.serviceWorker) return;

    const handler = (event) => {
      const { type, count } = event.data || {};

      if (type === "NOTIFICATION_CLICK") {
        fetchUnread();
      }

      if (type === "PUSH_RECEIVED") {
        const newCount =
          typeof count === "number" ? count : unreadCountRef.current + 1;
        unreadCountRef.current = newCount;
        setUnreadCount(newCount);
        updateAppBadge(newCount);
      }

      if (type === "BADGE_UPDATE") {
        const newCount = typeof count === "number" ? count : 0;
        if (newCount !== unreadCountRef.current) {
          unreadCountRef.current = newCount;
          setUnreadCount(newCount);
        }
      }

      if (type === "BADGE_CLEARED") {
        unreadCountRef.current = 0;
        setUnreadCount(0);
      }
    };

    navigator.serviceWorker.addEventListener("message", handler);
    return () => navigator.serviceWorker.removeEventListener("message", handler);
  }, [fetchUnread, updateAppBadge]);

  // Bell click — সব read করো + badge clear
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

        if (navigator.serviceWorker?.controller) {
          navigator.serviceWorker.controller.postMessage({ type: "CLEAR_BADGE" });
        }
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
      {/* 🔔 Bell Icon */}
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

      {/* 🔴 Unread Badge */}
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