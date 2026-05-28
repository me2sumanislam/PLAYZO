 // components/NotificationBell/NotificationBell.jsx
import { useState, useEffect, useCallback, useRef } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "https://playzo-vn8e.onrender.com/api";

export default function NotificationBell({ onOpen }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const unreadCountRef = useRef(0); // ✅ FIX: stale closure সমস্যা এড়াতে ref ব্যবহার

  // ✅ App badge update (mobile home screen icon এ badge দেখায়)
  const updateAppBadge = useCallback((count) => {
    try {
      if ("setAppBadge" in navigator) {
        if (count > 0) {
          navigator.setAppBadge(count).catch(() => {});
        } else {
          navigator.clearAppBadge().catch(() => {});
        }
      }
      // ✅ Service Worker কেও জানাও যাতে SW side থেকেও badge ঠিক থাকে
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

  // ✅ API থেকে unread count নিয়ে আসো
  const fetchUnread = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/notifications?isRead=false&limit=1`);
      if (!res.ok) return;
      const data = await res.json();
      const count = typeof data.unreadCount === "number" ? data.unreadCount : 0;

      // শুধু পরিবর্তন হলে update করো (unnecessary re-render এড়াতে)
      if (count !== unreadCountRef.current) {
        unreadCountRef.current = count;
        setUnreadCount(count);
        updateAppBadge(count);
      }
    } catch {
      // silent fail
    }
  }, [updateAppBadge]);

  // ✅ প্রথমবার load এবং ৩০ সেকেন্ড পরপর refresh
  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30_000);
    return () => clearInterval(interval);
  }, [fetchUnread]);

  // ✅ Service Worker থেকে message handle করো
  useEffect(() => {
    if (!navigator.serviceWorker) return;

    const handler = (event) => {
      const { type, count } = event.data || {};

      // Notification click হলে (SW থেকে)
      if (type === "NOTIFICATION_CLICK") {
        fetchUnread();
      }

      // নতুন Push notification এলে (SW থেকে)
      if (type === "PUSH_RECEIVED") {
        const newCount =
          typeof count === "number" ? count : unreadCountRef.current + 1;
        unreadCountRef.current = newCount;
        setUnreadCount(newCount);
        updateAppBadge(newCount);
      }

      // Badge updated confirmation (SW থেকে)
      if (type === "BADGE_UPDATED" || type === "BADGE_CLEARED") {
        // শুধু log, কিছু করার নেই
        console.log("Badge status from SW:", type);
      }
    };

    navigator.serviceWorker.addEventListener("message", handler);
    return () => navigator.serviceWorker.removeEventListener("message", handler);
  }, [fetchUnread, updateAppBadge]);

  // ✅ Bell icon click — সব notification read করো + badge clear
  const handleOpen = async () => {
    if (unreadCount > 0) {
      try {
        // Optimistic update — আগেই UI তে 0 করো
        unreadCountRef.current = 0;
        setUnreadCount(0);
        updateAppBadge(0);

        // তারপর API call
        const token = localStorage.getItem("token") || "";
        await fetch(`${API_BASE}/notifications/read-all`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        // Service Worker কে badge clear করতে বলো
        if (navigator.serviceWorker?.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: "CLEAR_BADGE",
          });
        }
      } catch {
        // API fail হলে আবার fetch করো
        fetchUnread();
      }
    }

    // Parent component কে জানাও (notification panel open করতে)
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

      {/* 🔴 Unread Badge — unread থাকলেই দেখাবে */}
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