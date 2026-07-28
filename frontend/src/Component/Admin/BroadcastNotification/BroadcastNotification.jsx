 // src/Component/Admin/BroadcastNotification/BroadcastNotification.jsx
import React, { useState } from "react";

const BroadcastNotification = ({ api }) => {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState("");

  const inp = {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box",
    background: "#f9fafb",
  };

  const send = async () => {
    if (!title.trim() || !message.trim()) {
      setMsg("❌ Title ও Message দুটোই দিন");
      return;
    }
    if (!window.confirm("এই নোটিফিকেশনটি সব ইউজারকে পাঠাতে চান?")) return;

    setSending(true);
    setMsg("");
    try {
      const res = await api("/notifications/admin/broadcast", "POST", { title, message });
      if (res?.success) {
        setMsg(`✅ ${res.count ?? ""} জন ইউজারকে পাঠানো হয়েছে`);
        setTitle("");
        setMessage("");
      } else {
        setMsg("❌ " + (res?.message || "Failed"));
      }
    } catch {
      setMsg("❌ সমস্যা হয়েছে");
    }
    setSending(false);
    setTimeout(() => setMsg(""), 5000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: 20, maxWidth: 560 }}>
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: "14px 16px",
          boxShadow: "0 1px 4px #0001",
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 800, color: "#059669" }}>
          🔔 Send Broadcast Notification
        </div>
        <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
          এখানে যা লিখবেন সেটা push notification হিসেবে সব ইউজারের কাছে যাবে, এবং
          তাদের notification bell-এও জমা থাকবে।
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 1px 4px #0001" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input
            style={inp}
            placeholder="Title, যেমন: 🎉 মেগা টুর্নামেন্ট শুরু!"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            style={{ ...inp, minHeight: 100, resize: "vertical", fontFamily: "inherit" }}
            placeholder="Message, যেমন: আজ রাত ৮টায় মেগা টুর্নামেন্ট শুরু হচ্ছে, এখনই রেজিস্ট্রেশন করুন!"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />

          {msg && <div style={{ fontSize: 12, fontWeight: 700 }}>{msg}</div>}

          <button
            onClick={send}
            disabled={sending}
            style={{
              padding: "10px 16px",
              background: "#059669",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            {sending ? "পাঠানো হচ্ছে..." : "🚀 সব ইউজারকে পাঠান"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BroadcastNotification;