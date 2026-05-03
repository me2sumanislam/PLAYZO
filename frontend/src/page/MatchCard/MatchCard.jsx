 import React, { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const MatchCard = ({ match, onJoinSuccess }) => {
  const [timeLeft, setTimeLeft] = useState("");
  const [isStarted, setIsStarted] = useState(false);
  const [showRoomDetails, setShowRoomDetails] = useState(false);
  const [showPrizeDetails, setShowPrizeDetails] = useState(false);

  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [joinSuccess, setJoinSuccess] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const startTime = new Date(match.startTime).getTime();
      const distance = startTime - now;

      if (distance <= 0) {
        setTimeLeft("কাস্টম Ready Room Details থেকে নিন");
        setIsStarted(true);
        clearInterval(timer);
        return;
      }

      const hours = Math.floor(distance / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m:${String(seconds).padStart(2, "0")}s`);
      } else {
        setTimeLeft(`${minutes}m:${String(seconds).padStart(2, "0")}s`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [match.startTime]);

  const joined = Number(match.joinedPlayers || 0);
  const total = Number(match.totalPlayers || 0);
  const spotsLeft = total - joined;
  const isFull = joined >= total && total > 0;
  const fillPercent = total > 0 ? (joined / total) * 100 : 0;

  const formatTime = (t) => {
    if (!t) return "";
    const d = new Date(t);
    return d.toLocaleString("en-BD", {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hour12: true,
    }).replace(",", " at");
  };

  // ── সরাসরি Join — কোনো modal/form নেই ──
  const handleJoin = async () => {
    setJoinLoading(true);
    setJoinError("");
    setJoinSuccess(false);

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const token = localStorage.getItem("token");

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
        setJoinSuccess(true);
        if (onJoinSuccess) onJoinSuccess(data.newBalance);
        setTimeout(() => setJoinSuccess(false), 3000);
      } else {
        setJoinError(data.message || "সমস্যা হয়েছে");
        setTimeout(() => setJoinError(""), 3000);
      }
    } catch (err) {
      setJoinError("Server error, আবার চেষ্টা করুন");
      setTimeout(() => setJoinError(""), 3000);
    } finally {
      setJoinLoading(false);
    }
  };

  return (
    <div style={{
      background: "#fff",
      borderRadius: 16,
      boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
      overflow: "hidden",
      marginBottom: 16,
    }}>

      {/* ── TOP ── */}
      <div style={{ display: "flex", gap: 12, padding: "14px 14px 10px" }}>
        <img
          src={match.image || "/image/img-1.jpg"}
          alt=""
          style={{ width: 80, height: 60, borderRadius: 8, objectFit: "cover", flexShrink: 0 }}
        />
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#111", lineHeight: 1.3 }}>
            {match.title} | {match.device || "Mobile"} | Regular
          </div>
          <div style={{ fontSize: 12, color: "#e53935", marginTop: 4, fontWeight: 500 }}>
            {formatTime(match.startTime)}
          </div>
        </div>
      </div>

      {/* ── STATS GRID ── */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
        padding: "0 14px", rowGap: 14, marginBottom: 14,
      }}>
        {[
          { label: "WIN PRIZE", value: `${match.winPrize} TK` },
          { label: "ENTRY TYPE", value: match.category?.toUpperCase() },
          { label: "ENTRY FEE", value: `${match.entryFee} TK` },
          { label: "PER KILL", value: `${match.perKill || 0} TK` },
          { label: "MAP", value: match.map || "Bermuda" },
          { label: "VERSION", value: (match.device || "MOBILE").toUpperCase() },
        ].map((s, i) => (
          <div key={i} style={{ textAlign: i % 3 === 0 ? "left" : i % 3 === 1 ? "center" : "right" }}>
            <div style={{ fontSize: 10, color: "#888", fontWeight: 600, letterSpacing: 0.5 }}>{s.label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#111", marginTop: 2 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── PROGRESS BAR + JOIN BUTTON ── */}
      <div style={{ padding: "0 14px 10px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ height: 10, background: "#e5e7eb", borderRadius: 20, overflow: "hidden" }}>
            <div style={{
              height: "100%", width: `${fillPercent}%`,
              background: "#22c55e", borderRadius: 20, transition: "width 0.5s",
            }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
            <span style={{ fontSize: 11, color: "#6b7280" }}>Only {spotsLeft} spots are left</span>
            <span style={{ fontSize: 11, color: "#6b7280" }}>{joined}/{total}</span>
          </div>
        </div>

        {isFull ? (
          <div style={{
            padding: "8px 16px", border: "1.5px solid #1e40af",
            borderRadius: 8, color: "#1e40af", fontWeight: 700,
            fontSize: 13, whiteSpace: "nowrap",
          }}>
            Match Full
          </div>
        ) : (
          <button
            onClick={handleJoin}
            disabled={joinLoading || joinSuccess}
            style={{
              padding: "8px 20px",
              background: joinSuccess ? "#16a34a" : joinLoading ? "#86efac" : "#22c55e",
              border: "none", borderRadius: 8, color: "#fff",
              fontWeight: 700, fontSize: 13,
              cursor: (joinLoading || joinSuccess) ? "not-allowed" : "pointer",
              whiteSpace: "nowrap", minWidth: 70,
              transition: "background 0.2s",
            }}>
            {joinSuccess ? "✅ Joined" : joinLoading ? "..." : "Join"}
          </button>
        )}
      </div>

      {/* ── ERROR / SUCCESS MESSAGE ── */}
      {joinError && (
        <div style={{
          margin: "0 14px 10px",
          background: "#fee2e2", borderRadius: 8,
          padding: "8px 12px", color: "#dc2626", fontSize: 13,
        }}>
          ❌ {joinError}
        </div>
      )}
      {joinSuccess && (
        <div style={{
          margin: "0 14px 10px",
          background: "#dcfce7", borderRadius: 8,
          padding: "8px 12px", color: "#16a34a", fontSize: 13, fontWeight: 600,
        }}>
          ✅ Joined! ৳{match.entryFee} balance কাটা হয়েছে
        </div>
      )}

      {/* ── ROOM DETAILS + PRIZE DETAILS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: "0 14px 12px" }}>

        {/* Room Details */}
        <div>
          <button
            onClick={() => setShowRoomDetails(!showRoomDetails)}
            style={{
              width: "100%", padding: "9px 0", border: "1.5px solid #1e40af",
              borderRadius: 8, background: "#fff", color: "#1e40af",
              fontWeight: 600, fontSize: 12, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}>
            🔑 Room Details {showRoomDetails ? "▲" : "▼"}
          </button>
          {showRoomDetails && (
            <div style={{
              marginTop: 6, background: "#f0f9ff", borderRadius: 8,
              padding: "10px 12px", border: "1px solid #bae6fd",
            }}>
              {match.isRoomOpen ? (
                <>
                  <div style={{ fontSize: 13, color: "#0369a1", marginBottom: 6 }}>
                    <b>Room ID:</b> {match.roomId || "—"}
                  </div>
                  <div style={{ fontSize: 13, color: "#0369a1" }}>
                    <b>Password:</b> {match.roomPassword || "—"}
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 12, color: "#64748b", textAlign: "center" }}>
                  ⏳ Room details not available yet
                </div>
              )}
            </div>
          )}
        </div>

        {/* Prize Details */}
        <div>
          <button
            onClick={() => setShowPrizeDetails(!showPrizeDetails)}
            style={{
              width: "100%", padding: "9px 0", border: "1.5px solid #1e40af",
              borderRadius: 8, background: "#fff", color: "#1e40af",
              fontWeight: 600, fontSize: 12, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}>
            🏆 Prize Details {showPrizeDetails ? "▲" : "▼"}
          </button>
          {showPrizeDetails && (
            <div style={{
              marginTop: 6, background: "#fefce8", borderRadius: 8,
              padding: "10px 12px", border: "1px solid #fde68a",
            }}>
              {[
                { label: "🥇 1st Prize", value: match.prizes?.first  || match.winPrize || 0 },
                { label: "🥈 2nd Prize", value: match.prizes?.second || 0 },
                { label: "🥉 3rd Prize", value: match.prizes?.third  || 0 },
                { label: "4️⃣ 4th Prize", value: match.prizes?.fourth || 0 },
                { label: "🔫 Per Kill",  value: match.perKill || 0 },
                { label: "🎟 Entry Fee", value: match.entryFee || 0 },
              ].map((p, i) => (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between",
                  fontSize: 12, color: "#92400e",
                  paddingBottom: 5, marginBottom: 5,
                  borderBottom: i < 5 ? "1px solid #fde68a" : "none",
                }}>
                  <span>{p.label}</span>
                  <span><b>৳{p.value}</b></span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ── FOOTER ── */}
      <div style={{
        background: "#16a34a", padding: "12px",
        textAlign: "center", color: "#fff", fontWeight: 700, fontSize: 14,
      }}>
        {isStarted ? (
          <span>কাস্টম Ready 🔑 Room Details থেকে নিন</span>
        ) : (
          <span>⏰ STARTS IN - <span style={{ fontSize: 16 }}>{timeLeft}</span></span>
        )}
      </div>

    </div>
  );
};

export default MatchCard;
