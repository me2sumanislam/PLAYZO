 

import React, { useState, useRef } from "react";

 const API = "https://playzo-vn8e.onrender.com";

const ScreenshotUpload = ({ matchId, matchTitle, matchStatus }) => {
  const [file, setFile]         = useState(null);
  const [preview, setPreview]   = useState(null);
  const [status, setStatus]     = useState("idle"); // idle | uploading | processing | done | error
  const [message, setMessage]   = useState("");
  const [result, setResult]     = useState(null);
  const fileRef                 = useRef();

  const token = localStorage.getItem("token");

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    if (!selected.type.startsWith("image/")) {
      setMessage("শুধু image file select করুন");
      return;
    }
    if (selected.size > 8 * 1024 * 1024) {
      setMessage("File size 8MB এর বেশি না");
      return;
    }
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setMessage("");
  };

  const handleUpload = async () => {
    if (!file) return;
    setStatus("uploading");
    setMessage("Upload হচ্ছে...");

    const formData = new FormData();
    formData.append("screenshot", file);

    try {
      const res  = await fetch(`${API}/api/result/upload/${matchId}`, {
        method:  "POST",
        headers: { Authorization: `Bearer ${token}` },
        body:    formData,
      });
      const data = await res.json();

      if (data.success) {
        setStatus("processing");
        setMessage("OCR processing চলছে... কিছুক্ষণ পরে result দেখুন");
        // 10 সেকেন্ড পরে result check করি
        setTimeout(() => checkResult(), 12000);
      } else {
        setStatus("error");
        setMessage(data.message || "Upload failed");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. আবার চেষ্টা করুন।");
    }
  };

  const checkResult = async () => {
    try {
      const res  = await fetch(`${API}/api/result/my/${matchId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.data);
        setStatus("done");
        setMessage("");
      }
    } catch {
      setMessage("Result check করতে পারছি না");
    }
  };

  // Match complete বা already submitted হলে result দেখাই
  if (result) {
    return (
      <div style={styles.card}>
        <div style={styles.statusBadge(result.status)}>
          {statusLabel(result.status)}
        </div>
        {result.status === "published" && result.finalPlayers?.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <div style={styles.label}>Result Leaderboard</div>
            {result.finalPlayers.map((p, i) => (
              <div key={i} style={styles.playerRow}>
                <span style={styles.rank}>#{i + 1}</span>
                <span style={styles.name}>{p.inGameName}</span>
                <span style={styles.kills}>{p.kills} kills</span>
                {p.prizeAwarded > 0 && (
                  <span style={styles.prize}>৳{p.prizeAwarded}</span>
                )}
              </div>
            ))}
          </div>
        )}
        {result.status === "pending_review" && (
          <p style={{ color: "#b45309", fontSize: 13, marginTop: 8 }}>
            Screenshot জমা হয়েছে। Admin review করছেন...
          </p>
        )}
      </div>
    );
  }

  if (matchStatus === "completed") {
    return (
      <button style={styles.btnSecondary} onClick={checkResult}>
        Result দেখুন
      </button>
    );
  }

  return (
    <div style={styles.card}>
      {/* Preview */}
      {preview && (
        <div style={{ marginBottom: 10 }}>
          <img
            src={preview}
            alt="screenshot preview"
            style={{ width: "100%", borderRadius: 8, maxHeight: 200, objectFit: "cover" }}
          />
        </div>
      )}

      {/* Upload area */}
      {status === "idle" && (
        <>
          <div
            style={styles.dropzone}
            onClick={() => fileRef.current.click()}
          >
            <span style={{ fontSize: 28 }}>📸</span>
            <p style={{ margin: "6px 0 0", fontSize: 13, color: "#6b7280" }}>
              {file ? file.name : "Result screenshot select করুন"}
            </p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
          {file && (
            <button style={styles.btnPrimary} onClick={handleUpload}>
              Submit করুন
            </button>
          )}
        </>
      )}

      {status === "uploading" && (
        <div style={styles.processing}>
          <div style={styles.spinner} />
          <span>Upload হচ্ছে...</span>
        </div>
      )}

      {status === "processing" && (
        <div style={styles.processing}>
          <div style={styles.spinner} />
          <span>OCR দিয়ে result পড়া হচ্ছে...</span>
        </div>
      )}

      {status === "error" && (
        <button style={styles.btnPrimary} onClick={() => { setStatus("idle"); setFile(null); setPreview(null); }}>
          আবার চেষ্টা করুন
        </button>
      )}

      {message && (
        <p style={{ fontSize: 12, color: status === "error" ? "#dc2626" : "#6b7280", marginTop: 8 }}>
          {message}
        </p>
      )}
    </div>
  );
};

function statusLabel(s) {
  return { processing: "⏳ Processing", pending_review: "🔍 Review এ আছে", approved: "✅ Approved", rejected: "❌ Rejected", published: "🏆 Published" }[s] || s;
}

const styles = {
  card: { background: "#f9fafb", borderRadius: 10, padding: 12, marginTop: 10 },
  dropzone: {
    border: "2px dashed #d1d5db", borderRadius: 8, padding: "20px 12px",
    textAlign: "center", cursor: "pointer", background: "#fff",
  },
  btnPrimary: {
    width: "100%", marginTop: 10, padding: "10px 0", borderRadius: 8,
    background: "#7c3aed", color: "#fff", border: "none", fontWeight: 700,
    fontSize: 14, cursor: "pointer",
  },
  btnSecondary: {
    width: "100%", marginTop: 8, padding: "8px 0", borderRadius: 8,
    background: "#ede9fe", color: "#6d28d9", border: "none", fontWeight: 600,
    fontSize: 13, cursor: "pointer",
  },
  processing: { display: "flex", alignItems: "center", gap: 10, padding: "12px 0", color: "#6b7280", fontSize: 13 },
  spinner: {
    width: 18, height: 18, borderRadius: "50%",
    border: "2px solid #e5e7eb", borderTopColor: "#7c3aed",
    animation: "spin 0.8s linear infinite",
  },
  statusBadge: (s) => ({
    display: "inline-block", padding: "4px 10px", borderRadius: 20,
    fontSize: 12, fontWeight: 700,
    background: { processing:"#fef3c7", pending_review:"#dbeafe", approved:"#d1fae5", rejected:"#fee2e2", published:"#ede9fe" }[s] || "#f3f4f6",
    color: { processing:"#92400e", pending_review:"#1e40af", approved:"#065f46", rejected:"#991b1b", published:"#5b21b6" }[s] || "#374151",
  }),
  label: { fontSize: 11, fontWeight: 700, color: "#6b7280", marginBottom: 6, textTransform: "uppercase" },
  playerRow: { display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid #f3f4f6" },
  rank:  { width: 28, fontSize: 12, fontWeight: 700, color: "#7c3aed" },
  name:  { flex: 1, fontSize: 13, fontWeight: 600 },
  kills: { fontSize: 12, color: "#6b7280" },
  prize: { fontSize: 12, fontWeight: 700, color: "#059669" },
};

export default ScreenshotUpload;

// ─── Match Card এ কীভাবে use করবেন ──────────────────────────────────────
// import ScreenshotUpload from "./ScreenshotUpload";
//
// <ScreenshotUpload
//   matchId={match._id}
//   matchTitle={match.title}
//   matchStatus={match.status}
// />