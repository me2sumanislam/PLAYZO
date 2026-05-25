
 import React, { useState, useEffect, useCallback } from "react";
import BottomMenu from "../BottomMenu/BottomMenu";
import NotificationBell from "../NotificationBell/NotificationBell";
import Profile from "../../page/Profile/profile";
import Wallet from "../../page/Wallet/Wallet";
import MatchList from "../../page/MatchList/MatchList";
import Withdraw from "../../page/Withdraw/Withdraw";
import AllRulesPage from "../AllRulesPage/AllRulesPage";
import AccountInfo from "../../page/AccountInfo/AccountInfo";
import MyMatch from "../../page/MyMatch/MyMatch";
import Leaderboard from "../../page/Leaderboard/Leaderboard";

// ─── Inline MatchResults Component ────────────────────────────────────────────

const PRIZE_CONFIG = { first: 60, second: 40, third: 20 };

function getRankMeta(rank) {
  if (rank === 1)
    return {
      icon: "🏆",
      text: "text-yellow-400",
      bg: "bg-yellow-500/20",
      border: "border-yellow-500/30",
      label: "BOOYAH!",
    };
  if (rank === 2)
    return {
      icon: "🥈",
      text: "text-gray-300",
      bg: "bg-gray-500/20",
      border: "border-gray-400/30",
      label: "2nd Place",
    };
  if (rank === 3)
    return {
      icon: "🥉",
      text: "text-orange-400",
      bg: "bg-orange-500/20",
      border: "border-orange-500/30",
      label: "3rd Place",
    };
  return null;
}

function MatchResultsPage({
  matchId,
  matchTitle,
  killPrice,
  results,
  publishedAt,
  mapName,
  currentUserUid,
}) {
  const [tab, setTab] = useState("leaderboard");

  const sorted = [...(results || [])].sort((a, b) => {
    if (b.totalPrize !== a.totalPrize) return b.totalPrize - a.totalPrize;
    return (a.rank || 999) - (b.rank || 999);
  });

  const myResult = results?.find((r) => r.uid === currentUserUid);

  return (
    <div className="min-h-screen bg-[#0a0e1a] pb-24">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/10 to-transparent pointer-events-none" />
        <div className="px-4 pt-6 pb-4 relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-green-400 text-xs font-semibold uppercase tracking-widest">
              Result Live
            </span>
          </div>
          <h1 className="text-white text-2xl font-extrabold">
            {matchTitle || "Match Result"}
          </h1>
          <div className="flex items-center gap-3 mt-1 text-gray-500 text-xs flex-wrap">
            {mapName && <span>🗺️ {mapName}</span>}
            {killPrice && (
              <>
                <span>•</span>
                <span>⚔️ Kill: ৳{killPrice}</span>
              </>
            )}
            {publishedAt && (
              <>
                <span>•</span>
                <span>{new Date(publishedAt).toLocaleDateString("en-BD")}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Top 3 Podium */}
      {sorted.length >= 1 && (
        <div className="px-4 mb-4">
          <div className="flex items-end justify-center gap-2">
            {sorted[1] && (
              <div className="flex-1 bg-[#111827] border border-gray-400/20 rounded-2xl p-3 text-center pb-4">
                <p className="text-2xl mb-1">🥈</p>
                <p className="text-white text-xs font-bold truncate">
                  {sorted[1].playerName}
                </p>
                <p className="text-gray-400 text-[10px]">
                  {sorted[1].kills} kills
                </p>
                <p className="text-gray-200 text-sm font-black mt-1">
                  &nbsp;৳{sorted[1].totalPrize}
                </p>
              </div>
            )}
            {sorted[0] && (
              <div className="flex-1 bg-[#111827] border border-yellow-500/30 rounded-2xl p-3 text-center pb-6 -mb-2 shadow-lg shadow-yellow-500/10">
                <p className="text-3xl mb-1">🏆</p>
                <p className="text-yellow-400 text-xs font-extrabold truncate">
                  {sorted[0].playerName}
                </p>
                <p className="text-gray-400 text-[10px]">
                  {sorted[0].kills} kills
                </p>
                <p className="text-yellow-400 text-base font-black mt-1">
                  ৳{sorted[0].totalPrize}
                </p>
              </div>
            )}
            {sorted[2] && (
              <div className="flex-1 bg-[#111827] border border-orange-500/20 rounded-2xl p-3 text-center pb-4">
                <p className="text-2xl mb-1">🥉</p>
                <p className="text-white text-xs font-bold truncate">
                  {sorted[2].playerName}
                </p>
                <p className="text-gray-400 text-[10px]">
                  {sorted[2].kills} kills
                </p>
                <p className="text-orange-300 text-sm font-black mt-1">
                  ৳{sorted[2].totalPrize}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="px-4 mb-3">
        <div className="flex bg-[#111827] rounded-xl p-1 border border-white/5">
          {[
            { key: "leaderboard", label: "Leaderboard" },
            { key: "mine", label: "My Result" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${tab === t.key ? "bg-orange-500 text-white" : "text-gray-400"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      {tab === "leaderboard" && (
        <div className="px-4 space-y-2">
          {sorted.length === 0 && (
            <div className="bg-[#111827] rounded-2xl p-8 text-center border border-white/5">
              <p className="text-gray-500 text-sm">No results yet</p>
            </div>
          )}
          {sorted.map((player, idx) => {
            const isMe = player.uid === currentUserUid;
            return (
              <div
                key={player.uid + idx}
                className={`rounded-2xl p-4 border ${isMe ? "bg-orange-500/10 border-orange-500/30" : "bg-[#111827] border-white/5"}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${
                      idx === 0
                        ? "bg-yellow-500/20 text-yellow-400"
                        : idx === 1
                          ? "bg-gray-500/20 text-gray-300"
                          : idx === 2
                            ? "bg-orange-500/20 text-orange-400"
                            : "bg-white/5 text-gray-500"
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p
                        className={`font-bold text-sm truncate ${isMe ? "text-orange-400" : "text-white"}`}
                      >
                        {player.playerName}
                      </p>
                      {isMe && (
                        <span className="text-[10px] bg-orange-500 text-white px-1.5 py-0.5 rounded-full shrink-0">
                          YOU
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-gray-500 mt-0.5">
                      {player.rank && <span>#{player.rank} Rank</span>}
                      <span>⚔️ {player.kills} kills</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className={`font-black text-base ${player.totalPrize > 0 ? "text-green-400" : "text-gray-600"}`}
                    >
                      {player.totalPrize > 0 ? `+৳${player.totalPrize}` : "—"}
                    </p>
                    {player.totalPrize > 0 && (
                      <p className="text-[10px] text-gray-600 mt-0.5">
                        credited
                      </p>
                    )}
                  </div>
                </div>
                {player.totalPrize > 0 && (
                  <div className="mt-3 flex gap-2 flex-wrap">
                    {player.rankPrize > 0 && (
                      <span className="text-[11px] bg-yellow-500/10 text-yellow-400 px-2 py-0.5 rounded-full border border-yellow-500/20">
                        Rank ৳{player.rankPrize}
                      </span>
                    )}
                    {player.killEarning > 0 && (
                      <span className="text-[11px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full border border-green-500/20">
                        ⚔️ {player.kills} kills ৳{player.killEarning}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* My Result */}
      {tab === "mine" && (
        <div className="px-4">
          {!currentUserUid ? (
            <div className="bg-[#111827] rounded-2xl p-8 text-center border border-white/5">
              <p className="text-gray-500 text-sm">Login to see your result</p>
            </div>
          ) : !myResult ? (
            <div className="bg-[#111827] rounded-2xl p-8 text-center border border-white/5">
              <p className="text-3xl mb-3">😔</p>
              <p className="text-white font-bold mb-1">Not in Results</p>
              <p className="text-gray-500 text-sm">
                Your UID was not found in this match result
              </p>
            </div>
          ) : (
            <div>
              <div
                className={`rounded-2xl p-5 border mb-4 ${
                  myResult.rank === 1
                    ? "bg-yellow-500/10 border-yellow-500/30"
                    : myResult.rank === 2
                      ? "bg-gray-500/10 border-gray-400/30"
                      : myResult.rank === 3
                        ? "bg-orange-500/10 border-orange-500/30"
                        : "bg-[#111827] border-white/5"
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-gray-400 text-xs">Your IGN</p>
                    <p className="text-white text-xl font-black">
                      {myResult.playerName}
                    </p>
                  </div>
                  {getRankMeta(myResult.rank) && (
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full border ${getRankMeta(myResult.rank).bg} ${getRankMeta(myResult.rank).text} ${getRankMeta(myResult.rank).border}`}
                    >
                      {getRankMeta(myResult.rank).icon} #{myResult.rank}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-black/30 rounded-xl p-3 text-center">
                    <p className="text-white font-black text-lg">
                      #{myResult.rank || "—"}
                    </p>
                    <p className="text-gray-500 text-[10px] mt-0.5">
                      Final Rank
                    </p>
                  </div>
                  <div className="bg-black/30 rounded-xl p-3 text-center">
                    <p className="text-orange-400 font-black text-lg">
                      {myResult.kills}
                    </p>
                    <p className="text-gray-500 text-[10px] mt-0.5">Kills</p>
                  </div>
                  <div className="bg-black/30 rounded-xl p-3 text-center">
                    <p className="text-green-400 font-black text-lg">
                      ৳{myResult.totalPrize}
                    </p>
                    <p className="text-gray-500 text-[10px] mt-0.5">Earned</p>
                  </div>
                </div>
                {myResult.totalPrize > 0 ? (
                  <div className="bg-black/30 rounded-xl p-3">
                    <p className="text-gray-400 text-xs mb-2 font-semibold uppercase tracking-wider">
                      Prize Breakdown
                    </p>
                    <div className="space-y-1.5">
                      {myResult.rankPrize > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Placement Prize</span>
                          <span className="text-yellow-400 font-bold">
                            +৳{myResult.rankPrize}
                          </span>
                        </div>
                      )}
                      {myResult.killEarning > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">
                            {myResult.kills} Kills × ৳{killPrice}
                          </span>
                          <span className="text-green-400 font-bold">
                            +৳{myResult.killEarning}
                          </span>
                        </div>
                      )}
                      <div className="border-t border-white/10 pt-1.5 flex justify-between">
                        <span className="text-white font-bold text-sm">
                          Total Credited
                        </span>
                        <span className="text-green-400 font-black text-base">
                          ৳{myResult.totalPrize}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-black/30 rounded-xl p-4 text-center">
                    <p className="text-gray-500 text-sm">
                      No prize this match. Better luck next time! 💪
                    </p>
                  </div>
                )}
              </div>
              {myResult.totalPrize > 0 && (
                <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl p-3">
                  <span className="text-green-400">✓</span>
                  <p className="text-green-400 text-sm">
                    <strong>৳{myResult.totalPrize}</strong> has been credited to
                    your wallet
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Results List ─────────────────────────────────────────────────────────────
function ResultsListPage({ onSelectResult, currentUserUid }) {
  const API_BASE = import.meta.env.VITE_API_URL || "https://playzo-vn8e.onrender.com/api";

  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/matches/completed`);
        const data = await res.json();
        setMatches(Array.isArray(data?.data) ? data.data : []);
      } catch (e) {
        setMatches([]);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [API_BASE]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">Loading results...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a] pb-24">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
          <span className="text-orange-400 text-xs font-semibold uppercase tracking-widest">
            Match Results
          </span>
        </div>
        <h1 className="text-white text-2xl font-extrabold">Results</h1>
        <p className="text-gray-500 text-xs mt-1">
          Tap a match to see full leaderboard
        </p>
      </div>

      {/* Match Cards */}
      <div className="px-4 space-y-3">
        {matches.length === 0 ? (
          <div className="bg-[#111827] rounded-2xl p-10 text-center border border-white/5">
            <p className="text-3xl mb-3">🎮</p>
            <p className="text-white font-bold mb-1">No Results Yet</p>
            <p className="text-gray-500 text-sm">
              Results will appear here after matches end
            </p>
          </div>
        ) : (
          matches.map((match) => {
            const top3 = (match.results || [])
              .sort((a, b) => a.position - b.position)
              .slice(0, 3);
            const myResult = (match.results || []).find(
              (r) => r.userId?.toString() === currentUserUid?.toString()
            );
            const categoryLabel = {
              br_match: "BR Match",
              br_survival: "BR Survival",
              clash_squad: "Clash Squad",
              cs_2vs2: "CS 2vs2",
              lone_wolf: "Lone Wolf",
              training: "Training Match",
            }[match.category] || match.category;
            const categoryColor = {
              br_match: { bg: "#7c3aed20", text: "#a78bfa" },
              br_survival: { bg: "#dc262620", text: "#f87171" },
              clash_squad: { bg: "#0284c720", text: "#38bdf8" },
              cs_2vs2: { bg: "#16a34a20", text: "#4ade80" },
              lone_wolf: { bg: "#d9770620", text: "#fb923c" },
              training: { bg: "#64748b20", text: "#94a3b8" },
            }[match.category] || { bg: "#ffffff10", text: "#fff" };
            return (
              <div
                key={match._id}
                onClick={() => onSelectResult(match)}
                className="bg-[#111827] border border-white/5 rounded-2xl p-4 cursor-pointer active:scale-95 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span style={{
                        fontSize: 10, fontWeight: 700,
                        padding: "2px 8px", borderRadius: 20,
                        background: categoryColor.bg,
                        color: categoryColor.text,
                      }}>
                        {categoryLabel}
                      </span>
                    </div>
                    <p className="text-white font-bold text-sm truncate">
                      {match.title}
                    </p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {match.map || "Free Fire"} • ৳{match.perKill}/kill •{" "}
                      {match.completedAt
                        ? new Date(match.completedAt).toLocaleDateString("en-BD")
                        : ""}
                    </p>
                  </div>
                  <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full border border-green-500/20 shrink-0 ml-2">
                    ✅ Completed
                  </span>
                </div>
                <div className="flex gap-2 mb-3">
                  {top3.length > 0 ? (
                    top3.map((p, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-1.5 bg-black/30 rounded-lg px-2 py-1.5 flex-1"
                      >
                        <span className="text-sm">
                          {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}
                        </span>
                        <div className="min-w-0">
                          <p className="text-white text-[11px] font-bold truncate">
                            {p.inGameName || "—"}
                          </p>
                          <p className="text-gray-500 text-[10px]">
                            ৳{p.prize || 0}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-600 text-xs">No result data</p>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  {myResult ? (
                    <div className={`flex items-center gap-2 text-xs ${myResult.prize > 0 ? "text-green-400" : "text-gray-500"}`}>
                      <span>You:</span>
                      <span className="font-bold">#{myResult.position || "—"}</span>
                      <span>⚔️ {myResult.kills} kills</span>
                      {myResult.prize > 0 && (
                        <span className="font-black">+৳{myResult.prize}</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-600 text-xs">
                      You didn't participate
                    </span>
                  )}
                  <span className="text-orange-400 text-xs font-bold">
                    View →
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Notifications Page ───────────────────────────────────────────────────────
function NotificationsPage({ onBack }) {
  const API_BASE = import.meta.env.VITE_API_URL || "https://playzo-vn8e.onrender.com/api";
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/notifications`);
        const data = await res.json();
        setNotifications(Array.isArray(data?.data) ? data.data : Array.isArray(data?.notifications) ? data.notifications : []);
      } catch {
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, [API_BASE]);

  return (
    <div className="min-h-screen bg-[#0a0e1a] pb-24">
      <div className="sticky top-0 z-30 bg-[#0a0e1a]/95 backdrop-blur border-b border-white/5">
        <div className="px-4 py-4 flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-white/10 active:scale-95 transition-all"
          >
            <span className="text-white text-lg">←</span>
          </button>
          <div className="flex-1">
            <h1 className="text-white text-xl font-extrabold">Notifications</h1>
            <p className="text-gray-500 text-xs">All your alerts in one place</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 text-sm">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-[#111827] rounded-2xl p-10 text-center border border-white/5">
            <p className="text-4xl mb-3">🔔</p>
            <p className="text-white font-bold mb-1">No Notifications</p>
            <p className="text-gray-500 text-sm">
              You're all caught up! Check back later
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n, idx) => (
              <div
                key={n._id || idx}
                className={`rounded-2xl p-4 border ${
                  n.isRead
                    ? "bg-[#111827] border-white/5"
                    : "bg-orange-500/10 border-orange-500/30"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0">
                    <span className="text-lg">{n.icon || "🔔"}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-white font-bold text-sm">
                        {n.title || "Notification"}
                      </p>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p className="text-gray-400 text-xs mt-1">
                      {n.body || n.message}
                    </p>
                    {n.createdAt && (
                      <p className="text-gray-600 text-[10px] mt-2">
                        {new Date(n.createdAt).toLocaleString("en-BD")}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


// ─── Ludo Tournament Section ──────────────────────────────────────────────────
 import React, { useState, useEffect, useCallback } from "react";

const API_LUDO = (import.meta.env.VITE_API_URL || "https://playzo-vn8e.onrender.com").replace("/api", "");

// ─── Countdown Timer ───────────────────────────────────────
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

// ─── Single Match Card ─────────────────────────────────────
const LudoCard = ({ match, userId, onJoin, joining }) => {
  const [showRoom, setShowRoom] = useState(false);
  const fmtL = (n) => "৳" + Number(n || 0).toLocaleString();
  
  const joined = Number(match.joinedPlayers || 0);
  const total = Number(match.totalSlots || match.totalPlayers || 4);
  const fill = total > 0 ? (joined / total) * 100 : 0;
  
  const isMine = (match.joinedUsers || []).some((u) => 
    u.userId?.toString?.() === userId?.toString?.() || u.userId === userId
  );
  
  const isFull = joined >= total;
  const canJoin = !isMine && !isFull && !["completed", "cancelled"].includes(match.status);
  
  const mySlot = isMine 
    ? (match.joinedUsers || []).find((u) => 
        u.userId?.toString?.() === userId?.toString?.() || u.userId === userId
      )?.slotNumber 
    : null;

  const modeLabel = { 
    "1v1": "⚔️ 1 vs 1", 
    "2v2": "👥 2 vs 2", 
    "4player": "🎮 4 Player" 
  }[match.mode] || "🎮 Ludo";

  const statusBg = { 
    upcoming: "#dbeafe", live: "#fee2e2", completed: "#f3f4f6", cancelled: "#fef9c3" 
  }[match.status] || "#dbeafe";

  const statusClr = { 
    upcoming: "#1e40af", live: "#991b1b", completed: "#374151", cancelled: "#713f12" 
  }[match.status] || "#1e40af";

  const statusLbl = { 
    upcoming: "🕐 Upcoming", live: "🔴 Live", completed: "✅ Ended", cancelled: "❌ Cancelled" 
  }[match.status] || "🕐 Upcoming";

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
        <img 
          src={match.image} 
          alt="" 
          style={{ width: "100%", height: 110, objectFit: "cover" }} 
          onError={(e) => { e.target.style.display = "none"; }} 
        />
      )}

      <div style={{ padding: "12px 14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#111827", marginBottom: 4 }}>🎲 {match.title}</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <span style={{ background: "#ede9fe", color: "#5b21b6", fontSize: 10, padding: "3px 8px", borderRadius: 20, fontWeight: 800 }}>{modeLabel}</span>
              <span style={{ background: statusBg, color: statusClr, fontSize: 10, padding: "3px 8px", borderRadius: 20, fontWeight: 700 }}>{statusLbl}</span>
              {isMine && <span style={{ background: "#d1fae5", color: "#065f46", fontSize: 10, padding: "3px 8px", borderRadius: 20, fontWeight: 700 }}>✅ Joined #{mySlot}</span>}
            </div>
          </div>
          <div style={{ background: "linear-gradient(135deg,#fef3c7,#fde68a)", borderRadius: 12, padding: "6px 12px", textAlign: "center", border: "1px solid #fcd34d" }}>
            <div style={{ fontSize: 9, color: "#92400e", fontWeight: 700, marginBottom: 1 }}>WIN PRIZE</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: "#b45309" }}>{fmtL(match.winPrize)}</div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", background: "#f9fafb", borderRadius: 10, padding: "10px 0", marginBottom: 10 }}>
          {[
            { label: "Entry Fee", value: fmtL(match.entryFee) },
            { label: "Players", value: `${joined}/${total}` },
            { label: "Map", value: match.map || "Classic" }
          ].map((s, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 9, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", marginBottom: 2 }}>{s.label}</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#111827" }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 10, color: "#6b7280", fontWeight: 600 }}>Slots</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: isFull ? "#ef4444" : "#059669" }}>
              {isFull ? "Full 🔒" : `${total - joined} বাকি`}
            </span>
          </div>
          <div style={{ height: 6, background: "#e5e7eb", borderRadius: 999 }}>
            <div style={{ height: "100%", width: `${fill}%`, background: fill >= 100 ? "#ef4444" : fill >= 75 ? "#f59e0b" : "#10b981", borderRadius: 999, transition: "width 0.4s" }} />
          </div>
        </div>

        {/* Start Time */}
        {match.startTime && (
          <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 10, display: "flex", alignItems: "center", gap: 4 }}>
            ⏰ {match.status === "upcoming" ? <><LudoTimeLeft startTime={match.startTime} /> বাকি</> : new Date(match.startTime).toLocaleString("en-BD", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: true })}
          </div>
        )}

        {/* Join Button */}
        {canJoin && (
          <button 
            onClick={() => onJoin(match._id, match.entryFee, match.title)} 
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
              cursor: joining === match._id ? "not-allowed" : "pointer",
              boxShadow: "0 4px 12px rgba(245,158,11,0.35)"
            }}
          >
            {joining === match._id ? "⏳ Join হচ্ছে..." : `🎲 Join করুন — ${fmtL(match.entryFee)}`}
          </button>
        )}

        {isMine && match.status === "upcoming" && (
          <div style={{ background: "#d1fae5", borderRadius: 10, padding: 10, textAlign: "center", fontSize: 12, fontWeight: 700, color: "#065f46" }}>
            ✅ আপনি join করেছেন! Match শুরু হলে Room Code দেখতে পাবেন।
          </div>
        )}

        {isFull && !isMine && (
          <div style={{ background: "#fee2e2", borderRadius: 10, padding: 10, textAlign: "center", fontSize: 12, fontWeight: 700, color: "#991b1b" }}>
            🔒 Match ফুল হয়ে গেছে
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────
function LudoTournamentSection() {
  const [activeMode, setActiveMode] = useState("all");
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(null);
  const [toast, setToast] = useState({ text: "", type: "" });

  // Safe User Parsing
  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();

  const userId = currentUser?.id || currentUser?._id;
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

  const handleJoin = async (matchId, entryFee, matchTitle) => {
    if (!userId) return showToast("আগে Login করুন", "error");
    if (!window.confirm(`"${matchTitle}" তে Join করবেন?\nEntry Fee: ৳${entryFee}`)) return;

    setJoining(matchId);
    try {
      const res = await fetch(`${API_LUDO}/api/ludo-tournament/join/${matchId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId }),
      });
      const d = await res.json();
      if (d.success) {
        showToast(`✅ Join সফল! Slot #${d.slotNumber}`);
        const u = JSON.parse(localStorage.getItem("user") || "{}");
        localStorage.setItem("user", JSON.stringify({ ...u, balance: d.newBalance }));
        loadMatches();
      } else {
        showToast(d.message || "Join হয়নি", "error");
      }
    } catch {
      showToast("নেটওয়ার্ক সমস্যা", "error");
    }
    setJoining(null);
  };

  const filtered = activeMode === "all" ? matches : matches.filter((m) => m.mode === activeMode);

  return (
    <div style={{ background: "#f3f4f6", minHeight: "100%" }}>
      <div style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", padding: "14px 16px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div>
            <div style={{ color: "#c4b5fd", fontSize: 11, fontWeight: 600, marginBottom: 2 }}>TOURNAMENT</div>
            <div style={{ color: "#fff", fontSize: 18, fontWeight: 900 }}>🎲 Ludo Arena</div>
          </div>
          <button 
            onClick={loadMatches} 
            disabled={loading} 
            style={{ background: "rgba(255,255,255,0.15)", color: "#fff", border: "none", borderRadius: 20, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
          >
            {loading ? "⏳" : "🔄"}
          </button>
        </div>

        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
          {[{ id: "all", label: "🎲 সব" }, { id: "1v1", label: "⚔️ 1v1" }, { id: "2v2", label: "👥 2v2" }, { id: "4player", label: "🎮 4P" }].map((m) => (
            <button 
              key={m.id} 
              onClick={() => setActiveMode(m.id)} 
              style={{ 
                flexShrink: 0, 
                padding: "6px 14px", 
                borderRadius: 20, 
                border: "none", 
                cursor: "pointer", 
                background: activeMode === m.id ? "#fff" : "rgba(255,255,255,0.15)", 
                color: activeMode === m.id ? "#4f46e5" : "#e0d7ff", 
                fontWeight: 700, 
                fontSize: 12 
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {toast.text && (
        <div style={{ 
          margin: "10px 12px 0", 
          background: toast.type === "error" ? "#fee2e2" : "#d1fae5", 
          color: toast.type === "error" ? "#991b1b" : "#065f46", 
          padding: "10px 14px", 
          borderRadius: 12, 
          fontSize: 13, 
          fontWeight: 600 
        }}>
          {toast.text}
        </div>
      )}

      <div style={{ padding: "12px 12px 0" }}>
        {loading && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: 50, color: "#9ca3af" }}>
            <div style={{ fontSize: 40 }}>🎲</div>
            <p style={{ marginTop: 8, fontSize: 13 }}>লোড হচ্ছে...</p>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "50px 20px", background: "#fff", borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 52, marginBottom: 10 }}>🎲</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#374151" }}>কোনো match নেই</div>
          </div>
        )}

        {filtered.map((m) => (
          <LudoCard 
            key={m._id} 
            match={m} 
            userId={userId} 
            onJoin={handleJoin} 
            joining={joining} 
          />
        ))}
      </div>
    </div>
  );
}

export default LudoTournamentSection;
 
// ─── Main AppDashboard ────────────────────────────────────────────────────────
const AppDashboard = ({ onLogout }) => {
  const [tab, setTab]               = useState("play");
  const [screen, setScreen]         = useState("home");
  const [slide, setSlide]           = useState(0);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [matches, setMatches]       = useState([]);
  const [selectedResult, setSelectedResult]     = useState(null);
  const [resultTab, setResultTab]   = useState("leaderboard");
  const [refreshing, setRefreshing] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  // 🆕 Game switcher
  const [activeGame, setActiveGame] = useState("freefire");

  const currentUser    = JSON.parse(localStorage.getItem("user") || "{}");
  const currentUserUid = currentUser?.uid || currentUser?.gameUID || currentUser?._id || "";
  const API_BASE       = import.meta.env.VITE_API_URL || "https://playzo-vn8e.onrender.com/api";

  const getMatchCount = (k) => matches.filter((m) => m.category === k && m.status !== "completed").length;

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/matches`);
        const data = await res.json();
        let s = [];
        if (Array.isArray(data)) s = data;
        else if (Array.isArray(data?.matches)) s = data.matches;
        else if (Array.isArray(data?.data)) s = data.data;
        setMatches(s);
      } catch { setMatches([]); }
    };
    load();
    const iv = setInterval(load, 10000);
    return () => clearInterval(iv);
  }, [API_BASE]);

  useEffect(() => {
    const t = setInterval(() => setSlide((p) => (p === 2 ? 0 : p + 1)), 3000);
    return () => clearInterval(t);
  }, []);

  const categories = [
    { key: "br_match",    title: "BR Match",       img: "/image/img-1.jpg" },
    { key: "br_survival", title: "BR Survival",    img: "/image/img-2.jpg" },
    { key: "clash_squad", title: "Clash Squad",    img: "/image/img-3.jpg" },
    { key: "cs_2vs2",     title: "CS 2vs2",        img: "/image/img-1.jpg" },
    { key: "lone_wolf",   title: "Lone Wolf",      img: "/image/img-2.jpg" },
    { key: "training",    title: "Training Match", img: "/image/img-3.jpg" },
  ];

  if (showNotifications) return <div className="mx-auto min-h-screen"><NotificationsPage onBack={() => setShowNotifications(false)} /><BottomMenu tab={tab} setTab={setTab} /></div>;

  if (tab === "profile") {
    if (screen === "wallet")     return <div className="bg-white min-h-screen mx-auto pb-24"><Wallet onBack={() => setScreen("home")} /><BottomMenu tab={tab} setTab={setTab} /></div>;
    if (screen === "withdraw")   return <div className="bg-white min-h-screen mx-auto pb-24 shadow-xl"><Withdraw onBack={() => setScreen("home")} /><BottomMenu tab={tab} setTab={setTab} /></div>;
    if (screen === "all_rules")  return <div className="bg-white min-h-screen mx-auto"><AllRulesPage onBack={() => setScreen("home")} /></div>;
    if (screen === "my_profile") return <div className="bg-white min-h-screen mx-auto"><AccountInfo onBack={() => setScreen("home")} /></div>;
    if (screen === "referral")   return <div className="bg-white min-h-screen mx-auto"><div className="p-4 text-center text-gray-500">Referral Component</div><BottomMenu tab={tab} setTab={setTab} /></div>;
    return <div className="bg-white min-h-screen mx-auto pb-24"><Profile onLogout={onLogout} onWallet={() => setScreen("wallet")} onWithdraw={() => setScreen("withdraw")} onAllRules={() => setScreen("all_rules")} onMyProfile={() => setScreen("my_profile")} onReferral={() => setScreen("referral")} /><BottomMenu tab={tab} setTab={setTab} /></div>;
  }

  if (tab === "shop") return <div className="bg-white min-h-screen mx-auto pb-24"><div className="p-4 text-center text-gray-400 mt-20 text-lg font-bold">🛒 Shop Coming Soon...</div><BottomMenu tab={tab} setTab={setTab} /></div>;

  if (tab === "matches") return <div className="mx-auto min-h-screen"><MyMatch /><BottomMenu tab={tab} setTab={setTab} /></div>;

  if (tab === "results") {
    if (selectedResult) return (
      <div className="mx-auto min-h-screen">
        <div className="bg-[#0a0e1a] px-4 pt-4"><button onClick={() => setSelectedResult(null)} className="flex items-center gap-2 text-orange-400 text-sm font-bold mb-2">← Back to Results</button></div>
        <MatchResultsPage matchId={selectedResult.matchId || selectedResult._id} matchTitle={selectedResult.matchTitle} killPrice={selectedResult.killPrice} results={selectedResult.results} publishedAt={selectedResult.submittedAt || selectedResult.publishedAt} mapName={selectedResult.mapName} currentUserUid={currentUserUid} />
        <BottomMenu tab={tab} setTab={(t) => { setTab(t); setSelectedResult(null); }} />
      </div>
    );
    return (
      <div className="mx-auto min-h-screen bg-[#f7f2fb]">
        <div style={{ display: "flex", background: "#fff", borderBottom: "2px solid #ede9fe", position: "sticky", top: 0, zIndex: 40 }}>
          {[{ id: "leaderboard", label: "🏆 Leaderboard" }, { id: "matchresults", label: "📊 Match Results" }].map((t) => (
            <button key={t.id} onClick={() => setResultTab(t.id)} style={{ flex: 1, padding: "13px 0", border: "none", background: "transparent", fontWeight: 700, fontSize: 13, color: resultTab === t.id ? "#4f46e5" : "#9ca3af", borderBottom: resultTab === t.id ? "2px solid #4f46e5" : "2px solid transparent", cursor: "pointer", transition: "all 0.2s", marginBottom: -2 }}>{t.label}</button>
          ))}
        </div>
        {resultTab === "leaderboard" ? <Leaderboard /> : <ResultsListPage onSelectResult={setSelectedResult} currentUserUid={currentUserUid} />}
        <BottomMenu tab={tab} setTab={setTab} />
      </div>
    );
  }

  if (screen === "category") return (
    <div className="mx-auto min-h-screen bg-white">
      <MatchList category={selectedCategory} title={categories.find((c) => c.key === selectedCategory)?.title || selectedCategory}
        onBack={() => { setScreen("home"); setSelectedCategory(""); }}
        onJoinSuccess={(matchId, newBalance) => { const u = JSON.parse(localStorage.getItem("user") || "{}"); localStorage.setItem("user", JSON.stringify({ ...u, balance: newBalance })); }}
        tab={tab} setTab={setTab} />
    </div>
  );

  // ── HOME SCREEN ──
  return (
    <div className="bg-gray-50 min-h-screen mx-auto pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 px-4 pt-5 pb-4 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-white font-black text-lg">{(currentUser?.name || "P")[0].toUpperCase()}</span>
            </div>
            <div>
              <p className="text-white/80 text-[11px] font-medium">Welcome back</p>
              <p className="text-white font-extrabold text-sm truncate max-w-[150px]">{currentUser?.name || "Player"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-white/15 backdrop-blur px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <span className="text-yellow-300 text-xs">💰</span>
              <span className="text-white font-black text-xs">৳{currentUser?.balance || 0}</span>
            </div>
            <NotificationBell onOpen={() => setShowNotifications(true)} />
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Slider */}
        <div className="relative w-full h-44 overflow-hidden rounded-3xl shadow-lg border-4 border-white">
          {categories.slice(0, 3).map((c, i) => (
            <img key={i} src={c.img} className="absolute w-full h-full object-cover transition-opacity duration-1000" style={{ opacity: slide === i ? 1 : 0 }} alt="Slider" />
          ))}
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
            {[0, 1, 2].map((i) => <div key={i} className={`h-1.5 rounded-full transition-all ${slide === i ? "w-6 bg-white" : "w-1.5 bg-white/50"}`} />)}
          </div>
        </div>

        {/* Marquee */}
        <div className="mt-4 bg-[#111827] border border-orange-500/30 rounded-2xl overflow-hidden">
          <marquee scrollamount="6" className="py-2 text-orange-400 text-sm font-extrabold">
            🎮 uthiYo ESPORTS • FREE FIRE LIVE MATCH • DAILY SCRIMS • WIN REAL CASH • JOIN CUSTOM ROOM NOW 🚀
          </marquee>
        </div>

        {/* ══ 🆕 GAME SWITCHER ══ */}
        <div style={{ display: "flex", background: "#1f2937", borderRadius: 14, padding: 4, margin: "18px 0 0" }}>
          {[{ id: "freefire", label: "🔥 Free Fire", color: "#f97316" }, { id: "ludo", label: "🎲 Ludo", color: "#7c3aed" }].map((g) => (
            <button key={g.id} onClick={() => setActiveGame(g.id)}
              style={{ flex: 1, padding: "11px 0", borderRadius: 11, border: "none", background: activeGame === g.id ? g.color : "transparent", color: activeGame === g.id ? "#fff" : "#9ca3af", fontWeight: 800, fontSize: 14, cursor: "pointer", transition: "all 0.2s", boxShadow: activeGame === g.id ? `0 4px 12px ${g.color}55` : "none" }}>
              {g.label}
            </button>
          ))}
        </div>

        {/* ── Free Fire Section ── */}
        {activeGame === "freefire" && (
          <>
            <div className="flex items-center justify-between mt-6 px-1">
              <h2 className="font-black text-gray-800 text-lg tracking-tight uppercase">Free Fire <span className="text-orange-500">Arena</span></h2>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-orange-100 text-orange-600 px-2 py-1 rounded-md font-bold animate-pulse">LIVE NOW</span>
                <button
                  onClick={async () => {
                    setRefreshing(true);
                    try { const res = await fetch(`${API_BASE}/matches`); const data = await res.json(); let s = []; if (Array.isArray(data)) s = data; else if (Array.isArray(data?.matches)) s = data.matches; else if (Array.isArray(data?.data)) s = data.data; setMatches(s); }
                    catch (e) { console.error(e); } finally { setTimeout(() => setRefreshing(false), 800); }
                  }}
                  disabled={refreshing}
                  className="flex items-center justify-center w-8 h-8 bg-orange-50 border border-orange-200 rounded-full active:scale-95 transition-all disabled:opacity-70"
                >
                  <span className={`text-orange-500 text-sm ${refreshing ? "animate-spin" : ""}`}>🔄</span>
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              {categories.map((cat) => {
                const count = getMatchCount(cat.key);
                return (
                  <div key={cat.key} onClick={() => { setSelectedCategory(cat.key); setScreen("category"); }} className="relative rounded-2xl overflow-hidden h-28 cursor-pointer shadow-md active:scale-95 transition-all border border-black/5">
                    <img src={cat.img} alt={cat.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="flex items-center justify-between">
                        <p className="text-white font-extrabold text-sm tracking-wide uppercase">{cat.title}</p>
                        {count > 0 && <span className="bg-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{count} Matches</span>}
                      </div>
                      <p className="text-orange-400 text-[10px] font-medium mt-0.5">Enter Battle Arena →</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ── Ludo Section ── */}
        {activeGame === "ludo" && <div className="mt-4"><LudoTournamentSection /></div>}
      </div>

      <BottomMenu tab={tab} setTab={setTab} />
    </div>
  );
};

export default AppDashboard;