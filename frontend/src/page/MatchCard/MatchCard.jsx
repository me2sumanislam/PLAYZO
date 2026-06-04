 // MatchCard.jsx — আপনার existing MatchCard এর নিচে শুধু এই অংশটুকু যোগ হবে
// পুরো ফাইলটা replace করুন

import React, { useState, useRef, useEffect } from "react";

const API_BASE = ((import.meta.env.VITE_API_URL || "https://playzo-vn8e.onrender.com") + "/api").replace(/\/api\/api/, "/api");

// ── Countdown Timer ──────────────────────────────────────────────────────────
const TimeLeft = ({ startTime }) => {
  const [time, setTime] = useState("");
  useEffect(() => {
    const calc = () => {
      const diff = new Date(startTime).getTime() - Date.now();
      if (diff <= 0) { setTime("শুরু হয়েছে"); return; }
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

// ── Screenshot Upload Section ─────────────────────────────────────────────────
const ScreenshotUpload = ({ matchId }) => {
  const [file, setFile]       = useState(null);
  const [preview, setPreview] = useState(null);
  const [status, setStatus]   = useState("idle"); // idle|uploading|processing|done|error
  const [msg, setMsg]         = useState("");
  const [result, setResult]   = useState(null);
  const fileRef               = useRef();
  const token                 = localStorage.getItem("token");

  // page load এ আগে result আছে কিনা check
  useEffect(() => {
    checkResult();
  }, [matchId]);

  const checkResult = async () => {
    try {
      const res  = await fetch(`${API_BASE}/result/my/${matchId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) setResult(data.data);
      }
    } catch { /* silent */ }
  };

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) { setMsg("শুধু image file দিন"); return; }
    if (f.size > 8 * 1024 * 1024)    { setMsg("8MB এর বেশি না"); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setMsg("");
  };

  const handleUpload = async () => {
    if (!file) return;
    setStatus("uploading");
    const form = new FormData();
    form.append("screenshot", file);
    try {
      const res  = await fetch(`${API_BASE}/result/upload/${matchId}`, {
        method:  "POST",
        headers: { Authorization: `Bearer ${token}` },
        body:    form,
      });
      const data = await res.json();
      if (data.success) {
        setStatus("processing");
        setMsg("OCR চলছে... ১০-১৫ সেকেন্ড পরে status দেখুন");
        setTimeout(checkResult, 14000);
      } else {
        setStatus("error");
        setMsg(data.message || "Upload হয়নি");
      }
    } catch {
      setStatus("error");
      setMsg("Network error");
    }
  };

  const statusColor = { processing: "#92400e", pending_review: "#1e40af", approved: "#065f46", rejected: "#991b1b", published: "#5b21b6" };
  const statusBg    = { processing: "#fef3c7", pending_review: "#dbeafe", approved: "#d1fae5", rejected: "#fee2e2", published: "#ede9fe" };
  const statusLabel = { processing: "⏳ OCR চলছে", pending_review: "🔍 Admin review এ আছে", approved: "✅ Approved", rejected: "❌ Rejected", published: "🏆 Result Published" };

  // ─── Result দেখানো ──────────────────────────────────────────────────────────
  if (result) {
    return (
      <div style={{ padding: "10px 16px 16px", borderTop: "1px solid #f3f4f6" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>📸 Result Status</span>
          <span style={{
            padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
            background: statusBg[result.status] || "#f3f4f6",
            color:      statusColor[result.status] || "#374151",
          }}>
            {statusLabel[result.status] || result.status}
          </span>
        </div>

        {result.status === "published" && result.finalPlayers?.length > 0 && (
          <div style={{ background: "#f9fafb", borderRadius: 10, padding: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", marginBottom: 6, textTransform: "uppercase" }}>Leaderboard</div>
            {result.finalPlayers.map((p, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "6px 0", borderBottom: i < result.finalPlayers.length - 1 ? "1px solid #f3f4f6" : "none",
              }}>
                <span style={{ width: 24, fontSize: 13, fontWeight: 800, color: i === 0 ? "#f59e0b" : i === 1 ? "#6b7280" : "#f97316" }}>
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                </span>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{p.inGameName}</span>
                <span style={{ fontSize: 12, color: "#6b7280" }}>{p.kills} kills</span>
                {p.prizeAwarded > 0 && (
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#059669" }}>৳{p.prizeAwarded}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {result.status === "rejected" && result.adminNote && (
          <p style={{ fontSize: 12, color: "#dc2626", marginTop: 6 }}>কারণ: {result.adminNote}</p>
        )}

        <button
          onClick={checkResult}
          style={{
            marginTop: 8, width: "100%", padding: "7px 0",
            background: "#f3f4f6", border: "none", borderRadius: 8,
            fontSize: 12, color: "#6b7280", cursor: "pointer", fontWeight: 600,
          }}>
          🔄 Status update করুন
        </button>
      </div>
    );
  }

  // ─── Upload section ──────────────────────────────────────────────────────────
  return (
    <div style={{ padding: "0 16px 16px", borderTop: "1px solid #f3f4f6", paddingTop: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8 }}>
        📸 Result Screenshot Submit করুন
      </div>

      {preview && (
        <img src={preview} alt="" style={{ width: "100%", borderRadius: 8, maxHeight: 160, objectFit: "cover", marginBottom: 8 }} />
      )}

      {(status === "idle" || status === "error") && (
        <>
          <div
            onClick={() => fileRef.current.click()}
            style={{
              border: "2px dashed #d1d5db", borderRadius: 8, padding: "16px 12px",
              textAlign: "center", cursor: "pointer", background: "#fafafa", marginBottom: 8,
            }}>
            <div style={{ fontSize: 24 }}>📷</div>
            <p style={{ fontSize: 12, color: "#9ca3af", margin: "4px 0 0" }}>
              {file ? file.name : "Screenshot select করুন (Max 8MB)"}
            </p>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
          {file && (
            <button
              onClick={handleUpload}
              style={{
                width: "100%", padding: "11px 0", background: "#f97316",
                border: "none", borderRadius: 10, color: "#fff",
                fontWeight: 700, fontSize: 14, cursor: "pointer",
              }}>
              Submit করুন
            </button>
          )}
        </>
      )}

      {status === "uploading" && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 0", color: "#6b7280", fontSize: 13 }}>
          <span style={{ display: "inline-block", animation: "spin 0.8s linear infinite", fontSize: 16 }}>⏳</span>
          Upload হচ্ছে...
        </div>
      )}

      {status === "processing" && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 0", color: "#6b7280", fontSize: 13 }}>
          <span style={{ display: "inline-block", animation: "spin 0.8s linear infinite", fontSize: 16 }}>🔍</span>
          OCR দিয়ে result read হচ্ছে...
        </div>
      )}

      {msg && (
        <p style={{ fontSize: 12, color: status === "error" ? "#dc2626" : "#6b7280", marginTop: 6 }}>{msg}</p>
      )}

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// MAIN MatchCard component
// ═════════════════════════════════════════════════════════════════════════════
const MatchCard = ({ match, onJoinSuccess }) => {
  const [showRoom,      setShowRoom]      = useState(false);
  const [showPrize,     setShowPrize]     = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [inGameName,    setInGameName]    = useState("");
  const [joining,       setJoining]       = useState(false);
  const [joinMsg,       setJoinMsg]       = useState("");

  const user   = (() => { try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; } })();
  const userId = user?.id || user?._id;
  const token  = localStorage.getItem("token");

  const isStarted = match.startTime ? new Date(match.startTime).getTime() <= Date.now() : false;
  const mySlot    = (match.joinedUsers || []).find((u) => u.userId?.toString() === userId?.toString())?.slotNumber;
  const joined    = Number(match.joinedPlayers || 0);
  const total     = Number(match.totalPlayers  || 0);
  const fill      = total > 0 ? (joined / total) * 100 : 0;
  const alreadyJoined = (match.joinedUsers || []).some((u) => u.userId?.toString() === userId?.toString());

  const statusStyle = (s) => {
    if (s === "live")      return { bg: "#d1fae5", color: "#065f46", label: "🟢 Live" };
    if (s === "completed") return { bg: "#f3f4f6", color: "#374151", label: "✅ Ended" };
    return { bg: "#dbeafe", color: "#1e40af", label: "🕐 Upcoming" };
  };
  const st  = statusStyle(match.status);
  const fmt = (n) => "৳" + Number(n || 0).toLocaleString();

  const handleJoin = async () => {
    if (!inGameName.trim()) return;
    setJoining(true);
    try {
      const res  = await fetch(`${API_BASE}/matches/join/${match._id}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ userId, inGameName: inGameName.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setJoinMsg("✅ Join সফল! Slot #" + data.slotNumber);
        setShowJoinModal(false);
        setInGameName("");
        const stored = JSON.parse(localStorage.getItem("user") || "{}");
        localStorage.setItem("user", JSON.stringify({ ...stored, balance: data.newBalance ?? stored.balance }));
        if (onJoinSuccess) onJoinSuccess(match._id, data.newBalance);
      } else {
        setJoinMsg("❌ " + (data.message || "Join হয়নি"));
      }
    } catch {
      setJoinMsg("❌ Network error");
    }
    setJoining(false);
  };

  return (
    <>
      <div style={{
        background: "#fff", borderRadius: 16,
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        overflow: "hidden", marginBottom: 16, width: "100%",
      }}>

        {/* TOP: image + title */}
        <div style={{ display: "flex", gap: 14, padding: "16px 16px 12px" }}>
          <img
            src={match.image || "/image/img-1.jpg"}
            alt=""
            style={{ width: 105, height: 78, borderRadius: 10, objectFit: "cover", flexShrink: 0 }}
            onError={(e) => { e.target.src = "/image/img-1.jpg"; }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#111", lineHeight: 1.35 }}>
              {match.title} | {match.device || "Mobile"}
            </div>
            <div style={{ fontSize: 13, color: "#e53935", marginTop: 5, fontWeight: 600 }}>
              {match.startTime
                ? new Date(match.startTime).toLocaleString("en-BD", {
                    day: "2-digit", month: "short", year: "numeric",
                    hour: "2-digit", minute: "2-digit", hour12: true,
                  })
                : "—"}
            </div>
            <div style={{ marginTop: 7, display: "flex", gap: 6, flexWrap: "wrap" }}>
              <span style={{ background: st.bg, color: st.color, fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: 700 }}>
                {st.label}
              </span>
              {mySlot && (
                <span style={{ background: "#fef3c7", color: "#92400e", fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: 700 }}>
                  Slot #{mySlot}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", padding: "0 16px", rowGap: 14, marginBottom: 14 }}>
          {[
            { label: "WIN PRIZE",  value: fmt(match.winPrize) },
            { label: "ENTRY TYPE", value: (match.category || "").toUpperCase() },
            { label: "ENTRY FEE",  value: fmt(match.entryFee) },
            { label: "PER KILL",   value: fmt(match.perKill || 0) },
            { label: "MAP",        value: match.map || "Bermuda" },
            { label: "VERSION",    value: (match.device || "MOBILE").toUpperCase() },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: i % 3 === 0 ? "left" : i % 3 === 1 ? "center" : "right" }}>
              <div style={{ fontSize: 10, color: "#777", fontWeight: 700, letterSpacing: 0.5 }}>{s.label}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#111", marginTop: 3 }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        <div style={{ padding: "0 16px 14px" }}>
          <div style={{ height: 10, background: "#e5e7eb", borderRadius: 20, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${fill}%`, background: "#22c55e", borderRadius: 20, transition: "width 0.5s" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
            <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 500 }}>Only {total - joined} spots left</span>
            <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 500 }}>{joined}/{total}</span>
          </div>
        </div>

        {/* Room + Prize Buttons */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "0 16px 14px" }}>
          <div>
            <button
              onClick={() => setShowRoom((p) => ({ ...p, [match._id]: !p[match._id] }))}
              style={{ width: "100%", padding: "12px 0", border: "1.5px solid #1e40af", borderRadius: 10, background: "#fff", color: "#1e40af", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
              🔑 Room Details {showRoom[match._id] ? "▲" : "▼"}
            </button>
            {showRoom[match._id] && (
              <div style={{ marginTop: 6, background: "#f0f9ff", borderRadius: 8, padding: "12px", border: "1px solid #bae6fd" }}>
                {match.isRoomOpen && match.roomId ? (
                  <>
                    {mySlot && (
                      <div style={{ background: "#d1fae5", border: "1px solid #6ee7b7", borderRadius: 8, padding: "8px 12px", marginBottom: 8, textAlign: "center" }}>
                        <div style={{ fontSize: 11, color: "#065f46", fontWeight: 600 }}>আপনার Slot</div>
                        <div style={{ fontSize: 22, fontWeight: 900, color: "#065f46" }}>#{mySlot}</div>
                      </div>
                    )}
                    <div style={{ fontSize: 13, color: "#0c4a6e", marginBottom: 5 }}>
                      <b>Room ID:</b> {match.roomId}
                    </div>
                    <div style={{ fontSize: 13, color: "#0c4a6e" }}>
                      <b>Password:</b> {match.roomPassword || "—"}
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: 12, color: "#64748b", textAlign: "center" }}>⏳ Room details not available yet</div>
                )}
              </div>
            )}
          </div>

          <div>
            <button
              onClick={() => setShowPrize((p) => ({ ...p, [match._id]: !p[match._id] }))}
              style={{ width: "100%", padding: "12px 0", border: "1.5px solid #1e40af", borderRadius: 10, background: "#fff", color: "#1e40af", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
              🏆 Prize Details {showPrize[match._id] ? "▲" : "▼"}
            </button>
            {showPrize[match._id] && (
              <div style={{ marginTop: 6, background: "#fefce8", borderRadius: 8, padding: "12px", border: "1px solid #fde68a" }}>
                {[
                  { label: "🥇 1st",    value: match.prizes?.first  || match.winPrize || 0 },
                  { label: "🥈 2nd",    value: match.prizes?.second || 0 },
                  { label: "🥉 3rd",    value: match.prizes?.third  || 0 },
                  { label: "4️⃣ 4th",   value: match.prizes?.fourth || 0 },
                  { label: "🔫 Kill",   value: match.perKill || 0 },
                  { label: "🎟 Entry",  value: match.entryFee || 0 },
                ].map((p, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#92400e", paddingBottom: 4, marginBottom: 4, borderBottom: i < 5 ? "1px solid #fde68a" : "none" }}>
                    <span>{p.label}</span><b>৳{p.value}</b>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Join button — শুধু upcoming match এ দেখাবে */}
        {match.status === "upcoming" && !alreadyJoined && (
          <div style={{ padding: "0 16px 14px" }}>
            <button
              onClick={() => setShowJoinModal(true)}
              style={{ width: "100%", padding: "13px 0", background: "#22c55e", border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              🎮 Join Match — {fmt(match.entryFee)}
            </button>
          </div>
        )}

        {match.status === "upcoming" && alreadyJoined && (
          <div style={{ padding: "0 16px 14px" }}>
            <div style={{ textAlign: "center", background: "#d1fae5", border: "1px solid #6ee7b7", borderRadius: 10, padding: "10px 0", color: "#065f46", fontWeight: 700, fontSize: 13 }}>
              ✅ You joined — Slot #{mySlot}
            </div>
          </div>
        )}

        {/* ✅ SCREENSHOT UPLOAD — live বা completed match এ দেখাবে */}
        {(match.status === "live" || match.status === "completed") && userId && (
          <ScreenshotUpload matchId={match._id} />
        )}

        {/* Footer */}
        <div style={{ background: match.status === "completed" ? "#374151" : "#16a34a", padding: "14px", textAlign: "center", color: "#fff", fontWeight: 700, fontSize: 14 }}>
          {match.status === "completed" ? (
            <span>✅ Match শেষ হয়েছে</span>
          ) : isStarted ? (
            <span>কাস্টম Ready 🔑 Room Details থেকে নিন</span>
          ) : (
            <span>⏰ STARTS IN — <TimeLeft startTime={match.startTime} /></span>
          )}
        </div>
      </div>

      {/* Toast */}
      {joinMsg && (
        <div style={{
          position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)",
          background: joinMsg.startsWith("✅") ? "#059669" : "#dc2626",
          color: "#fff", padding: "10px 20px", borderRadius: 20,
          fontWeight: 600, fontSize: 13, zIndex: 9999, whiteSpace: "nowrap",
        }}>
          {joinMsg}
        </div>
      )}

      {/* Join Modal */}
      {showJoinModal && (
        <div onClick={() => setShowJoinModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 20px" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 360, overflow: "hidden" }}>
            <div style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)", padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ color: "#fff", fontWeight: 800, fontSize: 16 }}>🎮 Match Join করুন</div>
                <div style={{ color: "#dcfce7", fontSize: 12, marginTop: 2 }}>{match.title}</div>
              </div>
              <button onClick={() => { setShowJoinModal(false); setInGameName(""); }} style={{ background: "rgba(255,255,255,0.25)", border: "none", borderRadius: "50%", width: 30, height: 30, color: "#fff", fontSize: 15, cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ padding: "20px" }}>
              <div style={{ background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#92400e", textAlign: "center", fontWeight: 600 }}>
                ৳{match.entryFee} আপনার wallet থেকে কাটা হবে
              </div>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>Free Fire Username (In-Game Name)</label>
              <input
                type="text"
                placeholder="আপনার in-game username লিখুন"
                value={inGameName}
                onChange={(e) => setInGameName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && inGameName.trim() && handleJoin()}
                style={{ width: "100%", padding: "12px 14px", border: "1.5px solid #e5e7eb", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 16 }}
              />
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => { setShowJoinModal(false); setInGameName(""); }} style={{ flex: 1, padding: "11px 0", border: "1.5px solid #e5e7eb", borderRadius: 10, background: "#fff", color: "#374151", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>বাতিল</button>
                <button onClick={handleJoin} disabled={!inGameName.trim() || joining} style={{ flex: 1, padding: "11px 0", background: inGameName.trim() && !joining ? "#22c55e" : "#86efac", border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, fontSize: 13, cursor: inGameName.trim() && !joining ? "pointer" : "not-allowed" }}>
                  {joining ? "⏳ Joining..." : "✅ Confirm Join"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp { from{transform:translateY(40px);opacity:0} to{transform:translateY(0);opacity:1} }
      `}</style>
    </>
  );
};

export default MatchCard;