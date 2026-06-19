 import React, { useState, useEffect } from "react";

// ── Category Rules (একই রাখা হয়েছে) ─────────────────────────────────────
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
  return CATEGORY_RULES[key] || { title: "Match Rules", rules: ["হ্যাক/চিট ব্যবহারে সরাসরি DQ", "স্ক্রিনশট প্রমাণ জমা দিতে হবে", "বিতর্কে হোস্টের সিদ্ধান্ত চূড়ান্ত"] };
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

// Countdown Component
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

// Main MatchDetailSheet
const MatchDetailSheet = ({ match, onClose }) => {
  if (!match) return null;

  const user   = (() => { try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; } })();
  const userId = user?.id || user?._id;

  const isStarted = match.startTime ? new Date(match.startTime).getTime() <= Date.now() : false;
  const joined    = Number(match.joinedPlayers || 0);
  const total     = Number(match.totalPlayers || 0);
  const rules     = getMatchRules(match.category);

  const players = [...(match.joinedUsers || [])].sort((a, b) => (a.slotNumber || 0) - (b.slotNumber || 0));

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1100, display: "flex", alignItems: "flex-end" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", width: "100%", maxWidth: 460, maxHeight: "88vh", borderRadius: "20px 20px 0 0", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        
        {/* Drag Handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
          <div style={{ width: 40, height: 4, borderRadius: 4, background: "#e5e7eb" }} />
        </div>

        {/* Header */}
        <div style={{ padding: "0 20px 14px", borderBottom: "1px solid #f3f4f6" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#111" }}>{match.title}</h2>
            <button onClick={onClose} style={{ background: "#f3f4f6", border: "none", borderRadius: "50%", width: 32, height: 32, color: "#374151" }}>✕</button>
          </div>
          <div style={{ marginTop: 8 }}>
            <span style={{ background: "#dbeafe", color: "#1e40af", padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
              {MODE_LABEL[match.category] || (match.category || "").toUpperCase()}
            </span>
          </div>
        </div>

        {/* Content */}
        <div style={{ overflowY: "auto", padding: "16px 20px", flex: 1 }}>

          {/* Match Schedule & Status */}
          <div style={{ background: "linear-gradient(135deg, #0c4a6e, #0369a1)", color: "#fff", borderRadius: 14, padding: "14px 16px", marginBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ fontSize: 28 }}>📅</div>
              <div>
                <div style={{ fontSize: 11, opacity: 0.8, fontWeight: 600 }}>MATCH SCHEDULE</div>
                <div style={{ fontSize: 15, fontWeight: 800, marginTop: 2 }}>
                  {match.startTime ? new Date(match.startTime).toLocaleString("en-BD", {
                    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true
                  }) : "—"}
                </div>
                <div style={{ marginTop: 4, fontSize: 13 }}>
                  {match.status === "completed" ? "✅ ম্যাচ শেষ" 
                    : isStarted ? "🟢 লাইভ চলছে" 
                    : <>⏰ বাকি — <Countdown startTime={match.startTime} /></>}
                </div>
              </div>
            </div>
          </div>

          {/* Prize & Entry Info */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            <div style={{ background: "#fefce8", padding: "12px", borderRadius: 12, textAlign: "center", border: "1px solid #fde68a" }}>
              <div style={{ fontSize: 11, color: "#92400e", fontWeight: 700 }}>WIN PRIZE</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#92400e" }}>{fmt(match.winPrize)}</div>
            </div>
            <div style={{ background: "#fef2f2", padding: "12px", borderRadius: 12, textAlign: "center", border: "1px solid #fecaca" }}>
              <div style={{ fontSize: 11, color: "#991b1b", fontWeight: 700 }}>ENTRY FEE</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#991b1b" }}>{fmt(match.entryFee)}</div>
            </div>
          </div>

          {/* Room Details */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>🔑 Room Details</div>
            <div style={{ background: "#f0f9ff", padding: "14px", borderRadius: 10, border: "1px solid #bae6fd" }}>
              {match.isRoomOpen && match.roomId ? (
                <>
                  <div><b>Room ID:</b> {match.roomId}</div>
                  <div><b>Password:</b> {match.roomPassword || "নেই"}</div>
                </>
              ) : (
                <div style={{ color: "#64748b" }}>⏳ Room details এখনো আসেনি</div>
              )}
            </div>
          </div>

          {/* Joined Players */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>👥 Joined Players ({joined}/{total})</div>
            {players.length > 0 ? (
              <div style={{ maxHeight: 200, overflowY: "auto", border: "1px solid #f3f4f6", borderRadius: 10 }}>
                {players.map((p, i) => {
                  const isMe = p.userId?.toString() === userId?.toString();
                  return (
                    <div key={i} style={{ padding: "10px 14px", borderBottom: i < players.length - 1 ? "1px solid #f3f4f6" : "none", background: isMe ? "#f0fdf4" : "transparent" }}>
                      <span style={{ fontWeight: isMe ? 700 : 500 }}>
                        {p.inGameName || p.gameName || "—"} {isMe && <span style={{ color: "#16a34a" }}>(আপনি)</span>}
                      </span>
                      <span style={{ float: "right", background: "#fef3c7", color: "#92400e", padding: "2px 8px", borderRadius: 20, fontSize: 12 }}>Slot #{p.slotNumber}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "20px", color: "#9ca3af" }}>এখনো কেউ জয়েন করেনি</div>
            )}
          </div>

          {/* Rules */}
          <div>
            <div style={{ fontWeight: 700, marginBottom: 10 }}>📋 {rules.title}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {rules.rules.map((rule, i) => (
                <div key={i} style={{ display: "flex", gap: 10, fontSize: 13.5, lineHeight: 1.5 }}>
                  <span style={{ color: "#ef4444", fontWeight: 700 }}>{i + 1}.</span>
                  <span>{rule}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchDetailSheet;