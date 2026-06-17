 import React, { useState, useRef } from "react";

const API = "https://playzo-vn8e.onrender.com";
const UPLOAD_TIMEOUT_MS = 60000; // 60 সেকেন্ড timeout

const ScreenshotUpload = ({ matchId, matchTitle, matchStatus }) => {
  const [file, setFile]       = useState(null);
  const [preview, setPreview] = useState(null);
  const [status, setStatus]   = useState("idle");
  const [message, setMessage] = useState("");
  const [result, setResult]   = useState(null);
  const fileRef               = useRef();

  const token = localStorage.getItem("token");

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    if (!selected.type.startsWith("image/")) {
      setMessage("শুধু image file select করুন");
      return;
    }
    // ✅ 8MB → 3MB করা হয়েছে — Render free tier এ large file crash করে
    if (selected.size > 3 * 1024 * 1024) {
      setMessage("File size 3MB এর বেশি না। ছোট করে আবার দিন।");
      return;
    }
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setMessage("");
    setStatus("idle");
  };

  const handleUpload = async () => {
    if (!file) return;
    setStatus("uploading");
    setMessage("Upload হচ্ছে... (প্রথমবার 30-60 সেকেন্ড লাগতে পারে)");

    const formData = new FormData();
    formData.append("screenshot", file);

    // ✅ AbortController দিয়ে 60 সেকেন্ড timeout
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);

    try {
      const res = await fetch(`${API}/api/result/upload/${matchId}`, {
        method:  "POST",
        headers: { Authorization: `Bearer ${token}` },
        body:    formData,
        signal:  controller.signal, // ✅ timeout signal
      });

      clearTimeout(timer);

      // ✅ JSON parse error আলাদা handle
      let data;
      try {
        data = await res.json();
      } catch {
        setStatus("error");
        setMessage(`Server error (${res.status}). আবার চেষ্টা করুন।`);
        return;
      }

      if (data.success) {
        setStatus("processing");
        setMessage("Screenshot জমা হয়েছে ✅ Admin review করবেন।");
        setTimeout(() => checkResult(), 12000);
      } else {
        setStatus("error");
        setMessage(data.message || "Upload failed. আবার চেষ্টা করুন।");
      }

    } catch (err) {
      clearTimeout(timer);

      // ✅ আসল error অনুযায়ী message দেখাও
      if (err.name === "AbortError") {
        setStatus("error");
        setMessage("Timeout হয়েছে (60 সেকেন্ড)। Server busy — একটু পরে আবার চেষ্টা করুন।");
      } else if (!navigator.onLine) {
        setStatus("error");
        setMessage("Internet connection নেই। Connection check করুন।");
      } else {
        setStatus("error");
        setMessage(`Network error: ${err.message || "Unknown"}। আবার চেষ্টা করুন।`);
      }
    }
  };

  const checkResult = async () => {
    try {
      const res  = await fetch(`${API}/api/result/my/${matchId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setResult(data.data);
        setStatus("done");
        setMessage("");
      } else {
        setStatus("done");
        setMessage("Screenshot জমা আছে। Admin result দিলে দেখাবে।");
      }
    } catch {
      setMessage("Result check করতে পারছি না। পরে দেখুন।");
    }
  };

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
      {preview && (
        <div style={{ marginBottom: 10 }}>
          <img
            src={preview}
            alt="screenshot preview"
            style={{ width: "100%", borderRadius: 8, maxHeight: 200, objectFit: "cover" }}
          />
        </div>
      )}

      {status === "idle" && (
        <>
          <div style={styles.dropzone} onClick={() => fileRef.current.click()}>
            <span style={{ fontSize: 28 }}>📸</span>
            <p style={{ margin: "6px 0 0", fontSize: 13, color: "#6b7280" }}>
              {file ? file.name : "Result screenshot select করুন (max 3MB)"}
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
          <span>Upload হচ্ছে... অপেক্ষা করুন</span>
        </div>
      )}

      {status === "processing" && (
        <div style={styles.processing}>
          <div style={styles.spinner} />
          <span>Screenshot জমা হয়েছে, Admin review করবেন</span>
        </div>
      )}

      {/* ✅ Error এ retry button + আবার file বাছাই করার সুযোগ */}
      {status === "error" && (
        <div>
          <button
            style={styles.btnPrimary}
            onClick={() => {
              setStatus("idle");
              setFile(null);
              setPreview(null);
              setMessage("");
              if (fileRef.current) fileRef.current.value = "";
            }}
          >
            আবার চেষ্টা করুন
          </button>
        </div>
      )}

      {message && (
        <p style={{
          fontSize: 12,
          color: status === "error" ? "#dc2626" : "#6b7280",
          marginTop: 8,
          lineHeight: 1.5,
        }}>
          {message}
        </p>
      )}
    </div>
  );
};

function statusLabel(s) {
  return {
    processing:     "⏳ Processing",
    pending_review: "🔍 Review এ আছে",
    approved:       "✅ Approved",
    rejected:       "❌ Rejected",
    published:      "🏆 Published",
  }[s] || s;
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
  processing: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "12px 0", color: "#6b7280", fontSize: 13,
  },
  spinner: {
    width: 18, height: 18, borderRadius: "50%",
    border: "2px solid #e5e7eb", borderTopColor: "#7c3aed",
    animation: "spin 0.8s linear infinite",
  },
  statusBadge: (s) => ({
    display: "inline-block", padding: "4px 10px", borderRadius: 20,
    fontSize: 12, fontWeight: 700,
    background: { processing:"#fef3c7", pending_review:"#dbeafe", approved:"#d1fae5", rejected:"#fee2e2", published:"#ede9fe" }[s] || "#f3f4f6",
    color:      { processing:"#92400e", pending_review:"#1e40af", approved:"#065f46", rejected:"#991b1b", published:"#5b21b6" }[s] || "#374151",
  }),
  label:     { fontSize: 11, fontWeight: 700, color: "#6b7280", marginBottom: 6, textTransform: "uppercase" },
  playerRow: { display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid #f3f4f6" },
  rank:      { width: 28, fontSize: 12, fontWeight: 700, color: "#7c3aed" },
  name:      { flex: 1, fontSize: 13, fontWeight: 600 },
  kills:     { fontSize: 12, color: "#6b7280" },
  prize:     { fontSize: 12, fontWeight: 700, color: "#059669" },
};

export default ScreenshotUpload;