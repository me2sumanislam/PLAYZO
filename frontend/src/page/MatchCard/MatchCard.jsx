 import React, { useState, useEffect } from "react";

const API = import.meta.env.VITE_API_URL?.replace("/api", "") || "https://playzo-vn8e.onrender.com";

const MatchCard = ({ match, onJoinSuccess, totalMatches }) => {
  const [timeLeft, setTimeLeft]             = useState("");
  const [isStarted, setIsStarted]           = useState(false);
  const [showPrizeModal, setShowPrizeModal] = useState(false);
  const [showRoomModal, setShowRoomModal]   = useState(false);
  const [showJoinModal, setShowJoinModal]   = useState(false);
  const [inGameName, setInGameName]         = useState("");

  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError]     = useState("");
  const [joinSuccess, setJoinSuccess] = useState(false);
  const [mySlot, setMySlot]           = useState(null);

  // ── countdown ──
  useEffect(() => {
    const timer = setInterval(() => {
      const now      = new Date().getTime();
      const start    = new Date(match.startTime).getTime();
      const distance = start - now;
      if (distance <= 0) {
        setTimeLeft("কাস্টম Ready");
        setIsStarted(true);
        clearInterval(timer);
        return;
      }
      const h = Math.floor(distance / (1000 * 60 * 60));
      const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((distance % (1000 * 60)) / 1000);
      setTimeLeft(
        h > 0
          ? `${h}h ${m}m:${String(s).padStart(2, "0")}s`
          : `${m}m:${String(s).padStart(2, "0")}s`
      );
    }, 1000);
    return () => clearInterval(timer);
  }, [match.startTime]);

  // ── user এর আগের slot check ──
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const uid  = user._id || user.id;
    if (uid && match.joinedUsers) {
      const found = match.joinedUsers.find(
        (u) => (u.userId?._id || u.userId)?.toString() === uid.toString()
      );
      if (found) setMySlot(found.slotNumber);
    }
  }, [match.joinedUsers]);

  const joined      = Number(match.joinedPlayers || 0);
  const total       = Number(match.totalPlayers || 0);
  const spotsLeft   = total - joined;
  const isFull      = joined >= total && total > 0;
  const fillPercent = total > 0 ? (joined / total) * 100 : 0;

  const formatTime = (t) => {
    if (!t) return "";
    return new Date(t)
      .toLocaleString("en-BD", {
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", hour12: true,
      })
      .replace(",", " at");
  };

  // ── entry type display ──
  const getEntryType = () => {
    const cat = (match.category || "").toLowerCase();
    if (cat.includes("solo")) return "Solo";
    if (cat.includes("duo"))  return "Duo";
    if (cat.includes("squad") || cat.includes("4")) return "Squad";
    return match.category || "Solo";
  };

  // ── JOIN ──
  const handleJoin = async () => {
    if (!inGameName.trim()) return;
    setJoinLoading(true);
    setJoinError("");
    setShowJoinModal(false);

    const user  = JSON.parse(localStorage.getItem("user") || "{}");
    const token = localStorage.getItem("token");

    try {
      const res  = await fetch(`${API}/api/matches/join/${match._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user._id || user.id,
          inGameName: inGameName.trim(),
        }),
      });
      const data = await res.json();

      if (data.success) {
        const updatedUser = { ...user, balance: data.newBalance };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setMySlot(data.slotNumber);
        setJoinSuccess(true);
        setInGameName("");
        if (onJoinSuccess) onJoinSuccess(data.newBalance);
        setTimeout(() => setJoinSuccess(false), 3000);
      } else {
        setJoinError(data.message || "সমস্যা হয়েছে");
        setTimeout(() => setJoinError(""), 3000);
      }
    } catch {
      setJoinError("Server error, আবার চেষ্টা করুন");
      setTimeout(() => setJoinError(""), 3000);
    } finally {
      setJoinLoading(false);
    }
  };

  // ────────────────────────────────────────
  return (
    <>
      {/* ══════════════════════════════
          CARD — CARD2 DESIGN
      ══════════════════════════════ */}
      <div style={{
        background: "#fff",
        borderRadius: 16,
        boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
        overflow: "hidden",
        marginBottom: 16,
        position: "relative",
      }}>

        {/* GREEN PULSE BADGE */}
        {totalMatches > 0 && (
          <div style={{
            position: "absolute",
            top: -8, right: -8,
            background: "#22c55e",
            color: "white",
            fontSize: "14px",
            fontWeight: "700",
            minWidth: "28px",
            height: "28px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 0 3px rgba(34,197,94,0.3)",
            zIndex: 10,
            animation: "pulse 2s infinite",
          }}>
            {totalMatches}
          </div>
        )}

        {/* ── TOP: IMAGE + TITLE + DATE ── */}
        <div style={{ display: "flex", gap: 12, padding: "14px 14px 10px" }}>
          <img
            src={match.image || "/image/img-1.jpg"}
            alt=""
            style={{ width: 80, height: 60, borderRadius: 8, objectFit: "cover", flexShrink: 0 }}
          />
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#111", lineHeight: 1.3 }}>
              {match.title}
            </div>
            <div style={{ fontSize: 12, color: "#e53935", marginTop: 4, fontWeight: 500 }}>
              {formatTime(match.startTime)}
            </div>
          </div>
        </div>

        {/* ── STATS GRID: 3 col × 2 row ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          padding: "0 14px",
          rowGap: 14,
          marginBottom: 14,
        }}>
          {[
            { label: "WIN PRIZE",  value: `${match.winPrize || 0} TK` },
            { label: "ENTRY TYPE", value: getEntryType() },
            { label: "ENTRY FEE",  value: `${match.entryFee || 0} TK` },
            { label: "PER KILL",   value: `${match.perKill || 0} TK` },
            { label: "MAP",        value: match.map || "Bermuda" },
            { label: "VERSION",    value: (match.device || "MOBILE").toUpperCase() },
          ].map((s, i) => (
            <div
              key={i}
              style={{
                textAlign: i % 3 === 0 ? "left" : i % 3 === 1 ? "center" : "right",
              }}
            >
              <div style={{ fontSize: 10, color: "#888", fontWeight: 600, letterSpacing: 0.5 }}>
                {s.label}
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#111", marginTop: 2 }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {/* ── PROGRESS BAR + JOIN/FULL BUTTON ── */}
        <div style={{ padding: "0 14px 10px", display: "flex", alignItems: "center", gap: 12 }}>
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

          {/* JOIN / FULL / SLOT BUTTON */}
          {mySlot ? (
            <div style={{
              padding: "7px 14px",
              background: "#f0fdf4",
              border: "1.5px solid #22c55e",
              borderRadius: 8,
              color: "#16a34a",
              fontWeight: 700,
              fontSize: 12,
              whiteSpace: "nowrap",
            }}>
              ✅ Slot #{mySlot}
            </div>
          ) : isFull ? (
            <div style={{
              padding: "8px 16px",
              border: "1.5px solid #1e40af",
              borderRadius: 8,
              color: "#1e40af",
              fontWeight: 700,
              fontSize: 13,
              whiteSpace: "nowrap",
            }}>
              Match Full
            </div>
          ) : (
            <button
              onClick={() => setShowJoinModal(true)}
              disabled={joinLoading}
              style={{
                padding: "8px 20px",
                background: joinLoading ? "#86efac" : "#22c55e",
                border: "none",
                borderRadius: 8,
                color: "#fff",
                fontWeight: 700,
                fontSize: 13,
                cursor: joinLoading ? "not-allowed" : "pointer",
                minWidth: 70,
                transition: "background 0.2s",
              }}>
              {joinLoading ? "..." : "Join"}
            </button>
          )}
        </div>

        {/* ERROR / SUCCESS */}
        {joinError && (
          <div style={{ margin: "0 14px 10px", background: "#fee2e2", borderRadius: 8, padding: "8px 12px", color: "#dc2626", fontSize: 13 }}>
            ❌ {joinError}
          </div>
        )}
        {joinSuccess && (
          <div style={{ margin: "0 14px 10px", background: "#dcfce7", borderRadius: 8, padding: "8px 12px", color: "#16a34a", fontSize: 13, fontWeight: 600 }}>
            ✅ Joined! Slot #{mySlot} — ৳{match.entryFee} কাটা হয়েছে
          </div>
        )}

        {/* ── ROOM DETAILS + TOTAL PRIZE BUTTONS ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: "0 14px 14px" }}>
          <button
            onClick={() => setShowRoomModal(true)}
            style={{
              padding: "10px 0",
              border: "1.5px solid #1e40af",
              borderRadius: 10,
              background: "#fff",
              color: "#1e40af",
              fontWeight: 600,
              fontSize: 12,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 5,
            }}>
            🔑 Room Details <span style={{ fontSize: 11 }}>▾</span>
          </button>
          <button
            onClick={() => setShowPrizeModal(true)}
            style={{
              padding: "10px 0",
              border: "1.5px solid #1e40af",
              borderRadius: 10,
              background: "#fff",
              color: "#1e40af",
              fontWeight: 600,
              fontSize: 12,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 5,
            }}>
            🏆 Total Prize Details <span style={{ fontSize: 11 }}>▾</span>
          </button>
        </div>

        {/* ── FOOTER: STARTS IN / ROOM READY ── */}
        <div style={{
          background: "#16a34a",
          padding: "12px",
          textAlign: "center",
          color: "#fff",
          fontWeight: 700,
          fontSize: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
        }}>
          {isStarted ? (
            <span>কাস্টম Ready 🔑 Room Details থেকে নিন</span>
          ) : (
            <>
              <span style={{ fontSize: 15 }}>⏰</span>
              <span>STARTS IN — <span style={{ fontSize: 16, fontWeight: 800 }}>{timeLeft}</span></span>
            </>
          )}
        </div>
      </div>

      {/* ══════════════════════════════
          JOIN MODAL
      ══════════════════════════════ */}
      {showJoinModal && (
        <div
          onClick={() => setShowJoinModal(false)}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 1000,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "0 20px",
          }}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 20,
              width: "100%",
              maxWidth: 360,
              overflow: "hidden",
              animation: "slideUp 0.25s ease",
            }}>
            <div style={{
              background: "linear-gradient(135deg, #22c55e, #16a34a)",
              padding: "18px 20px",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div>
                <div style={{ color: "#fff", fontWeight: 800, fontSize: 16 }}>🎮 Match Join করুন</div>
                <div style={{ color: "#dcfce7", fontSize: 12, marginTop: 2 }}>{match.title}</div>
              </div>
              <button
                onClick={() => { setShowJoinModal(false); setInGameName(""); }}
                style={{
                  background: "rgba(255,255,255,0.25)", border: "none",
                  borderRadius: "50%", width: 30, height: 30,
                  color: "#fff", fontSize: 15, cursor: "pointer",
                }}>✕</button>
            </div>

            <div style={{ padding: "20px" }}>
              <div style={{
                background: "#fef3c7", border: "1px solid #fde68a",
                borderRadius: 10, padding: "10px 14px", marginBottom: 16,
                fontSize: 13, color: "#92400e", textAlign: "center", fontWeight: 600,
              }}>
                ৳{match.entryFee} আপনার wallet থেকে কাটা হবে
              </div>

              <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>
                Free Fire Username
              </label>
              <input
                type="text"
                placeholder="আপনার in-game username লিখুন"
                value={inGameName}
                onChange={(e) => setInGameName(e.target.value)}
                style={{
                  width: "100%", padding: "12px 14px",
                  border: "1.5px solid #e5e7eb", borderRadius: 10,
                  fontSize: 14, outline: "none", boxSizing: "border-box",
                  marginBottom: 16,
                }}
                onFocus={(e) => (e.target.style.borderColor = "#22c55e")}
                onBlur={(e)  => (e.target.style.borderColor = "#e5e7eb")}
                onKeyDown={(e) => e.key === "Enter" && inGameName.trim() && handleJoin()}
              />

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => { setShowJoinModal(false); setInGameName(""); }}
                  style={{
                    flex: 1, padding: "11px 0",
                    border: "1.5px solid #e5e7eb", borderRadius: 10,
                    background: "#fff", color: "#374151",
                    fontWeight: 600, fontSize: 13, cursor: "pointer",
                  }}>
                  বাতিল
                </button>
                <button
                  onClick={handleJoin}
                  disabled={!inGameName.trim()}
                  style={{
                    flex: 1, padding: "11px 0",
                    background: inGameName.trim() ? "#22c55e" : "#86efac",
                    border: "none", borderRadius: 10, color: "#fff",
                    fontWeight: 700, fontSize: 13,
                    cursor: inGameName.trim() ? "pointer" : "not-allowed",
                  }}>
                  ✅ Confirm Join
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════
          PRIZE MODAL
      ══════════════════════════════ */}
      {showPrizeModal && (
        <div
          onClick={() => setShowPrizeModal(false)}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 1000,
            display: "flex", alignItems: "flex-end", justifyContent: "center",
          }}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: "20px 20px 0 0",
              width: "100%", maxWidth: 450,
              paddingBottom: 32,
              animation: "slideUp 0.25s ease",
            }}>
            <div style={{
              background: "linear-gradient(135deg, #f59e0b, #d97706)",
              borderRadius: "20px 20px 0 0",
              padding: "18px 20px",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div>
                <div style={{ color: "#fff", fontWeight: 800, fontSize: 17 }}>🏆 Prize Pool</div>
                <div style={{ color: "#fef3c7", fontSize: 12, marginTop: 2 }}>{match.title}</div>
              </div>
              <button
                onClick={() => setShowPrizeModal(false)}
                style={{
                  background: "rgba(255,255,255,0.25)", border: "none",
                  borderRadius: "50%", width: 32, height: 32,
                  color: "#fff", fontSize: 16, cursor: "pointer",
                }}>✕</button>
            </div>
            <div style={{ padding: "16px 20px 0" }}>
              {[
                { rank: "🥇", label: "1st Place", value: match.prizes?.first  || match.winPrize || 0, bg: "#fef9c3", border: "#fde68a", color: "#92400e" },
                { rank: "🥈", label: "2nd Place", value: match.prizes?.second || 0, bg: "#f1f5f9", border: "#e2e8f0", color: "#475569" },
                { rank: "🥉", label: "3rd Place", value: match.prizes?.third  || 0, bg: "#fff7ed", border: "#fed7aa", color: "#9a3412" },
                { rank: "4️⃣", label: "4th Place", value: match.prizes?.fourth || 0, bg: "#f8fafc", border: "#e2e8f0", color: "#64748b" },
                { rank: "🔫", label: "Per Kill",  value: match.perKill  || 0,       bg: "#fef2f2", border: "#fecaca", color: "#dc2626" },
                { rank: "🎟", label: "Entry Fee", value: match.entryFee || 0,       bg: "#f0fdf4", border: "#bbf7d0", color: "#16a34a" },
              ].map((p, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  background: p.bg, border: `1px solid ${p.border}`,
                  borderRadius: 12, padding: "12px 16px", marginBottom: 8,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 20 }}>{p.rank}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: p.color }}>{p.label}</span>
                  </div>
                  <span style={{ fontSize: 16, fontWeight: 800, color: p.color }}>৳{p.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════
          ROOM DETAILS MODAL
      ══════════════════════════════ */}
      {showRoomModal && (
        <div
          onClick={() => setShowRoomModal(false)}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 1000,
            display: "flex", alignItems: "flex-end", justifyContent: "center",
          }}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: "20px 20px 0 0",
              width: "100%", maxWidth: 450,
              paddingBottom: 32,
              animation: "slideUp 0.25s ease",
            }}>
            <div style={{
              background: "linear-gradient(135deg, #1e40af, #3b82f6)",
              borderRadius: "20px 20px 0 0",
              padding: "18px 20px",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div>
                <div style={{ color: "#fff", fontWeight: 800, fontSize: 17 }}>🔑 Room Details</div>
                <div style={{ color: "#bfdbfe", fontSize: 12, marginTop: 2 }}>{match.title}</div>
              </div>
              <button
                onClick={() => setShowRoomModal(false)}
                style={{
                  background: "rgba(255,255,255,0.25)", border: "none",
                  borderRadius: "50%", width: 32, height: 32,
                  color: "#fff", fontSize: 16, cursor: "pointer",
                }}>✕</button>
            </div>

            <div style={{ padding: "20px 20px 0" }}>
              {mySlot && (
                <div style={{
                  background: "linear-gradient(135deg, #ecfdf5, #d1fae5)",
                  border: "2px solid #22c55e",
                  borderRadius: 14, padding: "14px 18px", marginBottom: 14,
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <div>
                    <div style={{ fontSize: 11, color: "#16a34a", fontWeight: 600 }}>আপনার Slot Number</div>
                    <div style={{ fontSize: 28, fontWeight: 900, color: "#15803d" }}>#{mySlot}</div>
                  </div>
                  <span style={{ fontSize: 40 }}>🎮</span>
                </div>
              )}

              {match.isRoomOpen ? (
                <>
                  {[
                    { label: "Room ID",   value: match.roomId       || "—", icon: "🏠" },
                    { label: "Password",  value: match.roomPassword || "—", icon: "🔒" },
                  ].map((item, i) => (
                    <div key={i} style={{
                      background: "#f0f9ff", border: "1px solid #bae6fd",
                      borderRadius: 14, padding: "14px 18px", marginBottom: 10,
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                    }}>
                      <div>
                        <div style={{ fontSize: 11, color: "#0369a1", fontWeight: 600, marginBottom: 4 }}>
                          {item.icon} {item.label}
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: "#0c4a6e", letterSpacing: 1 }}>
                          {item.value}
                        </div>
                      </div>
                      <button
                        onClick={() => navigator.clipboard?.writeText(item.value)}
                        style={{
                          background: "#0369a1", border: "none", borderRadius: 8,
                          color: "#fff", fontSize: 11, fontWeight: 600,
                          padding: "6px 12px", cursor: "pointer",
                        }}>
                        Copy
                      </button>
                    </div>
                  ))}
                </>
              ) : (
                <div style={{
                  background: "#f8fafc", border: "1px dashed #cbd5e1",
                  borderRadius: 14, padding: "24px", textAlign: "center",
                }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>⏳</div>
                  <div style={{ color: "#64748b", fontWeight: 600, fontSize: 14 }}>
                    Room details এখনো দেওয়া হয়নি
                  </div>
                  <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 4 }}>
                    Match শুরুর আগে admin দেবে
                  </div>
                </div>
              )}

              {!mySlot && (
                <div style={{
                  background: "#fffbeb", border: "1px solid #fde68a",
                  borderRadius: 10, padding: "10px 14px", marginTop: 4,
                  color: "#92400e", fontSize: 12, textAlign: "center",
                }}>
                  ⚠️ Match join করলে আপনার Slot Number এখানে দেখাবে
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%   { box-shadow: 0 0 0 0   rgba(34,197,94,0.4); }
          70%  { box-shadow: 0 0 0 10px rgba(34,197,94,0);   }
          100% { box-shadow: 0 0 0 0   rgba(34,197,94,0);   }
        }
        @keyframes slideUp {
          from { transform: translateY(40px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default MatchCard;