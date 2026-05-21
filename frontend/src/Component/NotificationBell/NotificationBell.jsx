 import React, { useState, useEffect, useRef } from "react";

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // ১. ডাটাবেজ থেকে নোটিফিকেশন লিস্ট ও আনরিড কাউন্ট নিয়ে আসা
  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications/list"); // আপনার ব্যাকএন্ড এন্ডপয়েন্ট
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // প্রতি ৩০ সেকেন্ড পর পর অটোমেটিক নতুন নোটিফিকেশন চেক করবে (Polling)
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // ২. বেল আইকনে ক্লিক করলে সব নোটিফিকেশন রিড (Read) মার্ক করা
  const handleBellClick = async () => {
    setIsOpen(!isOpen);
    if (unreadCount > 0) {
      try {
        setUnreadCount(0); // সাথে সাথে স্ক্রিনে কাউন্ট ০ করে দেওয়া (Smooth UX)
        await fetch("/api/notifications/mark-all-read", { method: "PUT" });
      } catch (err) {
        console.error("Failed to mark notifications as read:", err);
      }
    }
  };

  // ড্রপডাউনের বাইরে ক্লিক করলে ড্রপডাউন অটো বন্ধ হয়ে যাওয়ার লজিক
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* 🔔 বেল আইকন বাটন */}
      <button 
        onClick={handleBellClick} 
        className="btn btn-ghost btn-circle relative transition-all duration-200 active:scale-95"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-base-content"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* 🔴 লাল রঙের আনরিড ব্যাজ (শুধু কাউন্ট > ০ হলে দেখাবে) */}
        {unreadCount > 0 && (
          <span className="badge badge-error badge-sm absolute top-1 right-1 font-bold animate-pulse text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {/* 📂 নোটিফিকেশন ড্রপডাউন লিস্ট */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-xl border border-base-300 bg-base-100 shadow-xl z-50 animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="p-3 border-b border-base-200 font-bold text-sm flex justify-between items-center bg-base-200/50">
            <span>Notifications</span>
            {unreadCount > 0 && <span className="text-xs text-error">{unreadCount} new</span>}
          </div>

          <div className="divide-y divide-base-200">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-base-content/50">
                কোনো নোটিফিকেশন নেই 🎮
              </div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif._id} 
                  className={`p-3 text-sm hover:bg-base-200/40 transition-colors duration-150 ${
                    !notif.isRead ? "bg-info/5 border-l-4 border-info" : ""
                  }`}
                >
                  <p className="font-semibold text-base-content">{notif.title}</p>
                  <p className="text-xs text-base-content/70 mt-0.5">{notif.message}</p>
                  <span className="text-[10px] text-base-content/40 block mt-1">
                    {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;