 // src/Component/Admin/AnnouncementManager/AnnouncementManager.jsx
import React, { useState, useEffect, useCallback } from "react";

const AnnouncementManager = ({ api }) => {
  const [form, setForm] = useState({ title: "", body: "", active: true });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api("/announcement");
      const data = res?.data;
      if (data) {
        setForm({
          title: data.title || "",
          body: data.body || "",
          active: data.active !== false,
        });
      }
    } catch {}
    setLoading(false);
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!form.body.trim()) {
      setMsg("❌ Announcement text দিন");
      return;
    }
    setSaving(true);
    try {
     const res = await api("/announcement", { method: "PUT", body: JSON.stringify(form) });
      if (res?.success) {
        setMsg("✅ সংরক্ষিত হয়েছে! (App খুললে user রা নতুন করে popup দেখবে)");
      } else {
        setMsg("❌ " + (res?.message || "Failed"));
      }
    } catch {
      setMsg("❌ সমস্যা হয়েছে");
    }
    setSaving(false);
    setTimeout(() => setMsg(""), 4000);
  };

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

  if (loading) return <div style={{ padding: 20 }}>লোড হচ্ছে...</div>;

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
        <div style={{ fontSize: 15, fontWeight: 800, color: "#4f46e5" }}>
          📢 App Announcement (Popup)
        </div>
        <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
          App খোলার সময় ইউজাররা এই টেক্সট popup আকারে দেখবে। যেমন: সর্বনিম্ন
          deposit/withdraw amount, mega tournament info ইত্যাদি।
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 1px 4px #0001" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input
            style={inp}
            placeholder="Title (ঐচ্ছিক), যেমন: গুরুত্বপূর্ণ তথ্য"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          />
          <textarea
            style={{ ...inp, minHeight: 140, resize: "vertical", fontFamily: "inherit" }}
            placeholder={
              "যেমন:\nসর্বনিম্ন ডিপোজিট ৫০ টাকা এবং উইথড্র ১০০ টাকা।\nমেগা টুর্নামেন্টের জন্য বেশি বেশি ম্যাচ খেলুন এবং রেফার করুন।"
            }
            value={form.body}
            onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))}
          />
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#374151" }}>
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((p) => ({ ...p, active: e.target.checked }))}
            />
            Active (চালু রাখুন যেন ইউজাররা দেখতে পায়)
          </label>

          {msg && <div style={{ fontSize: 12, fontWeight: 700 }}>{msg}</div>}

          <button
            onClick={save}
            disabled={saving}
            style={{
              padding: "10px 16px",
              background: "#4f46e5",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            {saving ? "সংরক্ষণ হচ্ছে..." : "💾 সংরক্ষণ করুন"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementManager;