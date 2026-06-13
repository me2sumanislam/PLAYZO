 // frontend/src/page/MatchCard/MatchCard.jsx

import React, { useState, useRef, useEffect } from "react";

const API_BASE = ((import.meta.env.VITE_API_URL || "https://playzo-vn8e.onrender.com") + "/api").replace(/\/api\/api/, "/api");

// ── Category → Rules mapping ──────────────────────────────────────────────────
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

// ── Match Detail Bottom Sheet ─────────────────────────────────────────────────
const MatchDetailSheet = ({ match, onClose }) => {
  const [slideIn, setSlideIn] = useState(false);
  const sheetRef = useRef();

  useEffect(() => { requestAnimationFrame(() => setSlideIn(true)); }, []);

  const handleClose = () => { setSlideIn(false); setTimeout(onClose, 320); };
  const fmt = (n) => "৳" + Number(n || 0).toLocaleString();
  const rules = getMatchRules(match.category);
  const formatSchedule = (t) => {
    if (!t) return "—";
    return new Date(t).toLocaleString("en-BD", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true });
  };

  return (
    <div onClick={handleClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 2000, display: "flex", alignItems: "flex-end", fontFamily: "'Hind Siliguri','Segoe UI',sans-serif" }}>
      <div ref={sheetRef} onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 480, margin: "0 auto", background: "#fff", borderRadius: "20px 20px 0 0", maxHeight: "88dvh", overflowY: "auto", transform: slideIn ? "translateY(0)" : "translateY(100%)", transition: "transform 0.32s cubic-bezier(0.32,0.72,0,1)", WebkitOverflowScrolling: "touch" }}>
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: "#e5e7eb" }} />
        </div>
        <div style={{ background: "linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%)", padding: "16px 20px 24px", color: "#fff" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
            <div>
              <p style={{ margin: "0 0 4px", fontSize: 11, opacity: 0.7, textTransform: "uppercase", letterSpacing: 1 }}>Match Details</p>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, lineHeight: 1.3 }}>{match.title}</h2>
            </div>
            <button onClick={handleClose} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "50%", width: 32, height: 32, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 16, WebkitTapHighlightColor: "transparent" }}>✕</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[{ label: "🏆 Prize", value: fmt(match.winPrize) }, { label: "🎟 Entry Fee", value: fmt(match.entryFee) }, { label: "🔫 Per Kill", value: fmt(match.perKill || 0) }, { label: "👥 Players", value: `${match.joinedPlayers || 0} / ${match.totalPlayers || 0}` }].map((s, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.15)", borderRadius: 12, padding: "10px 14px", backdropFilter: "blur(4px)" }}>
                <p style={{ margin: "0 0 2px", fontSize: 11, opacity: 0.75 }}>{s.label}</p>
                <p style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>{s.value}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, background: "rgba(255,255,255,0.15)", borderRadius: 12, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>📅</span>
            <div>
              <p style={{ margin: "0 0 2px", fontSize: 11, opacity: 0.75 }}>Match Schedule</p>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>{formatSchedule(match.startTime)}</p>
            </div>
          </div>
          {(match.prizes?.first || match.prizes?.second || match.prizes?.third) && (
            <div style={{ marginTop: 12, background: "rgba(255,255,255,0.12)", borderRadius: 12, padding: "10px 14px" }}>
              <p style={{ margin: "0 0 8px", fontSize: 11, opacity: 0.75, textTransform: "uppercase", letterSpacing: 0.5 }}>Prize Breakdown</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {match.prizes?.first  > 0 && <span style={{ background: "rgba(255,215,0,0.25)", borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 700 }}>🥇 {fmt(match.prizes.first)}</span>}
                {match.prizes?.second > 0 && <span style={{ background: "rgba(192,192,192,0.25)", borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 700 }}>🥈 {fmt(match.prizes.second)}</span>}
                {match.prizes?.third  > 0 && <span style={{ background: "rgba(205,127,50,0.25)", borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 700 }}>🥉 {fmt(match.prizes.third)}</span>}
              </div>
            </div>
          )}
        </div>
        <div style={{ padding: "20px 20px 32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <div style={{ width: 4, height: 20, background: "#ef4444", borderRadius: 2 }} />
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#111" }}>📋 {rules.title}</h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {rules.rules.map((rule, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "#f9fafb", borderRadius: 10, padding: "10px 12px", border: "1px solid #f3f4f6" }}>
                <span style={{ minWidth: 22, height: 22, background: "#fee2e2", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#dc2626" }}>{i + 1}</span>
                <p style={{ margin: 0, fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{rule}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, background: "#fff7ed", borderRadius: 12, padding: "12px 14px", border: "1px solid #fed7aa", display: "flex", gap: 8 }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
            <p style={{ margin: 0, fontSize: 12, color: "#92400e", lineHeight: 1.5 }}>বিতর্কের ক্ষেত্রে admin-এর সিদ্ধান্তই চূড়ান্ত। স্ক্রিনশট বা রেকর্ড ছাড়া কোনো claim গ্রহণ করা হবে না।</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Screenshot Upload Section ─────────────────────────────────────────────────
const ScreenshotUpload = ({ matchId }) => {
  const [file, setFile]       = useState(null);
  const [preview, setPreview] = useState(null);
  const [status, setStatus]   = useState("idle");
  const [msg, setMsg]         = useState("");
  const [result, setResult]   = useState(null);
  const fileRef               = useRef();
  const token                 = localStorage.getItem("token");

  useEffect(() => { checkResult(); }, [matchId]);

  const checkResult = async () => {
    try {
      const res  = await fetch(`${API_BASE}/result/my/${matchId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const data = await res.json(); if (data.success) setResult(data.data); }
    } catch { /* silent */ }
  };

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) { setMsg("শুধু image file দিন"); return; }
    if (f.size > 8 * 1024 * 1024)    { setMsg("8MB এর বেশি না"); return; }
    setFile(f); setPreview(URL.createObjectURL(f)); setMsg("");
  };

  const handleUpload = async () => {
    if (!file) return;
    setStatus("uploading");
    const form = new FormData();
    form.append("screenshot", file);
    try {
      const res  = await fetch(`${API_BASE}/result/upload/${matchId}`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form });
      const data = await res.json();
      if (data.success) { setStatus("processing"); setMsg("OCR চলছে... ১০-১৫ সেকেন্ড পরে status দেখুন"); setTimeout(checkResult, 14000); }
      else { setStatus("error"); setMsg(data.message || "Upload হয়নি"); }
    } catch { setStatus("error"); setMsg("Network error"); }
  };

  const statusColor = { processing: "#92400e", pending_review: "#1e40af", approved: "#065f46", rejected: "#991b1b", published: "#5b21b6" };
  const statusBg    = { processing: "#fef3c7", pending_review: "#dbeafe", approved: "#d1fae5", rejected: "#fee2e2", published: "#ede9fe" };
  const statusLabel = { processing: "⏳ OCR চলছে", pending_review: "🔍 Admin review এ আছে", approved: "✅ Approved", rejected: "❌ Rejected", published: "🏆 Result Published" };

  if (result) {
    return (
      <div style={{ padding: "10px 16px 16px", borderTop: "1px solid #f3f4f6" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>📸 Result Status</span>
          <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: statusBg[result.status] || "#f3f4f6", color: statusColor[result.status] || "#374151" }}>
            {statusLabel[result.status] || result.status}
          </span>
        </div>
        {result.status === "published" && result.finalPlayers?.length > 0 && (
          <div style={{ background: "#f9fafb", borderRadius: 10, padding: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", marginBottom: 6, textTransform: "uppercase" }}>Leaderboard</div>
            {result.finalPlayers.map((p, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: i < result.finalPlayers.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                <span style={{ width: 24, fontSize: 13, fontWeight: 800, color: i === 0 ? "#f59e0b" : i === 1 ? "#6b7280" : "#f97316" }}>{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}</span>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{p.inGameName}</span>
                <span style={{ fontSize: 12, color: "#6b7280" }}>{p.kills} kills</span>
                {p.prizeAwarded > 0 && <span style={{ fontSize: 12, fontWeight: 700, color: "#059669" }}>৳{p.prizeAwarded}</span>}
              </div>
            ))}
          </div>
        )}
        {result.status === "rejected" && result.adminNote && (
          <p style={{ fontSize: 12, color: "#dc2626", marginTop: 6 }}>কারণ: {result.adminNote}</p>
        )}
        <button onClick={checkResult} style={{ marginTop: 8, width: "100%", padding: "7px 0", background: "#f3f4f6", border: "none", borderRadius: 8, fontSize: 12, color: "#6b7280", cursor: "pointer", fontWeight: 600 }}>
          🔄 Status update করুন
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "0 16px 16px", borderTop: "1px solid #f3f4f6", paddingTop: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8 }}>📸 Result Screenshot Submit করুন</div>
      {preview && <img src={preview} alt="" style={{ width: "100%", borderRadius: 8, maxHeight: 160, objectFit: "cover", marginBottom: 8 }} />}
      {(status === "idle" || status === "error") && (
        <>
          <div onClick={() => fileRef.current.click()} style={{ border: "2px dashed #d1d5db", borderRadius: 8, padding: "16px 12px", textAlign: "center", cursor: "pointer", background: "#fafafa", marginBottom: 8 }}>
            <div style={{ fontSize: 24 }}>📷</div>
            <p style={{ fontSize: 12, color: "#9ca3af", margin: "4px 0 0" }}>{file ? file.name : "Screenshot select করুন (Max 8MB)"}</p>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
          {file && (
            <button onClick={handleUpload} style={{ width: "100%", padding: "11px 0", background: "#f97316", border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              Submit করুন
            </button>
          )}
        </>
      )}
      {status === "uploading"  && <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 0", color: "#6b7280", fontSize: 13 }}><span style={{ display: "inline-block", animation: "spin 0.8s linear infinite", fontSize: 16 }}>⏳</span>Upload হচ্ছে...</div>}
      {status === "processing" && <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 0", color: "#6b7280", fontSize: 13 }}><span style={{ display: "inline-block", animation: "spin 0.8s linear infinite", fontSize: 16 }}>🔍</span>OCR দিয়ে result read হচ্ছে...</div>}
      {msg && <p style={{ fontSize: 12, color: status === "error" ? "#dc2626" : "#6b7280", marginTop: 6 }}>{msg}</p>}
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// MAIN MatchCard component
// ═════════════════════════════════════════════════════════════════════════════
const MatchCard = ({ match, onJoinSuccess }) => {
  const [showRoom,        setShowRoom]        = useState(false);
  const [showPrize,       setShowPrize]       = useState(false);
  const [showJoinModal,   setShowJoinModal]   = useState(false);
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const [inGameName,      setInGameName]      = useState("");
  const [savedGameName,   setSavedGameName]   = useState(""); // ✅ account-এ save থাকা নাম
  const [loadingName,     setLoadingName]     = useState(false); // ✅ নাম load হচ্ছে কিনা
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
  const alreadyJoined = (match.joinedUsers || []).some((u) => u.userId?.toString() === userId?.toString());

  const statusStyle = (s) => {
    if (s === "live")      return { bg: "#d1fae5", color: "#065f46", label: "🟢 Live" };
    if (s === "completed") return { bg: "#f3f4f6", color: "#374151", label: "✅ Ended" };
    return { bg: "#dbeafe", color: "#1e40af", label: "🕐 Upcoming" };
  };
  const st  = statusStyle(match.status);
  const fmt = (n) => "৳" + Number(n || 0).toLocaleString();

  // ✅ Join button click → আগে saved game name fetch করো, তারপর modal খোলো
  const openJoinModal = async () => {
    setLoadingName(true);
    setShowJoinModal(true); // modal আগেই খুলে রাখো (loading দেখাবে)
    try {
      // প্রথমে localStorage থেকে দ্রুত দেখো
      const localName = user?.inGameName || "";
      if (localName) {
        setSavedGameName(localName);
        setInGameName(localName);
      }
      // তারপর server থেকে latest নাম আনো
      const res = await fetch(`${API_BASE}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await res.json();
      const serverName = d?.user?.inGameName || d?.data?.inGameName || "";
      if (serverName) {
        setSavedGameName(serverName);
        setInGameName(serverName);
        // localStorage-ও update করো
        const stored = JSON.parse(localStorage.getItem("user") || "{}");
        localStorage.setItem("user", JSON.stringify({ ...stored, inGameName: serverName }));
      }
    } catch {
      // server না পেলে localStorage থেকে যা আছে সেটাই থাকবে
    }
    setLoadingName(false);
  };

  // ✅ Join confirm — game name save + match join
  const handleJoin = async () => {
    if (!inGameName.trim()) return;
    setJoining(true);
    try {
      // নাম পরিবর্তন হলে account-এ save করো
      if (inGameName.trim() !== savedGameName) {
        await fetch(`${API_BASE}/users/game-name`, {
          method:  "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body:    JSON.stringify({ inGameName: inGameName.trim() }),
        });
        // localStorage update
        const stored = JSON.parse(localStorage.getItem("user") || "{}");
        localStorage.setItem("user", JSON.stringify({ ...stored, inGameName: inGameName.trim() }));
        setSavedGameName(inGameName.trim());
      }

      // Match join করো
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
      <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 4px 12px rgba(0,0,0,0.08)", overflow: "hidden", marginBottom: 16, width: "100%" }}>

        {/* TOP: image + title */}
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

        {/* Progress Bar + Join Button */}
        <div style={{ padding: "0 16px 14px" }}>
          <div style={{ height: 10, background: "#e5e7eb", borderRadius: 20, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${fill}%`, background: "#22c55e", borderRadius: 20, transition: "width 0.5s" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 7 }}>
            <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 500 }}>Only {total - joined} spots left</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: "#374151", fontWeight: 700 }}>{joined}/{total}</span>
              {match.status === "upcoming" && !alreadyJoined && (
                <button onClick={openJoinModal} style={{ padding: "5px 12px", background: "#22c55e", border: "none", borderRadius: 20, color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", WebkitTapHighlightColor: "transparent", boxShadow: "0 2px 6px rgba(34,197,94,0.4)" }}>
                  Join
                </button>
              )}
              {match.status === "upcoming" && alreadyJoined && (
                <span style={{ background: "#d1fae5", color: "#065f46", fontSize: 11, padding: "4px 10px", borderRadius: 20, fontWeight: 700 }}>✅ Joined</span>
              )}
            </div>
          </div>
        </div>

        {/* Room + Prize Buttons */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "0 16px 14px" }}>
          <div>
            <button onClick={() => setShowRoom((p) => !p)} style={{ width: "100%", padding: "12px 0", border: "1.5px solid #1e40af", borderRadius: 10, background: "#fff", color: "#1e40af", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
              🔑 Room Details {showRoom ? "▲" : "▼"}
            </button>
            {showRoom && (
              <div style={{ marginTop: 6, background: "#f0f9ff", borderRadius: 8, padding: "12px", border: "1px solid #bae6fd" }}>
                {match.isRoomOpen && match.roomId ? (
                  <>
                    {mySlot && (
                      <div style={{ background: "#d1fae5", border: "1px solid #6ee7b7", borderRadius: 8, padding: "8px 12px", marginBottom: 8, textAlign: "center" }}>
                        <div style={{ fontSize: 11, color: "#065f46", fontWeight: 600 }}>আপনার Slot</div>
                        <div style={{ fontSize: 22, fontWeight: 900, color: "#065f46" }}>#{mySlot}</div>
                      </div>
                    )}
                    <div style={{ fontSize: 13, color: "#0c4a6e", marginBottom: 5 }}><b>Room ID:</b> {match.roomId}</div>
                    <div style={{ fontSize: 13, color: "#0c4a6e" }}><b>Password:</b> {match.roomPassword || "—"}</div>
                  </>
                ) : (
                  <div style={{ fontSize: 12, color: "#64748b", textAlign: "center" }}>⏳ Room details not available yet</div>
                )}
              </div>
            )}
          </div>
          <div>
            <button onClick={() => setShowPrize((p) => !p)} style={{ width: "100%", padding: "12px 0", border: "1.5px solid #1e40af", borderRadius: 10, background: "#fff", color: "#1e40af", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
              🏆 Prize Details {showPrize ? "▲" : "▼"}
            </button>
            {showPrize && (
              <div style={{ marginTop: 6, background: "#fefce8", borderRadius: 8, padding: "12px", border: "1px solid #fde68a" }}>
                {[
                  { label: "🥇 1st",   value: match.prizes?.first  || match.winPrize || 0 },
                  { label: "🥈 2nd",   value: match.prizes?.second || 0 },
                  { label: "🥉 3rd",   value: match.prizes?.third  || 0 },
                  { label: "4️⃣ 4th",  value: match.prizes?.fourth || 0 },
                  { label: "🔫 Kill",  value: match.perKill || 0 },
                  { label: "🎟 Entry", value: match.entryFee || 0 },
                ].map((p, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#92400e", paddingBottom: 4, marginBottom: 4, borderBottom: i < 5 ? "1px solid #fde68a" : "none" }}>
                    <span>{p.label}</span><b>৳{p.value}</b>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Screenshot Upload — শুধু joined user দেখবে */}
        {(match.status === "live" || match.status === "completed") && userId && alreadyJoined && (
          <ScreenshotUpload matchId={match._id} />
        )}

        {/* Footer — countdown */}
        <div onClick={() => setShowDetailSheet(true)} style={{ background: match.status === "completed" ? "#374151" : "#16a34a", padding: "14px", textAlign: "center", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", userSelect: "none", WebkitTapHighlightColor: "transparent", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          {match.status === "completed" ? <span>✅ Match শেষ হয়েছে</span>
            : isStarted ? <><span>কাস্টম Ready 🔑 Room Details থেকে নিন</span><span style={{ fontSize: 11, opacity: 0.8, marginLeft: 4 }}>ℹ️ Details</span></>
            : <><span>⏰ STARTS IN — <TimeLeft startTime={match.startTime} /></span><span style={{ fontSize: 11, opacity: 0.8, marginLeft: 4 }}>ℹ️ Details</span></>}
        </div>
      </div>

      {/* Toast */}
      {joinMsg && (
        <div style={{ position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)", background: joinMsg.startsWith("✅") ? "#059669" : "#dc2626", color: "#fff", padding: "10px 20px", borderRadius: 20, fontWeight: 600, fontSize: 13, zIndex: 9999, whiteSpace: "nowrap" }}>
          {joinMsg}
        </div>
      )}

      {/* Match Detail Bottom Sheet */}
      {showDetailSheet && <MatchDetailSheet match={match} onClose={() => setShowDetailSheet(false)} />}

      {/* ✅ JOIN MODAL — Game Name Auto-fill সহ */}
      {showJoinModal && (
        <div onClick={() => { setShowJoinModal(false); setInGameName(""); }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 20px" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 360, overflow: "hidden" }}>

            {/* Modal Header */}
            <div style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)", padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ color: "#fff", fontWeight: 800, fontSize: 16 }}>🎮 Match Join করুন</div>
                <div style={{ color: "#dcfce7", fontSize: 12, marginTop: 2 }}>{match.title}</div>
              </div>
              <button onClick={() => { setShowJoinModal(false); setInGameName(""); }} style={{ background: "rgba(255,255,255,0.25)", border: "none", borderRadius: "50%", width: 30, height: 30, color: "#fff", fontSize: 15, cursor: "pointer" }}>✕</button>
            </div>

            <div style={{ padding: "20px" }}>
              {/* Entry fee notice */}
              <div style={{ background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#92400e", textAlign: "center", fontWeight: 600 }}>
                ৳{match.entryFee} আপনার wallet থেকে কাটা হবে
              </div>

              {/* Game Name Label */}
              <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>
                🎯 Free Fire In-Game Name
              </label>

              {/* Loading state */}
              {loadingName ? (
                <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 10, padding: "12px 14px", marginBottom: 8, fontSize: 13, color: "#9ca3af", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ display: "inline-block", animation: "spin 0.8s linear infinite" }}>⏳</span>
                  আপনার সেভ করা নাম লোড হচ্ছে...
                </div>
              ) : (
                <>
                  {/* ✅ Saved name auto-fill notice */}
                  {savedGameName && inGameName === savedGameName && (
                    <div style={{ background: "#dbeafe", border: "1px solid #93c5fd", borderRadius: 8, padding: "7px 12px", marginBottom: 8, fontSize: 12, color: "#1e40af", display: "flex", alignItems: "center", gap: 6 }}>
                      ✅ আগে সেভ করা নাম auto-fill হয়েছে
                    </div>
                  )}

                  {/* Input */}
                  <input
                    type="text"
                    placeholder="আপনার in-game username লিখুন"
                    value={inGameName}
                    onChange={(e) => setInGameName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && inGameName.trim() && handleJoin()}
                    style={{ width: "100%", padding: "12px 14px", border: "1.5px solid #e5e7eb", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 4 }}
                    autoFocus={!savedGameName}
                  />

                  {/* ✅ নাম পরিবর্তন করলে save হবে জানানো */}
                  {inGameName.trim() && inGameName.trim() !== savedGameName && (
                    <div style={{ fontSize: 12, color: "#059669", marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>
                      💾 এই নামটি আপনার account-এ save হবে
                    </div>
                  )}
                </>
              )}

              <div style={{ marginBottom: 16 }} />

              {/* Buttons */}
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => { setShowJoinModal(false); setInGameName(""); }} style={{ flex: 1, padding: "11px 0", border: "1.5px solid #e5e7eb", borderRadius: 10, background: "#fff", color: "#374151", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                  বাতিল
                </button>
                <button
                  onClick={handleJoin}
                  disabled={!inGameName.trim() || joining || loadingName}
                  style={{ flex: 1, padding: "11px 0", background: inGameName.trim() && !joining && !loadingName ? "#22c55e" : "#86efac", border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, fontSize: 13, cursor: inGameName.trim() && !joining && !loadingName ? "pointer" : "not-allowed" }}
                >
                  {joining ? "⏳ Joining..." : "✅ Confirm Join"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes slideUp { from{transform:translateY(40px);opacity:0} to{transform:translateY(0);opacity:1} } @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </>
  );
};

export default MatchCard;