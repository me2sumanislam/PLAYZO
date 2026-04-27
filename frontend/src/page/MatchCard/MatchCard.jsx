 import React, { useEffect, useState } from "react";

const MatchCard = ({ match, onClick }) => {
  const [timeLeft, setTimeLeft] = useState("");
  const [isStarted, setIsStarted] = useState(false);
  const [showRoomDetails, setShowRoomDetails] = useState(false);
  const [showPrizeDetails, setShowPrizeDetails] = useState(false);

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

  // startTime format: "2026-04-26 at 11:00 AM"
  const formatTime = (t) => {
    if (!t) return "";
    const d = new Date(t);
    return d.toLocaleString("en-BD", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).replace(",", " at");
  };

  return (
    <div style={{
      background: "#fff",
      borderRadius: 16,
      boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
      overflow: "hidden",
      marginBottom: 16,
      cursor: "pointer",
    }}>

      {/* ── TOP: image + title + time ── */}
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
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        padding: "0 14px",
        rowGap: 14,
        marginBottom: 14,
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
      <div style={{ padding: "0 14px 12px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ height: 10, background: "#e5e7eb", borderRadius: 20, overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${fillPercent}%`,
              background: "#22c55e",
              borderRadius: 20,
              transition: "width 0.5s",
            }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
            <span style={{ fontSize: 11, color: "#6b7280" }}>Only {spotsLeft} spots are left</span>
            <span style={{ fontSize: 11, color: "#6b7280" }}>{joined}/{total}</span>
          </div>
        </div>

        {/* JOIN / FULL BUTTON */}
        {isFull ? (
          <div style={{
            padding: "8px 16px", border: "1.5px solid #1e40af", borderRadius: 8,
            color: "#1e40af", fontWeight: 700, fontSize: 13, whiteSpace: "nowrap",
          }}>
            Match Full
          </div>
        ) : (
          <button
            onClick={onClick}
            style={{
              padding: "8px 20px", background: "#22c55e", border: "none",
              borderRadius: 8, color: "#fff", fontWeight: 700, fontSize: 13,
              cursor: "pointer", whiteSpace: "nowrap",
            }}>
            Join
          </button>
        )}
      </div>

      {/* ── ROOM DETAILS + PRIZE DETAILS BUTTONS ── */}
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
              {match.roomId || match.roomPassword ? (
                <>
                  <div style={{ fontSize: 12, color: "#0369a1", marginBottom: 4 }}>
                    <b>Room ID:</b> {match.roomId || "—"}
                  </div>
                  <div style={{ fontSize: 12, color: "#0369a1" }}>
                    <b>Password:</b> {match.roomPassword || "—"}
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 12, color: "#64748b", textAlign: "center" }}>
                  Room details not available yet
                </div>
              )}
            </div>
          )}
        </div>

        {/* Total Prize Details */}
        <div>
          <button
            onClick={() => setShowPrizeDetails(!showPrizeDetails)}
            style={{
              width: "100%", padding: "9px 0", border: "1.5px solid #1e40af",
              borderRadius: 8, background: "#fff", color: "#1e40af",
              fontWeight: 600, fontSize: 12, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}>
            🏆 Total Prize Details {showPrizeDetails ? "▲" : "▼"}
          </button>
          {showPrizeDetails && (
            <div style={{
              marginTop: 6, background: "#fefce8", borderRadius: 8,
              padding: "10px 12px", border: "1px solid #fde68a",
            }}>
              <div style={{ fontSize: 12, color: "#92400e", marginBottom: 4 }}>
                <b>🥇 1st:</b> ৳{match.winPrize || 0}
              </div>
              <div style={{ fontSize: 12, color: "#92400e", marginBottom: 4 }}>
                <b>🔫 Per Kill:</b> ৳{match.perKill || 0}
              </div>
              <div style={{ fontSize: 12, color: "#92400e" }}>
                <b>Entry Fee:</b> ৳{match.entryFee || 0}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* ── FOOTER: countdown or room ready ── */}
      <div style={{
        background: isStarted ? "#16a34a" : "#16a34a",
        padding: "12px",
        textAlign: "center",
        color: "#fff",
        fontWeight: 700,
        fontSize: 14,
      }}>
        {isStarted ? (
          <span>কাস্টম Ready Room Details থেকে নিন</span>
        ) : (
          <span>⏰ STARTS IN - <span style={{ fontSize: 16 }}>{timeLeft}</span></span>
        )}
      </div>

    </div>
  );
};

export default MatchCard;