 import React, { useState, useRef, useEffect } from "react";

const API = "https://playzo-vn8e.onrender.com";

const ScreenshotUpload = ({ matchId, matchTitle, matchStatus }) => {
  const [file, setFile]       = useState(null);
  const [preview, setPreview] = useState(null);
  const [status, setStatus]   = useState("idle"); // idle, uploading, processing, error, done
  const [message, setMessage] = useState("");
  const [result, setResult]   = useState(null);
  const fileRef               = useRef();

  const token = localStorage.getItem("token");

  // Auto check result when component loads
  useEffect(() => {
    if (matchId) checkResult();
  }, [matchId]);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    if (!selected.type.startsWith("image/")) {
      setMessage("শুধুমাত্র ছবি (Image) ফাইল দিন");
      return;
    }
    if (selected.size > 3 * 1024 * 1024) {
      setMessage("৩MB এর বেশি ফাইল দিতে পারবেন না। ছোট করে আবার চেষ্টা করুন।");
      return;
    }

    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setMessage("");
    setStatus("idle");
  };

  const handleUpload = async () => {
    if (!file || !token) return;

    setStatus("uploading");
    setMessage("Upload হচ্ছে... (৩০-৬০ সেকেন্ড লাগতে পারে)");

    const formData = new FormData();
    formData.append("screenshot", file);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    try {
      const res = await fetch(`${API}/api/result/upload/${matchId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error("Invalid response from server");
      }

      if (data.success) {
        setStatus("processing");
        setMessage("✅ Screenshot জমা হয়েছে। Admin review করবেন।");
        setTimeout(checkResult, 8000);
      } else {
        setStatus("error");
        setMessage(data.message || "Upload ব্যর্থ হয়েছে। আবার চেষ্টা করুন।");
      }
    } catch (err) {
      clearTimeout(timeout);
      setStatus("error");

      if (err.name === "AbortError") {
        setMessage("Timeout হয়েছে। সার্ভার ব্যস্ত আছে — একটু পরে আবার চেষ্টা করুন।");
      } else if (!navigator.onLine) {
        setMessage("ইন্টারনেট সংযোগ নেই। কানেকশন চেক করুন।");
      } else {
        setMessage("Network Error। আবার চেষ্টা করুন।");
      }
    }
  };

  const checkResult = async () => {
    try {
      const res = await fetch(`${API}/api/result/my/${matchId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success && data.data) {
        setResult(data.data);
        setStatus("done");
      }
    } catch (err) {
      console.error("Result check failed", err);
    }
  };

  // Status Label
  const getStatusLabel = (s) => {
    const labels = {
      processing: "⏳ Processing",
      pending_review: "🔍 Review এ আছে",
      approved: "✅ Approved",
      rejected: "❌ Rejected",
      published: "🏆 Result Published",
    };
    return labels[s] || s;
  };

  // ==================== UI ====================
  if (result) {
    return (
      <div style={{ background: "#f9fafb", borderRadius: 12, padding: 14, marginTop: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>📸 Result Status</div>
        <div style={{
          padding: "6px 12px",
          borderRadius: 20,
          display: "inline-block",
          fontSize: 13,
          fontWeight: 700,
          background: result.status === "published" ? "#d1fae5" : "#fef3c7",
          color: result.status === "published" ? "#065f46" : "#92400e"
        }}>
          {getStatusLabel(result.status)}
        </div>

        {result.status === "published" && result.finalPlayers?.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>Leaderboard</div>
            {result.finalPlayers.map((p, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f3f4f6" }}>
                <span>{p.inGameName}</span>
                <span>{p.kills} kills • ৳{p.prizeAwarded}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ background: "#f9fafb", borderRadius: 12, padding: 14, marginTop: 12 }}>
      {preview && (
        <img src={preview} alt="preview" style={{ width: "100%", borderRadius: 8, maxHeight: 180, objectFit: "cover", marginBottom: 10 }} />
      )}

      {status === "idle" && (
        <>
          <div 
            style={{
              border: "2px dashed #d1d5db",
              borderRadius: 10,
              padding: "20px 10px",
              textAlign: "center",
              cursor: "pointer",
              background: "#fff"
            }}
            onClick={() => fileRef.current.click()}
          >
            <div style={{ fontSize: 32, marginBottom: 6 }}>📷</div>
            <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>
              {file ? file.name : "Result Screenshot Select করুন (Max 3MB)"}
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
            <button
              onClick={handleUpload}
              style={{
                width: "100%",
                marginTop: 12,
                padding: "12px",
                background: "#7c3aed",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                fontWeight: 700,
                fontSize: 15,
                cursor: "pointer"
              }}
            >
              Submit করুন
            </button>
          )}
        </>
      )}

      {(status === "uploading" || status === "processing") && (
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div style={{ display: "inline-block", animation: "spin 1s linear infinite", fontSize: 24, marginBottom: 8 }}>⭮</div>
          <p>{message}</p>
        </div>
      )}

      {status === "error" && (
        <button
          onClick={() => {
            setStatus("idle");
            setFile(null);
            setPreview(null);
            setMessage("");
            if (fileRef.current) fileRef.current.value = "";
          }}
          style={{
            width: "100%",
            padding: "12px",
            background: "#ef4444",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            fontWeight: 600
          }}
        >
          আবার চেষ্টা করুন
        </button>
      )}

      {message && <p style={{ marginTop: 10, fontSize: 13, color: status === "error" ? "#dc2626" : "#374151", textAlign: "center" }}>{message}</p>}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ScreenshotUpload;