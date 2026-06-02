 import React, { useState, useEffect, useCallback } from "react";

const API_LUDO = (import.meta.env.VITE_API_URL || "https://playzo-vn8e.onrender.com").replace("/api", "");

// Countdown Timer
const LudoTimeLeft = ({ startTime }) => {
  const [time, setTime] = useState("");
  useEffect(() => {
    const calc = () => {
      const diff = new Date(startTime).getTime() - Date.now();
      if (diff <= 0) {
        setTime("শুরু হয়েছে");
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTime(h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`);
    };
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [startTime]);
  return <span>{time}</span>;
};

// Ludo Card with In-Game Name Modal
const LudoCard = ({ match, userId, onJoin, joining }) => {
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [gameName, setGameName] = useState("");
  const [joiningThis, setJoiningThis] = useState(false);

  const joined = Number(match.joinedPlayers || 0);
  const total = Number(match.totalSlots || match.totalPlayers || 4);
  const isFull = joined >= total;

  const isMine = (match.joinedUsers || []).some((u) =>
    u.userId?.toString?.() === userId?.toString?.() || u.userId === userId
  );

  const mySlot = isMine
    ? (match.joinedUsers || []).find((u) => 
        u.userId?.toString?.() === userId?.toString?.() || u.userId === userId
      )?.slotNumber
    : null;

  const canJoin = !isMine && !isFull && !["completed", "cancelled"].includes(match.status);

  const fmt = (n) => "৳" + Number(n || 0).toLocaleString();

  const handleJoinClick = () => {
    setGameName("");
    setShowJoinModal(true);
  };

  const confirmJoin = () => {
    if (!gameName || gameName.trim().length < 3) {
      alert("সঠিক In-Game Name দিন (কমপক্ষে ৩ অক্ষর)");
      return;
    }
    setJoiningThis(true);
    onJoin(match._id, match.entryFee, match.title, gameName.trim());
    setShowJoinModal(false);
    setTimeout(() => setJoiningThis(false), 1500);
  };

  return (
    <div style={{
      background: "#fff",
      borderRadius: 18,
      overflow: "hidden",
      boxShadow: "0 3px 14px rgba(0,0,0,0.07)",
      marginBottom: 14,
      border: isMine ? "2px solid #10b981" : "1px solid #f3f4f6"
    }}>
      <div style={{ height: 4, background: "linear-gradient(90deg,#f59e0b,#ef4444,#8b5cf6,#10b981)" }} />

      {match.image && (
        <img src={match.image} alt="" style={{ width: "100%", height: 110, objectFit: "cover" }} onError={(e) => e.target.style.display = "none"} />
      )}

      <div style={{ padding: "12px 14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#111827", marginBottom: 4 }}>🎲 {match.title}</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <span style={{ background: "#ede9fe", color: "#5b21b6", fontSize: 10, padding: "3px 8px", borderRadius: 20, fontWeight: 800 }}>
                {match.mode === "1v1" ? "⚔️ 1v1" : match.mode === "2v2" ? "👥 2v2" : "🎮 4 Player"}
              </span>
              <span style={{ background: "#dbeafe", color: "#1e40af", fontSize: 10, padding: "3px 8px", borderRadius: 20, fontWeight: 700 }}>
                {match.status?.toUpperCase() || "UPCOMING"}
              </span>
              {isMine && <span style={{ background: "#d1fae5", color: "#065f46", fontSize: 10, padding: "3px 8px", borderRadius: 20, fontWeight: 700 }}>✅ Joined #{mySlot}</span>}
            </div>
          </div>
          <div style={{ background: "linear-gradient(135deg,#fef3c7,#fde68a)", borderRadius: 12, padding: "6px 12px", textAlign: "center", border: "1px solid #fcd34d" }}>
            <div style={{ fontSize: 9, color: "#92400e", fontWeight: 700 }}>WIN</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: "#b45309" }}>{fmt(match.winPrize)}</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", background: "#f9fafb", borderRadius: 10, padding: "10px 0", marginBottom: 10 }}>
          {[
            { label: "Entry", value: fmt(match.entryFee) },
            { label: "Players", value: `${joined}/${total}` },
            { label: "Map", value: match.map || "Classic" }
          ].map((s, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 9, color: "#9ca3af" }}>{s.label}</div>
              <div style={{ fontSize: 13, fontWeight: 800 }}>{s.value}</div>
            </div>
          ))}
        </div>

        {canJoin && (
          <button
            onClick={handleJoinClick}
            disabled={joining === match._id}
            style={{
              width: "100%",
              background: joining === match._id ? "#9ca3af" : "linear-gradient(135deg,#f59e0b,#d97706)",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              padding: "12px 0",
              fontSize: 14,
              fontWeight: 800,
              marginTop: 8
            }}
          >
            {joining === match._id ? "⏳ Joining..." : `Join — ${fmt(match.entryFee)}`}
          </button>
        )}

        {/* Join Modal */}
        {showJoinModal && (
          <div style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.65)", display: "flex",
            alignItems: "center", justifyContent: "center", zIndex: 9999
          }}>
            <div style={{ background: "#fff", padding: 24, borderRadius: 16, width: "90%", maxWidth: 400 }}>
              <h3 style={{ marginBottom: 8 }}>Join {match.title}</h3>
              <p style={{ color: "#6b7280", marginBottom: 16 }}>আপনার In-Game Name দিন</p>
              
              <input
                type="text"
                placeholder="যেমন: SapnilFF, RahulOP"
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
                style={{ 
                  width: "100%", 
                  padding: 14, 
                  borderRadius: 10, 
                  border: "1.5px solid #e5e7eb", 
                  fontSize: 16,
                  marginBottom: 20 
                }}
              />

              <div style={{ display: "flex", gap: 12 }}>
                <button 
                  onClick={() => setShowJoinModal(false)}
                  style={{ flex: 1, padding: 14, background: "#e5e7eb", border: "none", borderRadius: 10, fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmJoin}
                  style={{ flex: 1, padding: 14, background: "#10b981", color: "white", border: "none", borderRadius: 10, fontWeight: 700 }}
                >
                  Join Now
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Main Component
const LudoTournamentSection = () => {
  const [activeMode, setActiveMode] = useState("all");
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(null);
  const [toast, setToast] = useState({ text: "", type: "" });

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();

  const userId = user?.id || user?._id;
  const token = localStorage.getItem("token");

  const showToast = (text, type = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast({ text: "", type: "" }), 3500);
  };

  const loadMatches = useCallback(async () => {
    setLoading(true);
    try {
      const q = activeMode !== "all" ? `?mode=${activeMode}` : "";
      const res = await fetch(`${API_LUDO}/api/ludo-tournament${q}`);
      const d = await res.json();
      setMatches(Array.isArray(d?.data) ? d.data : []);
    } catch (err) {
      console.error(err);
      setMatches([]);
    }
    setLoading(false);
  }, [activeMode]);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  // Join Handler with In-Game Name
  const handleJoin = async (matchId, entryFee, matchTitle, inGameName) => {
    if (!userId) {
      showToast("আগে Login করুন", "error");
      return;
    }

    setJoining(matchId);
    try {
      const res = await fetch(`${API_LUDO}/api/ludo-tournament/join/${matchId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, inGameName }),
      });

      const d = await res.json();

      if (d.success) {
        showToast(`✅ Join সফল! Slot #${d.slotNumber}`, "success");
        loadMatches();
      } else {
        showToast(d.message || "Join হয়নি", "error");
      }
    } catch (err) {
      showToast("নেটওয়ার্ক সমস্যা", "error");
    }
    setJoining(null);
  };

  const filtered = activeMode === "all" ? matches : matches.filter(m => m.mode === activeMode);

  return (
    <div style={{ background: "#f3f4f6", minHeight: "100%", paddingBottom: 20 }}>
      <div style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", padding: "18px 16px 14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ color: "#c4b5fd", fontSize: 11, fontWeight: 600 }}>TOURNAMENT</div>
            <div style={{ color: "#fff", fontSize: 20, fontWeight: 900 }}>🎲 Ludo Arena</div>
          </div>
          <button onClick={loadMatches} disabled={loading} style={{ background: "rgba(255,255,255,0.2)", color: "#fff", border: "none", borderRadius: 20, padding: "6px 14px" }}>
            {loading ? "⏳" : "🔄"}
          </button>
        </div>
      </div>

      {toast.text && (
        <div style={{
          margin: "12px",
          padding: "12px",
          borderRadius: 12,
          background: toast.type === "error" ? "#fee2e2" : "#d1fae5",
          color: toast.type === "error" ? "#991b1b" : "#065f46"
        }}>
          {toast.text}
        </div>
      )}

      <div style={{ padding: "12px" }}>
        {filtered.map((m) => (
          <LudoCard
            key={m._id}
            match={m}
            userId={userId}
            onJoin={handleJoin}
            joining={joining}
          />
        ))}

        {filtered.length === 0 && !loading && (
          <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>
            কোনো ম্যাচ পাওয়া যায়নি
          </div>
        )}
      </div>
    </div>
  );
};

export default LudoTournamentSection;