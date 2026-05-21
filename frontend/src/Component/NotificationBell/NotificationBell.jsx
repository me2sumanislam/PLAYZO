 // components/NotificationBell/NotificationBell.jsx
import { useState, useEffect, useCallback } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "https://playzo-vn8e.onrender.com/api";

export default function NotificationBell({ onOpen }) {
  const [unreadCount, setUnreadCount] = useState(0);

  // ✅ FIX: Badge update function যোগ করা হয়েছে
  const updateAppBadge = useCallback((count) => {
    try {
      if ("setAppBadge" in navigator) {
        if (count > 0) {
          navigator.setAppBadge(count).catch(() => {});
        } else {
          navigator.clearAppBadge().catch(() => {});
        }
      }
    } catch (e) {
      // silent fail
    }
  }, []);

  // ✅ FIX: fetchUnread এর পর badge update হবে
  const fetchUnread = async () => {
    try {
      const res = await fetch(`${API_BASE}/notifications?isRead=false&limit=1`);
      const data = await res.json();
      const count = data.unreadCount || 0;
      setUnreadCount(count);
      updateAppBadge(count); // ✅ এই লাইনটা ছিল না
    } catch {
      // silent fail
    }
  };

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30_000);
    return () => clearInterval(interval);
  }, []);

  // ✅ FIX: Service Worker থেকে message এলে badge update
  useEffect(() => {
    if (!navigator.serviceWorker) return;

    const handler = (event) => {
      if (event.data?.type === "NOTIFICATION_CLICK") {
        fetchUnread(); // ✅ এটা fetchUnread কল করবে, যার ভেতরে updateAppBadge আছে
      }
      // ✅ FIX: Push notification এলে badge update
      if (event.data?.type === "PUSH_RECEIVED") {
        const count = event.data.count || unreadCount + 1;
        setUnreadCount(count);
        updateAppBadge(count);
      }
    };

    navigator.serviceWorker.addEventListener("message", handler);
    return () => navigator.serviceWorker.removeEventListener("message", handler);
  }, [fetchUnread, unreadCount, updateAppBadge]);

  const handleOpen = async () => {
    if (unreadCount > 0) {
      try {
        await fetch(`${API_BASE}/notifications/read-all`, { method: "PATCH" });
        setUnreadCount(0);
        updateAppBadge(0); // ✅ FIX: Badge clear করো
        if ("clearAppBadge" in navigator) {
          navigator.clearAppBadge().catch(() => {});
        }
      } catch {
        // silent fail
      }
    }
    onOpen?.();
  };

  return (
    <button
      onClick={handleOpen}
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

      {/* 🔴 Unread Badge */}
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 shadow-lg shadow-red-500/50 animate-pulse">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </button>
  );
}