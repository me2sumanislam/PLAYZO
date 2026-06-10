 // AppDashboard.jsx

import React, { useState, useEffect } from "react";
import BottomMenu from "../BottomMenu/BottomMenu";
import NotificationBell from "../NotificationBell/NotificationBell";
import Wallet from "../../page/Wallet/Wallet";
import MatchList from "../../page/MatchList/MatchList";
import Withdraw from "../../page/Withdraw/Withdraw";
import AddMoneyModal from "../Addmoney/AddMoney";
import AllRulesPage from "../AllRulesPage/AllRulesPage";
import AccountInfo from "../../page/AccountInfo/AccountInfo";
import MyMatch from "../../page/MyMatch/MyMatch";
import Leaderboard from "../../page/Leaderboard/Leaderboard";
import Referral from "../../page/Referral/Referral";
import ClickableSlider from "../Slider/ClickableSlider";

import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "https://playzo-vn8e.onrender.com/api";
const CLEAN_API_URL = API_BASE.endsWith("/api") ? API_BASE : `${API_BASE}/api`;

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

      {sorted.length >= 1 && (
        <div className="px-4 mb-4">
          <div className="flex items-end justify-center gap-2">
            {sorted[1] && (
              <div className="flex-1 bg-[#111827] border border-gray-400/20 rounded-2xl p-3 text-center pb-4">
                <p className="text-2xl mb-1">🥈</p>
                <p className="text-white text-xs font-bold truncate">
                  {sorted[1].playerName}
                </p>
                <p className="text-gray-400 text-[10px]">{sorted[1].kills} kills</p>
                <p className="text-gray-200 text-sm font-black mt-1">৳{sorted[1].totalPrize}</p>
              </div>
            )}
            {sorted[0] && (
              <div className="flex-1 bg-[#111827] border border-yellow-500/30 rounded-2xl p-3 text-center pb-6 -mb-2 shadow-lg shadow-yellow-500/10">
                <p className="text-3xl mb-1">🏆</p>
                <p className="text-yellow-400 text-xs font-extrabold truncate">
                  {sorted[0].playerName}
                </p>
                <p className="text-gray-400 text-[10px]">{sorted[0].kills} kills</p>
                <p className="text-yellow-400 text-base font-black mt-1">৳{sorted[0].totalPrize}</p>
              </div>
            )}
            {sorted[2] && (
              <div className="flex-1 bg-[#111827] border border-orange-500/20 rounded-2xl p-3 text-center pb-4">
                <p className="text-2xl mb-1">🥉</p>
                <p className="text-white text-xs font-bold truncate">
                  {sorted[2].playerName}
                </p>
                <p className="text-gray-400 text-[10px]">{sorted[2].kills} kills</p>
                <p className="text-orange-300 text-sm font-black mt-1">৳{sorted[2].totalPrize}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="px-4 mb-3">
        <div className="flex bg-[#111827] rounded-xl p-1 border border-white/5">
          {[
            { key: "leaderboard", label: "Leaderboard" },
            { key: "mine", label: "My Result" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                tab === t.key ? "bg-orange-500 text-white" : "text-gray-400"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

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
                className={`rounded-2xl p-4 border ${
                  isMe ? "bg-orange-500/10 border-orange-500/30" : "bg-[#111827] border-white/5"
                }`}
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
                      <p className={`font-bold text-sm truncate ${isMe ? "text-orange-400" : "text-white"}`}>
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
                    <p className={`font-black text-base ${player.totalPrize > 0 ? "text-green-400" : "text-gray-600"}`}>
                      {player.totalPrize > 0 ? `+৳${player.totalPrize}` : "—"}
                    </p>
                    {player.totalPrize > 0 && (
                      <p className="text-[10px] text-gray-600 mt-0.5">credited</p>
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
              <p className="text-gray-500 text-sm">Your UID was not found in this match result</p>
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
                    <p className="text-white text-xl font-black">{myResult.playerName}</p>
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
                    <p className="text-white font-black text-lg">#{myResult.rank || "—"}</p>
                    <p className="text-gray-500 text-[10px] mt-0.5">Final Rank</p>
                  </div>
                  <div className="bg-black/30 rounded-xl p-3 text-center">
                    <p className="text-orange-400 font-black text-lg">{myResult.kills}</p>
                    <p className="text-gray-500 text-[10px] mt-0.5">Kills</p>
                  </div>
                  <div className="bg-black/30 rounded-xl p-3 text-center">
                    <p className="text-green-400 font-black text-lg">৳{myResult.totalPrize}</p>
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
                          <span className="text-yellow-400 font-bold">+৳{myResult.rankPrize}</span>
                        </div>
                      )}
                      {myResult.killEarning > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">{myResult.kills} Kills × ৳{killPrice}</span>
                          <span className="text-green-400 font-bold">+৳{myResult.killEarning}</span>
                        </div>
                      )}
                      <div className="border-t border-white/10 pt-1.5 flex justify-between">
                        <span className="text-white font-bold text-sm">Total Credited</span>
                        <span className="text-green-400 font-black text-base">৳{myResult.totalPrize}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-black/30 rounded-xl p-4 text-center">
                    <p className="text-gray-500 text-sm">No prize this match. Better luck next time! 💪</p>
                  </div>
                )}
              </div>
              {myResult.totalPrize > 0 && (
                <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl p-3">
                  <span className="text-green-400">✓</span>
                  <p className="text-green-400 text-sm">
                    <strong>৳{myResult.totalPrize}</strong> has been credited to your wallet
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
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${CLEAN_API_URL}/matches/completed`);
        const data = await res.json();
        setMatches(Array.isArray(data?.data) ? data.data : []);
      } catch {
        setMatches([]);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

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

      {/* ── Header with back info ── */}
      <div className="sticky top-0 z-30 bg-[#0a0e1a]/95 backdrop-blur border-b border-white/5 px-4 py-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
          <span className="text-orange-400 text-xs font-semibold uppercase tracking-widest">
            Match Results
          </span>
        </div>
        <h1 className="text-white text-2xl font-extrabold">Results</h1>
        <p className="text-gray-500 text-xs mt-1">Tap a match to see full leaderboard</p>
      </div>

      <div className="px-4 mt-4 space-y-3">
        {matches.length === 0 ? (
          <div className="bg-[#111827] rounded-2xl p-10 text-center border border-white/5">
            <p className="text-3xl mb-3">🎮</p>
            <p className="text-white font-bold mb-1">No Results Yet</p>
            <p className="text-gray-500 text-sm">Results will appear here after matches end</p>
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
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: 20,
                          background: categoryColor.bg,
                          color: categoryColor.text,
                        }}
                      >
                        {categoryLabel}
                      </span>
                    </div>
                    <p className="text-white font-bold text-sm truncate">{match.title}</p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {match.map || "Free Fire"} • ৳{match.perKill}/kill •{" "}
                      {match.completedAt ? new Date(match.completedAt).toLocaleDateString("en-BD") : ""}
                    </p>
                  </div>
                  <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full border border-green-500/20 shrink-0 ml-2">
                    ✅ Completed
                  </span>
                </div>
                <div className="flex gap-2 mb-3">
                  {top3.length > 0 ? (
                    top3.map((p, i) => (
                      <div key={i} className="flex items-center gap-1.5 bg-black/30 rounded-lg px-2 py-1.5 flex-1">
                        <span className="text-sm">{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}</span>
                        <div className="min-w-0">
                          <p className="text-white text-[11px] font-bold truncate">{p.inGameName || "—"}</p>
                          <p className="text-gray-500 text-[10px]">৳{p.prize || 0}</p>
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
                      {myResult.prize > 0 && <span className="font-black">+৳{myResult.prize}</span>}
                    </div>
                  ) : (
                    <span className="text-gray-600 text-xs">You didn't participate</span>
                  )}
                  <span className="text-orange-400 text-xs font-bold">View →</span>
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
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token") || "";
        const res = await fetch(`${CLEAN_API_URL}/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setNotifications(
          Array.isArray(data?.notifications)
            ? data.notifications
            : Array.isArray(data?.data)
              ? data.data
              : []
        );
      } catch {
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

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
            <p className="text-gray-500 text-sm">Loading...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-[#111827] rounded-2xl p-10 text-center border border-white/5">
            <p className="text-4xl mb-3">🔔</p>
            <p className="text-white font-bold mb-1">No Notifications</p>
            <p className="text-gray-500 text-sm">You're all caught up!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n, idx) => {
              const notif = n.notificationId || n;
              const match = notif?.matchId;
              const categoryLabel = {
                br_match: "BR Match",
                br_survival: "BR Survival",
                clash_squad: "Clash Squad",
                cs_2vs2: "CS 2vs2",
                lone_wolf: "Lone Wolf",
                training: "Training Match",
                ludo: "Ludo",
                general: "General",
              }[notif?.category] || notif?.category || "General";

              return (
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
                      <span className="text-lg">🎮</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-white font-bold text-sm">
                          {notif?.title || "New Match"}
                        </p>
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-gray-400 text-xs mt-1">
                        {notif?.message || ""}
                      </p>
                      <span className="inline-block mt-1 text-[10px] bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full border border-orange-500/20 font-bold">
                        {categoryLabel}
                      </span>
                      {match && (
                        <div className="mt-2 bg-black/30 rounded-xl p-3 space-y-1.5">
                          {match.title && (
                            <p className="text-white text-xs font-bold">{match.title}</p>
                          )}
                          <div className="flex gap-3 flex-wrap">
                            {match.entryFee !== undefined && (
                              <div className="text-xs">
                                <span className="text-gray-500">Entry </span>
                                <span className="text-orange-400 font-bold">৳{match.entryFee}</span>
                              </div>
                            )}
                            {match.winPrize !== undefined && (
                              <div className="text-xs">
                                <span className="text-gray-500">Prize </span>
                                <span className="text-green-400 font-bold">৳{match.winPrize}</span>
                              </div>
                            )}
                            {match.perKill !== undefined && (
                              <div className="text-xs">
                                <span className="text-gray-500">Per Kill </span>
                                <span className="text-blue-400 font-bold">৳{match.perKill}</span>
                              </div>
                            )}
                            {match.totalPlayers !== undefined && (
                              <div className="text-xs">
                                <span className="text-gray-500">Players </span>
                                <span className="text-purple-400 font-bold">{match.totalPlayers}</span>
                              </div>
                            )}
                          </div>
                          {match.startTime && (
                            <div className="text-xs">
                              <span className="text-gray-500">Start </span>
                              <span className="text-yellow-400 font-bold">
                                {new Date(match.startTime).toLocaleString("en-BD")}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                      {notif?.createdAt && (
                        <p className="text-gray-600 text-[10px] mt-2">
                          {new Date(notif.createdAt).toLocaleString("en-BD")}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── LUDO TOURNAMENT PAGE ────────────────────────────────────────────────────
function LudoTournamentPage({ currentUser, token, onBack, onRefreshBalance }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("upcoming");
  const [joining, setJoining] = useState(null);
  const [msg, setMsg] = useState("");

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

  const handleJoin = async (matchId, entryFee) => {
    if (!currentUser?.id && !currentUser?._id) { setMsg("আগে login করুন"); return; }
    setJoining(matchId);
    setMsg("");
    try {
      const res = await fetch(`${CLEAN_API_URL}/ludo-tournament/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ matchId, userId: currentUser?.id || currentUser?._id }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg("✅ Successfully joined!");
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

  const FILTERS = [
    { id: "upcoming", label: "🕐 Upcoming" },
    { id: "live", label: "🔴 Live" },
    { id: "completed", label: "✅ Done" },
  ];
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
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                filter === f.id ? "bg-white text-violet-600" : "bg-white/15 text-white/70"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {msg && (
        <div className={`mx-4 mt-3 p-3 rounded-xl text-sm font-semibold text-center ${
          msg.startsWith("✅") ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"
        }`}>
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
                  {match.status === "upcoming" && (
                    isJoined ? (
                      <div className="w-full py-3 rounded-xl bg-green-500/15 text-green-400 text-sm font-bold text-center border border-green-500/20">✅ Already Joined</div>
                    ) : isFull ? (
                      <div className="w-full py-3 rounded-xl bg-red-500/15 text-red-400 text-sm font-bold text-center border border-red-500/20">❌ Full</div>
                    ) : (
                      <button onClick={() => handleJoin(match._id, match.entryFee)} disabled={joining === match._id} className="w-full py-3 rounded-xl font-black text-sm text-white active:scale-95 transition-all disabled:opacity-60" style={{ background: `linear-gradient(135deg, ${mc}, #4f46e5)` }}>
                        {joining === match._id ? "Joining..." : `Join Now • ৳${match.entryFee}`}
                      </button>
                    )
                  )}
                  {match.status === "completed" && (
                    <div className="w-full py-3 rounded-xl bg-gray-500/10 text-gray-400 text-sm font-bold text-center border border-gray-500/20">✅ Completed</div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Main AppDashboard ────────────────────────────────────────────────────────
const AppDashboard = ({ onLogout }) => {
  const [tab, setTab] = useState("play");
  const [screen, setScreen] = useState("home");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [matches, setMatches] = useState([]);
  const [selectedResult, setSelectedResult] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [dashboardBalance, setDashboardBalance] = useState(0);

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const currentToken = localStorage.getItem("token") || "";
  const currentUserUid = currentUser?.uid || currentUser?.gameUID || currentUser?._id || "";

  const fetchDashboardBalance = async () => {
    if (!currentToken) return;
    try {
      const res = await axios.get(`${CLEAN_API_URL}/users/balance`, {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      setDashboardBalance(res.data.balance || 0);
    } catch (err) {
      console.error("Dashboard balance fetch error:", err);
    }
  };

  useEffect(() => {
    fetchDashboardBalance();
    const bInterval = setInterval(fetchDashboardBalance, 5000);
    return () => clearInterval(bInterval);
  }, [currentToken]);

  const getMatchCount = (categoryKey) =>
    matches.filter((m) => m.category === categoryKey && m.status !== "completed").length;

  useEffect(() => {
    const loadMatches = async () => {
      try {
        const res = await fetch(`${CLEAN_API_URL}/matches`);
        const data = await res.json();
        let safeData = Array.isArray(data) ? data : data?.data || data?.matches || [];
        setMatches(safeData);
      } catch (err) {
        setMatches([]);
      }
    };
    loadMatches();
    const interval = setInterval(loadMatches, 15000);
    return () => clearInterval(interval);
  }, []);
 
  const categories = [
    { key: "br_solo",     title: "BR Solo",         img: "/image/cards/BRMatchcard.png" },
    { key: "br_match",    title: "BR Match",         img: "/image/cards/BRMatchcard.png" },
    { key: "br_survival", title: "BR Survival",      img: "/image/cards/solo.png" },
    { key: "br_duo",      title: "BR Duo (2vs2)",    img: "/image/cards/2vs2.png" },
    { key: "br_squad",    title: "BR Squad (4vs4)",  img: "/image/cards/squard.png" },
    { key: "clash_squad", title: "Clash Squad 4vs4", img: "/image/cards/squard.png" },
    { key: "cs_2vs2",     title: "CS 2vs2",          img: "/image/cards/2vs2.png" },
    { key: "lone_wolf",   title: "Lone Wolf (1vs1)", img: "/image/cards/longwolf.png" },
    { key: "tdm_6v6",     title: "TDM 6vs6",         img: "/image/cards/squard.png" },
    { key: "training",    title: "Training Match",   img: "/image/cards/freematch.png" },
  ];

  const sliderSlides = [
    { image: "/image/slider/facebook1.png", link: "https://www.facebook.com/share/1aF9S8AKDF/" },
    { image: "/image/slider/ludo.png", link: "/ludo" },
    { image: "/image/slider/telegram.png", link: "https://t.me/+EBjyieShuwk4MGQ1" },
    { image: "/image/slider/youtube.png", link: "https://www.youtube.com/watch?v=7uY-_hskZ4A" },
  ];

  if (showNotifications) return <NotificationsPage onBack={() => setShowNotifications(false)} />;

  if (tab === "profile") {
    if (screen === "wallet") return <Wallet onBack={() => setScreen("home")} />;
    if (screen === "withdraw") return <Withdraw onBack={() => setScreen("home")} />;
    if (screen === "all_rules") return <AllRulesPage onBack={() => setScreen("home")} />;
    if (screen === "my_profile") return <AccountInfo onBack={() => setScreen("home")} />;
    if (screen === "referral") return <Referral onBack={() => setScreen("home")} user={currentUser} token={currentToken} />;
    return (
      <Profile
        onLogout={onLogout}
        onWallet={() => setScreen("wallet")}
        onWithdraw={() => setScreen("withdraw")}
        onAllRules={() => setScreen("all_rules")}
        onMyProfile={() => setScreen("my_profile")}
        onReferral={() => setScreen("referral")}
      />
    );
  }

  if (tab === "matches") return <MyMatch />;

  // ─── Results / Leaderboard Tab ───────────────────────────────────────────
  if (tab === "leaderboard") {
    if (selectedResult) {
      return (
        <div className="min-h-screen bg-[#0a0e1a]">
          {/* Back Button */}
          <div className="sticky top-0 z-50 bg-[#0a0e1a]/95 backdrop-blur border-b border-white/5 px-4 py-3 flex items-center gap-3">
            <button
              onClick={() => setSelectedResult(null)}
              className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white text-base active:scale-95 transition-all"
            >
              ←
            </button>
            <div>
              <p className="text-white font-extrabold text-sm leading-tight">
                {selectedResult.title || "Match Result"}
              </p>
              <p className="text-gray-500 text-[11px]">Back to Results</p>
            </div>
          </div>
          <MatchResultsPage {...selectedResult} currentUserUid={currentUserUid} />
        </div>
      );
    }
    return (
      <ResultsListPage
        onSelectResult={setSelectedResult}
        currentUserUid={currentUserUid}
      />
    );
  }

  if (screen === "category") {
    return (
      <MatchList
        category={selectedCategory}
        title={categories.find((c) => c.key === selectedCategory)?.title}
        onBack={() => { setScreen("home"); setSelectedCategory(""); }}
        tab={tab} setTab={setTab}
      />
    );
  }
  if (screen === "ludo") {
    return <LudoTournamentPage currentUser={currentUser} token={currentToken} onBack={() => setScreen("home")} onRefreshBalance={fetchDashboardBalance} />;
  }

  // ─── Home Screen ──────────────────────────────────────────────────────────
  return (
    <div className="bg-gray-50 min-h-screen mx-auto pb-24">

      {/* Top Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 px-4 pt-5 pb-4 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-white font-black text-lg">
                {(currentUser?.name || "P")[0].toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-white/80 text-[11px] font-medium">Welcome back</p>
              <p className="text-white font-extrabold text-sm truncate max-w-[150px]">
                {currentUser?.name || "Player"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-white/15 backdrop-blur px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <span className="text-yellow-300 text-xs">💰</span>
              <span className="text-white font-black text-xs">
                ৳ {dashboardBalance.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <NotificationBell onOpen={() => setShowNotifications(true)} />
          </div>
        </div>
      </div>

      <div className="p-4">

        {/* Slider */}
        <ClickableSlider slides={sliderSlides} />

        {/* Live Marquee */}
        <div className="mt-4 bg-[#111827] border border-orange-500/30 rounded-2xl overflow-hidden">
          <marquee scrollamount="6" className="py-2 text-orange-400 text-sm font-extrabold">
            🎮 uthiYo ESPORTS • FREE FIRE LIVE MATCH • DAILY SCRIMS • WIN REAL CASH • JOIN NOW 🚀
          </marquee>
        </div>

        {/* Ludo Banner */}
        <div
          onClick={() => setScreen("ludo")}
          className="mt-4 rounded-2xl overflow-hidden cursor-pointer active:scale-95 transition-all"
          style={{ background: "linear-gradient(135deg, #4c1d95, #1e1b4b)" }}
        >
          <div className="p-4 flex items-center justify-between">
            <div>
              <p className="text-white text-lg font-extrabold">🎲 Ludo Tournament</p>
              <p className="text-violet-300 text-xs">1v1 • 2v2 • 4 Player • Win Cash!</p>
            </div>
            <p className="text-4xl">🎲</p>
          </div>
        </div>

        {/* Categories Heading */}
        <div className="flex items-center justify-between mt-6 px-1">
          <h2 className="font-black text-gray-800 text-lg tracking-tight uppercase">
            Free Fire <span className="text-orange-500">Arena</span>
          </h2>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          {categories.map((cat) => {
            const count = getMatchCount(cat.key);
            return (
              <div
                key={cat.key}
                onClick={() => { setSelectedCategory(cat.key); setScreen("category"); }}
                className="relative rounded-2xl overflow-hidden h-28 cursor-pointer shadow-md active:scale-95 transition-all"
              >
                <img src={cat.img} alt={cat.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <p className="text-white font-extrabold text-sm">{cat.title}</p>
                  {count > 0 && <p className="text-cyan-400 text-xs font-bold">{count} Live</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <BottomMenu tab={tab} setTab={setTab} />
    </div>
  );
};

// ─── Profile Component ────────────────────────────────────────────────────────
const Profile = ({ onLogout, onAllRules, onMyProfile, onReferral }) => {
  const [balance, setBalance] = useState(0);
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  const fetchProfileBalance = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${CLEAN_API_URL}/users/balance`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBalance(res.data.balance || 0);
    } catch (err) {
      console.error("Profile balance error:", err);
    }
  };

  useEffect(() => {
    fetchProfileBalance();
    const interval = setInterval(fetchProfileBalance, 5000);
    return () => clearInterval(interval);
  }, [token]);

  const menuItems = [
    { id: "wallet",      label: "Wallet / Add Money", icon: "👛" },
    { id: "withdraw",    label: "Withdraw",            icon: "💵" },
    { id: "referral",    label: "Refer & Earn",        icon: "🎁" },
    { id: "my_profile",  label: "Account Info",        icon: "👤" },
    { id: "all_rules",   label: "All Rules",           icon: "📋" },
    { id: "top_players", label: "Top Players",         icon: "📈" },
  ];

  const handleNavigate = (id) => {
    if (id === "wallet")     setShowAddMoney(true);
    if (id === "withdraw")   setShowWithdraw(true);
    if (id === "all_rules")  onAllRules();
    if (id === "my_profile") onMyProfile();
    if (id === "referral")   onReferral();
  };

  return (
    <>
      <div className="bg-white min-h-screen pb-10">
        <div className="bg-gradient-to-b from-[#56CCF2] to-[#2F80ED] pt-12 pb-8 text-center text-white">
          <div className="w-20 h-20 bg-yellow-400 rounded-full mx-auto mb-3 flex items-center justify-center text-4xl">
            👨‍💻
          </div>
          <h2 className="text-xl font-bold">{user?.name || "User"}</h2>
          <p className="text-blue-100 text-sm mt-1">{user?.phone || ""}</p>
          <div className="mt-4 bg-white/20 rounded-2xl px-6 py-3 inline-block">
            <p className="text-xs text-blue-100">ব্যালেন্স</p>
            <p className="text-2xl font-black">
              ৳ {balance.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="mt-4 px-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.id)}
              className="w-full flex justify-between items-center p-4 border-b hover:bg-gray-50 transition"
            >
              <div className="flex gap-4 items-center">
                <span className="text-xl">{item.icon}</span>
                <span className="font-bold text-sm">{item.label}</span>
              </div>
              <span className="text-gray-400">›</span>
            </button>
          ))}
        </div>

        <div className="px-8 mt-12">
          <button
            onClick={onLogout}
            className="w-full bg-blue-500 text-white py-3 rounded-full font-bold"
          >
            Logout
          </button>
        </div>
      </div>

      <AddMoneyModal
        isOpen={showAddMoney}
        onClose={() => {
          setShowAddMoney(false);
          fetchProfileBalance();
        }}
      />
      <Withdraw
        isOpen={showWithdraw}
        onClose={() => {
          setShowWithdraw(false);
          fetchProfileBalance();
        }}
      />
    </>
  );
};

export default AppDashboard;