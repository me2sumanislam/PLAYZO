 // src/Component/AnnouncementModal/AnnouncementModal.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "https://playzo-vn8e.onrender.com/api";
const CLEAN_API_URL = API_BASE.endsWith("/api") ? API_BASE : `${API_BASE}/api`;

const AnnouncementModal = () => {
  const [ann, setAnn] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    axios
      .get(`${CLEAN_API_URL}/announcement`)
      .then((res) => {
        if (cancelled) return;
        const data = res.data?.data;
        if (!data || !data.active || !data.body) return;

        // ✅ প্রতিবার app open হলেই দেখানো হবে (আগে seen-check ছিল, এখন বাদ দেওয়া হলো)
        setAnn(data);
        setVisible(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const close = () => {
    setVisible(false);
  };

  if (!visible || !ann) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: 16,
      }}
      onClick={close}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 20,
          padding: 20,
          maxWidth: 380,
          width: "100%",
          boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {ann.title && (
          <h2
            style={{
              fontSize: 18,
              fontWeight: 800,
              marginBottom: 10,
              color: "#1f2937",
            }}
          >
            📢 {ann.title}
          </h2>
        )}
        <p
          style={{
            fontSize: 14,
            color: "#374151",
            whiteSpace: "pre-line",
            lineHeight: 1.6,
            marginBottom: 20,
          }}
        >
          {ann.body}
        </p>
        <button
          onClick={close}
          style={{
            width: "100%",
            padding: "12px",
            background: "#ff8a00",
            color: "#fff",
            border: "none",
            borderRadius: 12,
            fontWeight: 800,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          বুঝেছি ✓
        </button>
      </div>
    </div>
  );
};

export default AnnouncementModal;