 // LudoTournamentPage.jsx

import { useState, useEffect } from "react";
import LudoScreenshotUpload from "../../Component/LudoScreenshotupload/Ludoscreenshotupload";
 

// ── Countdown Timer ─────────────────────────────────────────────────────────
const LudoCountdown = ({ startTime }) => {
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

const LUDO_RULES = [
  "ম্যাচ শুরুর আগে Room Code নিয়ে রুমে ঢুকতে হবে",
  "নির্ধারিত সময়ের মধ্যে রুমে না ঢুকলে match miss হিসেবে গণ্য হবে",
  "হ্যাক/চিট ব্যবহার করলে সরাসরি ব্যান করা হবে",
  "ম্যাচ শেষে অবশ্যই ফলাফলের Screenshot submit করতে হবে",
  "স্ক্রিনশট স্পষ্ট ও সম্পূর্ণ হতে হবে (result screen সহ)",
  "বিতর্কে Admin এর সিদ্ধান্ত চূড়ান্ত বলে গণ্য হবে",
];

// ─── Ludo Tournament Page ─────────────────────────────────────────────────────
function LudoTournamentPage({ currentUser, token, onBack, onRefreshBalance, CLEAN_API_URL }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("upcoming");
  const [joining, setJoining] = useState(null);
  const [msg, setMsg] = useState("");

  // প্রতি match এর জন্য আলাদা expand state
  const [expandedPlayers, setExpandedPlayers] = useState({});
  const [expandedRules, setExpandedRules] = useState({});
  const [playerDetails, setPlayerDetails] = useState({});
  const [loadingPlayers, setLoadingPlayers] = useState({});

  useEffect(() => { loadMatches(); }, [filter]);

  const loadMatches = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${CLEAN_API_URL}/ludo-tournament?status=${filter}`);
      const data = await res.json();
      setMatches(Array.isArray(data?.data) ? data.data : []);
    } catch {
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  // Player list load করা (single match detail থেকে joinedUsers আসে)
  const togglePlayers = async (matchId) => {
    setExpandedPlayers((p) => ({ ...p, [matchId]: !p[matchId] }));
    if (!playerDetails[matchId]) {
      setLoadingPlayers((p) => ({ ...p, [matchId]: true }));
      try {
        const res = await fetch(`${CLEAN_API_URL}/ludo-tournament/${matchId}`);
        const data = await res.json();
        if (data.success) {
          setPlayerDetails((p) => ({ ...p, [matchId]: data.data.joinedUsers || [] }));
        }
      } catch {}
      setLoadingPlayers((p) => ({ ...p, [matchId]: false }));
    }
  };

  const toggleRules = (matchId) => {
    setExpandedRules((p) => ({ ...p, [matchId]: !p[matchId] }));
  };

  const [joinTarget, setJoinTarget] = useState(null); // { matchId, entryFee }
  const [gameName, setGameName] = useState("");

  const openJoinModal = (matchId, entryFee) => {
    if (!currentUser?.id && !currentUser?._id) { setMsg("আগে login করুন"); return; }
    setGameName("");
    setJoinTarget({ matchId, entryFee });
  };

  const confirmJoin = async () => {
    if (!gameName || gameName.trim().length < 3) {
      setMsg("❌ সঠিক In-Game Name দিন (কমপক্ষে ৩ অক্ষর)");
      return;
    }
    const { matchId } = joinTarget;
    setJoining(matchId);
    setMsg("");
    setJoinTarget(null);
    try {
      const res = await fetch(`${CLEAN_API_URL}/ludo-tournament/join/${matchId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ inGameName: gameName.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg(`✅ Join সফল! Slot #${data.slotNumber}`);
        const stored = JSON.parse(localStorage.getItem("user") || "{}");
        localStorage.setItem("user", JSON.stringify({ ...stored, balance: data.newBalance ?? stored.balance }));
        if (onRefreshBalance) onRefreshBalance();
        loadMatches();
      } else {
        setMsg("❌ " + (data.message || "Join failed"));
      }
    } catch {
      setMsg("❌ Server error");
    } finally {
      setJoining(null);
    }
  };

  const FILTERS = [{ id: "upcoming", label: "🕐 Upcoming" }, { id: "live", label: "🔴 Live" }, { id: "completed", label: "✅ Done" }];
  const modeLabel = { "1v1": "⚔️ 1v1", "2v2": "👥 2v2", "4player": "🎮 4 Player" };
  const modeColor = { "1v1": "#f59e0b", "2v2": "#3b82f6", "4player": "#10b981" };

  return (
    <div className="min-h-screen bg-[#0a0e1a] pb-24">
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-4 pt-5 pb-5">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={onBack} className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center text-white text-lg active:scale-95">←</button>
          <div>
            <h1 className="text-white text-xl font-extrabold">🎲 Ludo Tournament</h1>
            <p className="text-violet-200 text-xs mt-0.5">Play & Win Real Cash</p>
          </div>
        </div>
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button key={f.id} onClick={() => setFilter(f.id)} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${filter === f.id ? "bg-white text-violet-600" : "bg-white/15 text-white/70"}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {msg && (
        <div className={`mx-4 mt-3 p-3 rounded-xl text-sm font-semibold text-center ${msg.startsWith("✅") ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"}`}>
          {msg}
        </div>
      )}

      <div className="px-4 mt-4 space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 text-sm">Loading tournaments...</p>
          </div>
        ) : matches.length === 0 ? (
          <div className="bg-[#111827] rounded-2xl p-10 text-center border border-white/5">
            <p className="text-4xl mb-3">🎲</p>
            <p className="text-white font-bold mb-1">কোনো Tournament নেই</p>
            <p className="text-gray-500 text-sm">এই category তে এখন কোনো match নেই</p>
          </div>
        ) : (
          matches.map((match) => {
            const mc = modeColor[match.mode] || "#6b7280";
            const isFull = (match.joinedPlayers || 0) >= (match.totalSlots || 4);
            const isJoined = match.joinedUsers?.some(
              (u) => (u.userId?._id || u.userId) === (currentUser?.id || currentUser?._id)
            );
            const started = match.startTime ? new Date(match.startTime).getTime() <= Date.now() : false;

            return (
              <div key={match._id} className="bg-[#111827] border border-white/5 rounded-2xl overflow-hidden">
                <div style={{ height: 3, background: mc }} />
                {match.image && <img src={match.image} alt="" className="w-full h-28 object-cover" />}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span style={{ background: mc + "22", color: mc, fontSize: 10, padding: "2px 8px", borderRadius: 20, fontWeight: 700, border: `1px solid ${mc}55` }}>
                          {modeLabel[match.mode] || match.mode}
                        </span>
                        {match.status === "live" && (
                          <span className="flex items-center gap-1 text-[10px] text-red-400 font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />LIVE
                          </span>
                        )}
                      </div>
                      <p className="text-white font-bold text-base">{match.title}</p>
                      <p className="text-gray-500 text-xs mt-0.5">🗺️ {match.map || "Classic"} • 📱 {match.device || "Mobile"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-400 text-xs">Entry</p>
                      <p className="text-white font-black text-lg">৳{match.entryFee || 0}</p>
                    </div>
                  </div>

                  {/* Countdown */}
                  {match.status !== "completed" && (
                    <div className="bg-black/30 rounded-xl p-3 mb-3 flex items-center gap-2">
                      <span className="text-lg">⏰</span>
                      <div>
                        <p className="text-[10px] text-gray-500 font-semibold uppercase">
                          {started ? "ম্যাচ চলছে" : "শুরু হতে বাকি"}
                        </p>
                        <p className="text-sm font-bold text-yellow-400">
                          {started ? "🟢 Live" : <LudoCountdown startTime={match.startTime} />}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {[
                      { label: "Prize", value: `৳${match.winPrize || 0}`, color: "#f59e0b" },
                      { label: "Players", value: `${match.joinedPlayers || 0}/${match.totalSlots || 4}`, color: isFull ? "#ef4444" : "#22d3ee" },
                      { label: "Start", value: match.startTime ? new Date(match.startTime).toLocaleTimeString("en-BD", { hour: "2-digit", minute: "2-digit", hour12: true }) : "—", color: "#a78bfa" },
                    ].map((s, i) => (
                      <div key={i} className="bg-black/30 rounded-xl p-2 text-center">
                        <p className="text-[9px] text-gray-500 font-semibold uppercase">{s.label}</p>
                        <p className="text-xs font-black mt-0.5" style={{ color: s.color }}>{s.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Player List + Rules toggle buttons */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <button
                      onClick={() => togglePlayers(match._id)}
                      className="py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-bold"
                    >
                      👥 Players {expandedPlayers[match._id] ? "▲" : "▼"}
                    </button>
                    <button
                      onClick={() => toggleRules(match._id)}
                      className="py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-bold"
                    >
                      📋 Rules {expandedRules[match._id] ? "▲" : "▼"}
                    </button>
                  </div>

                  {/* Player List Expand */}
                  {expandedPlayers[match._id] && (
                    <div className="bg-black/30 rounded-xl p-3 mb-3">
                      {loadingPlayers[match._id] ? (
                        <p className="text-gray-500 text-xs text-center py-2">লোড হচ্ছে...</p>
                      ) : (playerDetails[match._id] || []).length === 0 ? (
                        <p className="text-gray-500 text-xs text-center py-2">এখনো কেউ join করেনি</p>
                      ) : (
                        <div className="space-y-1.5">
                          {playerDetails[match._id].map((p, i) => (
                            <div key={i} className="flex items-center justify-between text-xs">
                              <span className="text-white font-semibold">{p.inGameName || "—"}</span>
                              <span className="text-gray-500">Slot #{p.slotNumber}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Rules Expand */}
                  {expandedRules[match._id] && (
                    <div className="bg-black/30 rounded-xl p-3 mb-3 space-y-1.5">
                      {LUDO_RULES.map((r, i) => (
                        <p key={i} className="text-gray-300 text-xs">• {r}</p>
                      ))}
                    </div>
                  )}

                  {/* Room Code (live) */}
                  {match.status === "live" && match.roomCode && (
                    <div className="bg-violet-500/10 border border-violet-500/30 rounded-xl p-3 mb-3 flex items-center justify-between">
                      <div>
                        <p className="text-violet-300 text-[10px] font-bold uppercase">Room Code</p>
                        <p className="text-white font-black text-lg tracking-widest">{match.roomCode}</p>
                      </div>
                      <button onClick={() => { navigator.clipboard.writeText(match.roomCode); setMsg("✅ Room code copied!"); }} className="bg-violet-500/20 text-violet-300 text-xs px-3 py-1.5 rounded-lg font-bold active:scale-95">
                        Copy
                      </button>
                    </div>
                  )}

                  {/* Join button (upcoming) */}
                  {match.status === "upcoming" && (
                    isJoined ? (
                      <div className="w-full py-3 rounded-xl bg-green-500/15 text-green-400 text-sm font-bold text-center border border-green-500/20">✅ Already Joined</div>
                    ) : isFull ? (
                      <div className="w-full py-3 rounded-xl bg-red-500/15 text-red-400 text-sm font-bold text-center border border-red-500/20">❌ Full</div>
                    ) : (
                      <button onClick={() => openJoinModal(match._id, match.entryFee)} disabled={joining === match._id} className="w-full py-3 rounded-xl font-black text-sm text-white active:scale-95 transition-all disabled:opacity-60" style={{ background: `linear-gradient(135deg, ${mc}, #4f46e5)` }}>
                        {joining === match._id ? "Joining..." : `Join Now • ৳${match.entryFee}`}
                      </button>
                    )
                  )}

                  {/* Result Screenshot Upload — join করা user এর জন্য, live/completed অবস্থায় */}
                  {(match.status === "live" || match.status === "completed") && isJoined && token && (
                    <div className="mt-3">
                      <LudoScreenshotUpload matchId={match._id} matchStatus={match.status} />
                    </div>
                  )}

                  {match.status === "completed" && !isJoined && (
                    <div className="w-full py-3 rounded-xl bg-gray-500/10 text-gray-400 text-sm font-bold text-center border border-gray-500/20">✅ Completed</div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Join Modal */}
      {joinTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ background: "#fff", padding: 24, borderRadius: 16, width: "90%", maxWidth: 400 }}>
            <h3 style={{ marginBottom: 8 }}>In-Game Name দিন</h3>
            <input
              type="text"
              placeholder="যেমন: SapnilFF, RahulOP"
              value={gameName}
              onChange={(e) => setGameName(e.target.value)}
              style={{ width: "100%", padding: 14, borderRadius: 10, border: "1.5px solid #e5e7eb", fontSize: 16, marginBottom: 20, boxSizing: "border-box" }}
              autoFocus
            />
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setJoinTarget(null)} style={{ flex: 1, padding: 14, background: "#e5e7eb", border: "none", borderRadius: 10, fontWeight: 600 }}>
                Cancel
              </button>
              <button onClick={confirmJoin} style={{ flex: 1, padding: 14, background: "#10b981", color: "white", border: "none", borderRadius: 10, fontWeight: 700 }}>
                Join Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LudoTournamentPage;