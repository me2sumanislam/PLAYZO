 import React, { useState, useEffect } from "react";

// ── Category → Rules mapping (same source data MatchCard.jsx already defines) ──
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

const fmt = (n) => "৳" + Number(n || 0).toLocaleString();

const MODE_LABEL = {
  br_solo: "Battle Royale Solo",
  br_duo: "Battle Royale Duo",
  br_squad: "Battle Royale Squad",
  cs_solo: "Clash Squad Solo",
  cs_duo: "Clash Squad Duo",
  cs_squad: "Clash Squad",
  cs_6vs6: "Clash Squad 6vs6",
  lw_solo: "Lone Wolf Solo",
  lw_duo: "Lone Wolf Duo",
  free_match: "Free Match",
};

// ── Inline countdown (self-contained — no dependency on MatchCard.jsx) ─────────
const Countdown = ({ startTime }) => {
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

// ═════════════════════════════════════════════════════════════════════════════
// MatchDetailSheet — bottom sheet showing full match info, room, prize,
// joined players list ও category-wise rules
// ═════════════════════════════════════════════════════════════════════════════
const MatchDetailSheet = ({ match, onClose }) => {
  if (!match) return null;

  const user   = (() => { try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; } })();
  const userId = user?.id || user?._id;

  const isStarted   = match.startTime ? new Date(match.startTime).getTime() <= Date.now() : false;
  const joined      = Number(match.joinedPlayers || 0);
  const total       = Number(match.totalPlayers || 0);
  const isTeamMatch = match.matchType === "team" && (match.teamSize || 1) > 1;
  const rules       = getMatchRules(match.category);

  const players = [...(match.joinedUsers || [])].sort(
    (a, b) => (a.slotNumber || 0) - (b.slotNumber || 0)
  );

  const statusBadge = (() => {
    if (match.status === "completed") return { bg: "#f3f4f6", color: "#374151", label: "✅ Ended" };
    if (match.status === "live" || isStarted) return { bg: "#d1fae5", color: "#065f46", label: "🟢 Live" };
    return { bg: "#dbeafe", color: "#1e40af", label: "🕐 Upcoming" };
  })();

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1100, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "#fff", width: "100%", maxWidth: 450, maxHeight: "88vh", borderRadius: "20px 20px 0 0", overflow: "hidden", display: "flex", flexDirection: "column", animation: "sheetUp 0.25s ease-out" }}
      >
        {/* Drag handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 0" }}>
          <div style={{ width: 40, height: 4, borderRadius: 4, background: "#e5e7eb" }} />
        </div>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "10px 20px 14px", borderBottom: "1px solid #f3f4f6" }}>
          <div style={{ flex: 1, paddingRight: 10 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#111", lineHeight: 1.3 }}>{match.title}</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 7 }}>
              <span style={{ background: statusBadge.bg, color: statusBadge.color, fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: 700 }}>{statusBadge.label}</span>
              <span style={{ background: "#f3f4f6", color: "#374151", fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: 700 }}>
                {MODE_LABEL[match.category] || (match.category || "").toUpperCase()}
              </span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "#f3f4f6", border: "none", borderRadius: "50%", width: 32, height: 32, color: "#374151", fontSize: 15, cursor: "pointer", flexShrink: 0, WebkitTapHighlightColor: "transparent" }}>✕</button>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: "auto", padding: "16px 20px 20px" }}>

          {/* Countdown / status strip */}
          <div style={{ background: match.status === "completed" ? "#f3f4f6" : "#f0fdf4", border: `1px solid ${match.status === "completed" ? "#e5e7eb" : "#bbf7d0"}`, borderRadius: 10, padding: "10px 14px", textAlign: "center", fontSize: 13, fontWeight: 700, color: match.status === "completed" ? "#374151" : "#16a34a", marginBottom: 16 }}>
            {match.status === "completed"
              ? "✅ ম্যাচ শেষ হয়েছে"
              : isStarted
                ? "🟢 ম্যাচ লাইভ — Room Details দেখুন"
                : <>⏰ শুরু হতে বাকি — <Countdown startTime={match.startTime} /></>}
          </div>

          {/* Quick info grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", rowGap: 14, marginBottom: 18 }}>
            {[
              { label: "MAP",     value: match.map || "Bermuda" },
              { label: "VERSION", value: (match.device || "Mobile").toUpperCase() },
              { label: "PLAYERS", value: `${joined}/${total}` },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: i % 3 === 0 ? "left" : i % 3 === 1 ? "center" : "right" }}>
                <div style={{ fontSize: 10, color: "#777", fontWeight: 700, letterSpacing: 0.5 }}>{s.label}</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#111", marginTop: 3 }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Start time */}
          <div style={{ fontSize: 13, color: "#374151", marginBottom: 18 }}>
            <b>🗓 Start Time:</b>{" "}
            {match.startTime
              ? new Date(match.startTime).toLocaleString("en-BD", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true })
              : "—"}
          </div>

          {/* Prize section */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#111", marginBottom: 8 }}>🏆 Prize Details</div>
            <div style={{ background: "#fefce8", borderRadius: 10, padding: "12px 14px", border: "1px solid #fde68a" }}>
              {[
                { label: "🥇 1st",   value: match.prizes?.first  || match.winPrize || 0 },
                { label: "🥈 2nd",   value: match.prizes?.second || 0 },
                { label: "🥉 3rd",   value: match.prizes?.third  || 0 },
                { label: "4️⃣ 4th",  value: match.prizes?.fourth || 0 },
                { label: "🔫 Per Kill", value: match.perKill || 0 },
                ...(isTeamMatch ? [{ label: "👥 Prize Pool", value: match.prizePool || 0 }] : []),
                { label: "🎟 Entry Fee", value: match.entryFee || 0 },
              ].map((p, i, arr) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#92400e", paddingBottom: 6, marginBottom: 6, borderBottom: i < arr.length - 1 ? "1px solid #fde68a" : "none" }}>
                  <span>{p.label}</span><b>৳{p.value}</b>
                </div>
              ))}
            </div>
          </div>

          {/* Room details */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#111", marginBottom: 8 }}>🔑 Room Details</div>
            <div style={{ background: "#f0f9ff", borderRadius: 10, padding: "12px 14px", border: "1px solid #bae6fd" }}>
              {match.isRoomOpen && match.roomId ? (
                <>
                  <div style={{ fontSize: 13, color: "#0c4a6e", marginBottom: 5 }}><b>Room ID:</b> {match.roomId}</div>
                  <div style={{ fontSize: 13, color: "#0c4a6e" }}><b>Password:</b> {match.roomPassword || "—"}</div>
                </>
              ) : (
                <div style={{ fontSize: 12, color: "#64748b", textAlign: "center" }}>⏳ Room details এখনো দেওয়া হয়নি</div>
              )}
            </div>
          </div>

          {/* Joined players */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#111", marginBottom: 8 }}>👥 Joined Players ({joined}/{total})</div>
            {players.length > 0 ? (
              <div style={{ maxHeight: 180, overflowY: "auto", border: "1px solid #f3f4f6", borderRadius: 10 }}>
                {players.map((p, i) => {
                  const isMe = p.userId?.toString?.() === userId?.toString?.();
                  return (
                    <div
                      key={i}
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 14px", fontSize: 13, background: isMe ? "#f0fdf4" : i % 2 === 0 ? "#fff" : "#fafafa", borderBottom: i < players.length - 1 ? "1px solid #f3f4f6" : "none" }}
                    >
                      <span style={{ color: "#374151", fontWeight: isMe ? 700 : 500 }}>
                        {p.inGameName || p.gameName || "—"} {isMe && <span style={{ color: "#16a34a" }}>(আপনি)</span>}
                      </span>
                      <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        {isTeamMatch && (
                          <span style={{ background: "#dbeafe", color: "#1e40af", fontSize: 10, padding: "2px 7px", borderRadius: 20, fontWeight: 700 }}>Team {p.team || "A"}</span>
                        )}
                        <span style={{ background: "#fef3c7", color: "#92400e", fontSize: 10, padding: "2px 7px", borderRadius: 20, fontWeight: 700 }}>#{p.slotNumber}</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ fontSize: 12, color: "#9ca3af", textAlign: "center", padding: "10px 0" }}>এখনো কেউ join করেনি</div>
            )}
          </div>

          {/* Rules */}
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#111", marginBottom: 8 }}>📜 {rules.title}</div>
            <ol style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 7 }}>
              {rules.rules.map((r, i) => (
                <li key={i} style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{r}</li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      <style>{`@keyframes sheetUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
    </div>
  );
};

export default MatchDetailSheet;