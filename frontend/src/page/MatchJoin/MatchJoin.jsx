 import React, { useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const MatchJoin = ({ match, onBack, onJoinSuccess }) => {
  const [formData, setFormData] = useState({ userName: "", gameId: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  if (!match) return null;

  const handleJoin = async () => {
    if (!formData.userName || !formData.gameId) {
      return setError("Game Name ও UID দিন");
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API}/api/matches/join/${match._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: user._id || user.id }),
      });

      const data = await res.json();

      if (data.success) {
        const updatedUser = { ...user, balance: data.newBalance };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        onJoinSuccess(data.newBalance);
      } else {
        setError(data.message || "সমস্যা হয়েছে");
      }
    } catch (err) {
      setError("Server error, আবার চেষ্টা করুন");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: "#f8faff",
      minHeight: "100vh",
      maxWidth: 450,
      margin: "0 auto",
      fontFamily: "sans-serif",
    }}>

      {/* ── HEADER ── */}
      <div style={{
        background: "linear-gradient(to right, #1e40af, #3b82f6)",
        padding: "16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}>
        <button
          onClick={onBack}
          style={{
            background: "rgba(255,255,255,0.2)", border: "none",
            borderRadius: 8, color: "#fff", padding: "6px 12px",
            fontSize: 18, cursor: "pointer",
          }}>
          ❮
        </button>
        <div>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>{match.title}</div>
          <div style={{ color: "#bfdbfe", fontSize: 12 }}>Entry Fee: ৳{match.entryFee}</div>
        </div>
      </div>

      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>

        {/* ── MATCH SUMMARY ── */}
        <div style={{
          background: "#fff", borderRadius: 12,
          padding: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        }}>
          <div style={{ fontWeight: 700, marginBottom: 12, color: "#1e40af" }}>📋 Match Summary</div>
          {[
            { label: "Category",  value: match.category?.toUpperCase() },
            { label: "Entry Fee", value: `৳${match.entryFee}` },
            { label: "Win Prize", value: `৳${match.winPrize}` },
            { label: "Per Kill",  value: `৳${match.perKill || 0}` },
            { label: "Map",       value: match.map || "Bermuda" },
          ].map((item, i) => (
            <div key={i} style={{
              display: "flex", justifyContent: "space-between",
              padding: "8px 0",
              borderBottom: i < 4 ? "1px solid #f1f5f9" : "none",
              fontSize: 14,
            }}>
              <span style={{ color: "#64748b" }}>{item.label}</span>
              <span style={{ fontWeight: 600, color: "#111" }}>{item.value}</span>
            </div>
          ))}
        </div>

        {/* ── PRIZE DETAILS ── */}
        <div style={{
          background: "#fefce8", borderRadius: 12,
          padding: 16, border: "1px solid #fde68a",
        }}>
          <div style={{ fontWeight: 700, marginBottom: 12, color: "#92400e" }}>🏆 Prize Details</div>
          {[
            { label: "🥇 1st Prize", value: match.prizes?.first  || match.winPrize || 0 },
            { label: "🥈 2nd Prize", value: match.prizes?.second || 0 },
            { label: "🥉 3rd Prize", value: match.prizes?.third  || 0 },
            { label: "4️⃣ 4th Prize", value: match.prizes?.fourth || 0 },
            { label: "🔫 Per Kill",  value: match.perKill || 0 },
          ].map((p, i) => (
            <div key={i} style={{
              display: "flex", justifyContent: "space-between",
              padding: "6px 0",
              borderBottom: i < 4 ? "1px solid #fde68a" : "none",
              fontSize: 13,
            }}>
              <span style={{ color: "#92400e" }}>{p.label}</span>
              <span style={{ fontWeight: 700, color: "#92400e" }}>৳{p.value}</span>
            </div>
          ))}
        </div>

        {/* ── PLAYER INFO FORM ── */}
        <div style={{
          background: "#fff", borderRadius: 12,
          padding: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        }}>
          <div style={{ fontWeight: 700, marginBottom: 12, color: "#111" }}>🎮 Player Info</div>

          <input
            placeholder="Game Name"
            value={formData.userName}
            onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
            style={{
              width: "100%", padding: "12px 14px", borderRadius: 10,
              border: "1.5px solid #e2e8f0", fontSize: 14,
              marginBottom: 10, outline: "none", boxSizing: "border-box",
            }}
          />
          <input
            placeholder="UID / Game ID"
            value={formData.gameId}
            onChange={(e) => setFormData({ ...formData, gameId: e.target.value })}
            style={{
              width: "100%", padding: "12px 14px", borderRadius: 10,
              border: "1.5px solid #e2e8f0", fontSize: 14,
              outline: "none", boxSizing: "border-box",
            }}
          />
        </div>

        {/* ── ERROR ── */}
        {error && (
          <div style={{
            background: "#fee2e2", borderRadius: 10,
            padding: "10px 14px", color: "#dc2626", fontSize: 13,
          }}>
            ❌ {error}
          </div>
        )}

        {/* ── CONFIRM BUTTON ── */}
        <button
          onClick={handleJoin}
          disabled={loading}
          style={{
            width: "100%", padding: "14px",
            background: loading ? "#86efac" : "#22c55e",
            border: "none", borderRadius: 12, color: "#fff",
            fontWeight: 700, fontSize: 16,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Processing..." : `✅ Confirm Join — ৳${match.entryFee} কাটবে`}
        </button>

      </div>
    </div>
  );
};

export default MatchJoin;