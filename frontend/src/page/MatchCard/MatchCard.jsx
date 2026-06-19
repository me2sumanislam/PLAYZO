 import React, { useState, useRef, useEffect } from "react";

const API_BASE = ((import.meta.env.VITE_API_URL || "https://playzo-vn8e.onrender.com") + "/api").replace(/\/api\/api/, "/api");

// ── ক্যাটাগরি অনুসারে রুলস ──────────────────────────────────────────────────
const CATEGORY_RULES = {
  br_solo:    { title: "Battle Royale Solo Rules", rules: ["ম্যাচ শুরুর আগে রুমে থাকতে হবে", "হ্যাক/চিট ব্যবহারে সরাসরি DQ", "ম্যাচ চলাকালীন রুম ছাড়লে হার গণ্য হবে", "স্ক্রিনশট প্রমাণ জমা দিতে হবে", "বিতর্কে হোস্টের সিদ্ধান্ত চূড়ান্ত", "Zone camping অনুমোদিত নয়", "Match শুরুর ৫ মিনিট আগে room ID দেওয়া হবে"] },
  br_duo:     { title: "Battle Royale Duo Rules",  rules: ["প্রতিটি দলে ঠিক ২ জন থাকতে হবে", "হ্যাক/চিট ব্যবহারে সরাসরি DQ", "দুজনকেই একই রুমে থাকতে হবে", "স্ক্রিনশট প্রমাণ জমা দিতে হবে", "বিতর্কে হোস্টের সিদ্ধান্ত চূড়ান্ত", "Zone camping অনুমোদিত নয়"] },
  br_squad:   { title: "Battle Royale Squad Rules", rules: ["প্রতি squad-এ ৪ জন থাকতে হবে", "হ্যাক/চিট ব্যবহারে সরাসরি DQ", "মাঝপথে প্লেয়ার পরিবর্তন নয়", "স্ক্রিনশট প্রমাণ জমা দিতে হবে", "বিতর্কে হোস্টের সিদ্ধান্ত চূড়ান্ত"] },
  cs_solo:    { title: "Clash Squad Solo Rules",   rules: ["একক প্লেয়ার হিসেবে অংশগ্রহণ", "কোনো co-ordination বা callout নিষিদ্ধ", "প্রতিটি রাউন্ডের স্ক্রিনশট জমা দিতে হবে", "হ্যাক/চিট ব্যবহারে সরাসরি DQ", "Disconnect হলে সেই রাউন্ড পুনরায় খেলতে হবে", "অপরপক্ষকে ট্রোলিং নিষিদ্ধ"] },
  cs_duo:     { title: "Clash Squad Duo Rules",    rules: ["প্রতিটি দলে ঠিক ২ জন থাকবে", "Clash Squad মোডে ২v২ ফরম্যাটে খেলতে হবে", "প্রতিটি গেমের আগে map কনফার্ম করতে হবে", "একজন Disconnect হলে সেই রাউন্ড বাতিল", "স্ক্রিনশট প্রমাণ বাধ্যতামূলক"] },
  cs_squad:   { title: "Clash Squad Rules",        rules: ["প্রতিটি দলে ঠিক ৪ জন থাকতে হবে", "Clash Squad মোডে খেলতে হবে", "Friendly fire থেকে বিরত থাকতে হবে", "গ্লিচ বা বাগ ব্যবহার করলে রাউন্ড বাতিল", "২ রাউন্ড জিতলেই ম্যাচ বিজয়ী", "স্ক্রিনশট প্রমাণ বাধ্যতামূলক"] },
  cs_6vs6:    { title: "Clash Squad 6vs6 Rules",   rules: ["প্রতিটি দলে ঠিক ৬ জন থাকতে হবে", "Clash Squad মোডে খেলতে হবে", "মাঝপথে প্লেয়ার পরিবর্তন নয়", "গ্লিচ বা বাগ ব্যবহার করলে রাউন্ড বাতিল", "স্ক্রিনশট প্রমাণ বাধ্যতামূলক"] },
  lw_solo:    { title: "Lone Wolf Solo Rules",     rules: ["একক প্লেয়ার হিসেবে অংশগ্রহণ", "কোনো co-ordination নিষিদ্ধ", "Best of 3 বা Best of 5 ফরম্যাট", "টাই হলে Sudden Death রাউন্ড হবে", "Emote abuse এবং delay tactics বন্ধ", "স্ক্রিনশট প্রমাণ বাধ্যতামূলক"] },
  lw_duo:     { title: "Lone Wolf Duo Rules",      rules: ["প্রতিটি দলে ঠিক ২ জন থাকবে", "Duo voice chat ব্যবহার করা যাবে", "Third party সাহায্য নেওয়া যাবে না", "স্ক্রিনশট প্রমাণ বাধ্যতামূলক", "বিতর্কে হোস্টের সিদ্ধান্ত চূড়ান্ত"] },
  free_match: { title: "Free Match Rules",         rules: ["হোস্ট কর্তৃক ঘোষিত নিয়ম মানা বাধ্যতামূলক", "হ্যাক বা চিট ব্যবহার করলে তাৎক্ষণিক ban", "Entry fee থাকলে আগেই প্রদান করতে হবে", "অশ্লীল ভাষা বা ব্যক্তিগত আক্রমণ নিষিদ্ধ", "বিতর্কে হোস্ট/অ্যাডমিনের সিদ্ধান্ত চূড়ান্ত"] },
};

const getMatchRules = (category) => {
  const key = (category || "").toLowerCase().trim();
  return CATEGORY_RULES[key] || { title: "Match Rules", rules: ["হ্যাক/চিট ব্যবহারে সরাসরি DQ", "স্ক্রিনশট প্রমাণ জমা দিতে হবে", "বিতর্কে হোস্টের সিদ্ধান্ত চূড়ান্ত", "ম্যাচ চলাকালীন রুম ছাড়লে হার গণ্য হবে"] };
};

// ── কাউন্টডাউন টাইমার ──────────────────────────────────────────────────────────
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

// ── Match Detail Bottom Sheet ─────────────────────────────────────────────────
const MatchDetailSheet = ({ match, onClose }) => {
  const [slideIn, setSlideIn] = useState(false);
  const sheetRef = useRef();

  useEffect(() => { requestAnimationFrame(() => setSlideIn(true)); }, []);

  const handleClose = () => { setSlideIn(false); setTimeout(onClose, 320); };
  const fmt   = (n) => "৳" + Number(n || 0).toLocaleString();
  const rules = getMatchRules(match.category);

  const user   = (() => { try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; } })();
  const userId = user?.id || user?._id;
  const players = [...(match.joinedUsers || [])].sort((a, b) => (a.slotNumber || 0) - (b.slotNumber || 0));

  return (
    <div onClick={handleClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 2000, display: "flex", alignItems: "flex-end", fontFamily: "'Hind Siliguri','Segoe UI',sans-serif" }}>
      <div ref={sheetRef} onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 480, margin: "0 auto", background: "#fff", borderRadius: "20px 20px 0 0", maxHeight: "88dvh", overflowY: "auto", transform: slideIn ? "translateY(0)" : "translateY(100%)", transition: "transform 0.32s cubic-bezier(0.32,0.72,0,1)", WebkitOverflowScrolling: "touch" }}>
        
        {/* Drag handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: "#e5e7eb" }} />
        </div>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "6px 20px 16px" }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#111", lineHeight: 1.3 }}>{match.title}</h2>
          <button onClick={handleClose} style={{ background: "#f3f4f6", border: "none", borderRadius: "50%", width: 32, height: 32, color: "#374151", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 15, WebkitTapHighlightColor: "transparent" }}>✕</button>
        </div>

        {/* Win Prize / Entry Fee / Entry Type */}
        <div style={{ padding: "0 20px 16px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          <div style={{ background: "#fefce8", borderRadius: 12, padding: "10px 8px", textAlign: "center", border: "1px solid #fde68a" }}>
            <div style={{ fontSize: 10, color: "#92400e", fontWeight: 700 }}>WIN PRIZE</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#92400e", marginTop: 3 }}>{fmt(match.winPrize)}</div>
          </div>
          <div style={{ background: "#fef2f2", borderRadius: 12, padding: "10px 8px", textAlign: "center", border: "1px solid #fecaca" }}>
            <div style={{ fontSize: 10, color: "#991b1b", fontWeight: 700 }}>ENTRY FEE</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#991b1b", marginTop: 3 }}>{fmt(match.entryFee)}</div>
          </div>
          <div style={{ background: "#eff6ff", borderRadius: 12, padding: "10px 8px", textAlign: "center", border: "1px solid #bfdbfe" }}>
            <div style={{ fontSize: 10, color: "#1e40af", fontWeight: 700 }}>ENTRY TYPE</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#1e40af", marginTop: 3 }}>{(match.category || "").toUpperCase()}</div>
          </div>
        </div>

        {/* Rules Section */}
        <div style={{ padding: "0 20px 18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <div style={{ width: 4, height: 18, background: "#ef4444", borderRadius: 2 }} />
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#111" }}>📋 {rules.title}</h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {rules.rules.map((rule, i) => (
              <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start", background: "#f9fafb", borderRadius: 9, padding: "9px 11px", border: "1px solid #f3f4f6" }}>
                <span style={{ minWidth: 20, height: 20, background: "#fee2e2", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "#dc2626" }}>{i + 1}</span>
                <p style={{ margin: 0, fontSize: 12.5, color: "#374151", lineHeight: 1.5 }}>{rule}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Joined Players */}
        <div style={{ padding: "0 20px 28px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#111" }}>👥 Joined Players</h3>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7280" }}>{match.joinedPlayers || 0}/{match.totalPlayers || 0}</span>
          </div>
          {players.length > 0 ? (
            <div style={{ border: "1px solid #f3f4f6", borderRadius: 10, overflow: "hidden" }}>
              {players.map((p, i) => {
                const isMe = p.userId?.toString?.() === userId?.toString?.();
                return (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 13px", fontSize: 13, background: isMe ? "#f0fdf4" : i % 2 === 0 ? "#fff" : "#fafafa", borderBottom: i < players.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                    <span style={{ color: "#374151", fontWeight: isMe ? 700 : 500 }}>
                      {p.inGameName || p.gameName || "—"} {isMe && <span style={{ color: "#16a34a" }}>(আপনি)</span>}
                    </span>
                    <span style={{ background: "#fef3c7", color: "#92400e", fontSize: 10, padding: "2px 8px", borderRadius: 20, fontWeight: 700 }}>Slot #{p.slotNumber}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ fontSize: 12, color: "#9ca3af", textAlign: "center", padding: "14px 0", background: "#f9fafb", borderRadius: 10 }}>এখনো কেউ join করেনি</div>
          )}
        </div>
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// MAIN MatchCard Component
// ═════════════════════════════════════════════════════════════════════════════
const MatchCard = ({ match, onJoinSuccess }) => {
  const [showRoom,        setShowRoom]        = useState(false);
  const [showPrize,       setShowPrize]       = useState(false);
  const [showJoinModal,   setShowJoinModal]   = useState(false);
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const [inGameName,      setInGameName]      = useState("");
  const [savedGameName,   setSavedGameName]   = useState("");
  const [loadingName,     setLoadingName]     = useState(false);
  const [joining,         setJoining]         = useState(false);
  const [joinMsg,         setJoinMsg]         = useState("");

  const user   = (() => { try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; } })();
  const userId = user?.id || user?._id;
  const token  = localStorage.getItem("token");

  const isStarted     = match.startTime ? new Date(match.startTime).getTime() <= Date.now() : false;
  const mySlot        = (match.joinedUsers || []).find((u) => u.userId?.toString() === userId?.toString())?.slotNumber;
  const joined        = Number(match.joinedPlayers || 0);
  const total         = Number(match.totalPlayers  || 0);
  const fill          = total > 0 ? (joined / total) * 100 : 0;
  const isFull        = total > 0 && joined >= total;
  const alreadyJoined = (match.joinedUsers || []).some((u) => u.userId?.toString() === userId?.toString());

  const statusStyle = (s, started) => {
    if (s === "completed") return { bg: "#f3f4f6", color: "#374151", label: "✅ Ended" };
    if (s === "live" || started) return { bg: "#d1fae5", color: "#065f46", label: "🟢 Live" };
    return { bg: "#dbeafe", color: "#1e40af", label: "🕐 Upcoming" };
  };
  const st  = statusStyle(match.status, isStarted);
  const fmt = (n) => "৳" + Number(n || 0).toLocaleString();

  // Join Modal খোলার আগে Game Name লোড করা
  const openJoinModal = async () => {
    setLoadingName(true);
    setShowJoinModal(true);
    try {
      const res = await fetch(`${API_BASE}/users/me`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await res.json();
      const serverName = d?.user?.inGameName || d?.data?.inGameName || "";
      if (serverName) {
        setSavedGameName(serverName);
        setInGameName(serverName);
      }
    } catch {}
    setLoadingName(false);
  };

  const handleJoin = async () => {
    if (!inGameName.trim()) return;
    setJoining(true);
    try {
      if (inGameName.trim() !== savedGameName) {
        await fetch(`${API_BASE}/users/game-name`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ inGameName: inGameName.trim() }),
        });
      }

      const res = await fetch(`${API_BASE}/matches/join/${match._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId, inGameName: inGameName.trim() }),
      });
      const data = await res.json();

      if (data.success) {
        setJoinMsg("✅ Join সফল! Slot #" + data.slotNumber);
        setShowJoinModal(false);
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
      <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 4px 12px rgba(0,0,0,0.08)", overflow: "hidden", marginBottom: 16, width: "100%" }}>

        {/* Top Section */}
        <div style={{ display: "flex", gap: 14, padding: "16px 16px 12px" }}>
          <img src={match.image || "/image/img-1.jpg"} alt="" style={{ width: 105, height: 78, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} onError={(e) => { e.target.src = "/image/img-1.jpg"; }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#111", lineHeight: 1.35 }}>{match.title} | {match.device || "Mobile"}</div>
            <div style={{ fontSize: 13, color: "#e53935", marginTop: 5, fontWeight: 600 }}>
              {match.startTime ? new Date(match.startTime).toLocaleString("en-BD", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true }) : "—"}
            </div>
            <div style={{ marginTop: 7, display: "flex", gap: 6, flexWrap: "wrap" }}>
              <span style={{ background: st.bg, color: st.color, fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: 700 }}>{st.label}</span>
              {mySlot && <span style={{ background: "#fef3c7", color: "#92400e", fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: 700 }}>Slot #{mySlot}</span>}
            </div>
          </div>
        </div>

        {/* Stats */}
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
              <div style={{ fontSize: 10, color: "#777", fontWeight: 700 }}>{s.label}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#111", marginTop: 3 }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Progress + Join Button */}
        <div style={{ padding: "0 16px 14px" }}>
          <div style={{ height: 10, background: "#e5e7eb", borderRadius: 20, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${fill}%`, background: "#22c55e", borderRadius: 20 }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 7 }}>
            <span style={{ fontSize: 11, color: "#6b7280" }}>Only {total - joined} spots left</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: "#374151", fontWeight: 700 }}>{joined}/{total}</span>
              {!isStarted && match.status === "upcoming" && !alreadyJoined && !isFull && (
                <button onClick={openJoinModal} style={{ padding: "5px 12px", background: "#22c55e", border: "none", borderRadius: 20, color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                  Join
                </button>
              )}
              {alreadyJoined && <span style={{ background: "#d1fae5", color: "#065f46", fontSize: 11, padding: "4px 10px", borderRadius: 20, fontWeight: 700 }}>✅ Joined</span>}
            </div>
          </div>
        </div>

        {/* Room & Prize Buttons */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "0 16px 14px" }}>
          <button onClick={() => setShowRoom(!showRoom)} style={{ padding: "12px 0", border: "1.5px solid #1e40af", borderRadius: 10, background: "#fff", color: "#1e40af", fontWeight: 700 }}>
            🔑 Room Details {showRoom ? "▲" : "▼"}
          </button>
          <button onClick={() => setShowPrize(!showPrize)} style={{ padding: "12px 0", border: "1.5px solid #1e40af", borderRadius: 10, background: "#fff", color: "#1e40af", fontWeight: 700 }}>
            🏆 Prize Details {showPrize ? "▲" : "▼"}
          </button>
        </div>

        {/* Footer */}
        <div onClick={() => setShowDetailSheet(true)} style={{ background: match.status === "completed" ? "#374151" : "#16a34a", padding: "14px", textAlign: "center", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
          {match.status === "completed" ? "✅ Match শেষ হয়েছে" : isStarted ? "কাস্টম Ready 🔑 Room Details" : <>⏰ STARTS IN — <TimeLeft startTime={match.startTime} /></>}
          <span style={{ fontSize: 11, opacity: 0.8, marginLeft: 6 }}>ℹ️ Details</span>
        </div>
      </div>

      {/* Join Modal */}
      {showJoinModal && (
        <div onClick={() => setShowJoinModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 360 }}>
            {/* Modal Content */}
            <div style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)", padding: "18px 20px", color: "#fff" }}>
              <div style={{ fontWeight: 800, fontSize: 16 }}>🎮 Match Join করুন</div>
              <div style={{ fontSize: 12, marginTop: 2 }}>{match.title}</div>
            </div>

            <div style={{ padding: "20px" }}>
              <div style={{ background: "#fef3c7", padding: "10px 14px", borderRadius: 10, textAlign: "center", marginBottom: 16, color: "#92400e", fontWeight: 600 }}>
                ৳{match.entryFee} আপনার ওয়ালেট থেকে কাটা হবে
              </div>

              <label style={{ fontWeight: 700, fontSize: 13, display: "block", marginBottom: 6 }}>🎯 Free Fire In-Game Name</label>

              {loadingName ? (
                <div style={{ padding: "12px", background: "#f9fafb", borderRadius: 10, textAlign: "center" }}>⏳ লোড হচ্ছে...</div>
              ) : (
                <input
                  type="text"
                  value={inGameName}
                  onChange={(e) => setInGameName(e.target.value)}
                  placeholder="আপনার ইন-গেম নাম লিখুন"
                  style={{ width: "100%", padding: "12px", border: "1.5px solid #e5e7eb", borderRadius: 10, fontSize: 14 }}
                />
              )}

              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <button onClick={() => setShowJoinModal(false)} style={{ flex: 1, padding: "11px", border: "1.5px solid #e5e7eb", borderRadius: 10 }}>বাতিল</button>
                <button onClick={handleJoin} disabled={!inGameName.trim() || joining} style={{ flex: 1, padding: "11px", background: "#22c55e", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700 }}>
                  {joining ? "Joining..." : "✅ Confirm Join"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDetailSheet && <MatchDetailSheet match={match} onClose={() => setShowDetailSheet(false)} />}
    </>
  );
};

export default MatchCard;