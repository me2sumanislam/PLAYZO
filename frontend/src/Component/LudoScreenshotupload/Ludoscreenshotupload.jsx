 // LudoScreenshotUpload.jsx
// Ludo Tournament এর match card এ add করুন
// Props: matchId, matchStatus

import React, { useState, useRef } from "react";

const API = (
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  "https://playzo-vn8e.onrender.com"
).replace("/api", "");

const LudoScreenshotUpload = ({ matchId, matchStatus }) => {
  const [file, setFile]       = useState(null);
  const [preview, setPreview] = useState(null);
  const [status, setStatus]   = useState("idle"); // idle | uploading | done | error
  const [message, setMessage] = useState("");
  const [result, setResult]   = useState(null);
  const fileRef               = useRef();

  const token = localStorage.getItem("token");

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) { setMessage("শুধু image file select করুন"); return; }
    if (f.size > 8 * 1024 * 1024)     { setMessage("File size 8MB এর মধ্যে হতে হবে"); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setMessage("");
  };

  const handleUpload = async () => {
    if (!file) return;
    setStatus("uploading");
    setMessage("Upload হচ্ছে...");

    const formData = new FormData();
    formData.append("screenshot", file);

    try {
      const res  = await fetch(`${API}/api/ludo-result/upload/${matchId}`, {
        method:  "POST",
        headers: { Authorization: `Bearer ${token}` },
        body:    formData,
      });
      const data = await res.json();

      if (data.success) {
        setStatus("done");
        setMessage("✅ Screenshot submit হয়েছে! Admin review করবে।");
      } else {
        setStatus("error");
        setMessage(data.message || "Upload failed");
      }
    } catch {
      setStatus("error");
      setMessage("Network error। আবার চেষ্টা করুন।");
    }
  };

  const checkStatus = async () => {
    try {
      const res  = await fetch(`${API}/api/ludo-result/my/${matchId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setResult(data.data);
      else setMessage("কোনো submission নেই");
    } catch {
      setMessage("Status check করা গেলো না");
    }
  };

  // Already submitted — show status
  if (result) {
    return (
      <div style={S.card}>
        <span style={S.badge(result.status)}>{statusLabel(result.status)}</span>
        {result.status === "pending_review" && (
          <p style={{ fontSize: 12, color: "#92400e", marginTop: 8 }}>
            Screenshot জমা আছে। Admin review করছেন।
          </p>
        )}
        {result.status === "rejected" && result.adminNote && (
          <p style={{ fontSize: 12, color: "#991b1b", marginTop: 8 }}>
            কারণ: {result.adminNote}
          </p>
        )}
      </div>
    );
  }

  if (matchStatus === "completed") {
    return (
      <button style={S.btnSecondary} onClick={checkStatus}>
        🔍 Result Status দেখুন
      </button>
    );
  }

  return (
    <div style={S.card}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8 }}>
        📸 Result Screenshot Submit করুন
      </div>

      {preview && (
        <img src={preview} alt="preview"
          style={{ width: "100%", borderRadius: 8, maxHeight: 180, objectFit: "cover", marginBottom: 8 }} />
      )}

      {status === "idle" && (
        <>
          <div onClick={() => fileRef.current?.click()} style={S.dropzone}>
            <span style={{ fontSize: 24 }}>📂</span>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "#6b7280" }}>
              {file ? file.name : "Screenshot select করুন"}
            </p>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
          {file && (
            <button style={S.btnPrimary} onClick={handleUpload}>
              Submit করুন
            </button>
          )}
        </>
      )}

      {status === "uploading" && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 0", color: "#6b7280", fontSize: 13 }}>
          <div style={S.spinner} /> Upload হচ্ছে...
        </div>
      )}

      {status === "done" && (
        <div style={{ background: "#d1fae5", padding: "10px 12px", borderRadius: 8, fontSize: 13, color: "#065f46", fontWeight: 600 }}>
          ✅ Screenshot জমা হয়েছে! Admin review করবে।
        </div>
      )}

      {status === "error" && (
        <button style={S.btnPrimary}
          onClick={() => { setStatus("idle"); setFile(null); setPreview(null); }}>
          আবার চেষ্টা করুন
        </button>
      )}

      {message && status !== "done" && (
        <p style={{ fontSize: 12, color: status === "error" ? "#dc2626" : "#6b7280", marginTop: 6 }}>
          {message}
        </p>
      )}
    </div>
  );
};

const statusLabel = (s) => ({
  pending_review: "🔍 Review চলছে",
  approved:       "✅ Approved",
  rejected:       "❌ Rejected",
  published:      "🏆 Published",
})[s] || s;

const S = {
  card: { background: "#f9fafb", borderRadius: 10, padding: 12, marginTop: 10, border: "1px solid #e5e7eb" },
  dropzone: {
    border: "2px dashed #d1d5db", borderRadius: 8, padding: "18px 12px",
    textAlign: "center", cursor: "pointer", background: "#fff",
  },
  btnPrimary: {
    width: "100%", marginTop: 10, padding: "10px 0", borderRadius: 8,
    background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
    color: "#fff", border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer",
  },
  btnSecondary: {
    width: "100%", marginTop: 8, padding: "8px 0", borderRadius: 8,
    background: "#ede9fe", color: "#6d28d9", border: "none",
    fontWeight: 600, fontSize: 13, cursor: "pointer",
  },
  badge: (s) => ({
    display: "inline-block", padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
    background: { pending_review:"#dbeafe", approved:"#d1fae5", rejected:"#fee2e2", published:"#ede9fe" }[s] || "#f3f4f6",
    color:      { pending_review:"#1e40af", approved:"#065f46", rejected:"#991b1b", published:"#5b21b6" }[s] || "#374151",
  }),
  spinner: {
    width: 16, height: 16, borderRadius: "50%",
    border: "2px solid #e5e7eb", borderTopColor: "#7c3aed",
    animation: "spin 0.8s linear infinite",
  },
};

export default LudoScreenshotUpload;

// ─── LudoTournamentSection.jsx এ কীভাবে use করবেন ───────────────
// import LudoScreenshotUpload from "../../Component/LudoScreenshotUpload/LudoScreenshotUpload";
//
// match card এর ভেতরে (status === "live" হলে):
// <LudoScreenshotUpload matchId={match._id} matchStatus={match.status} />