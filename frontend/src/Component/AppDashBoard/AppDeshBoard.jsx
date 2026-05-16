 import React, { useState, useEffect } from "react";
import BottomMenu from "../BottomMenu/BottomMenu";
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
                  ৳{sorted[1].totalPrize}
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
                {/* Title + Category + Status */}
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
                {/* Top 3 Preview */}
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
                {/* My Result */}
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

// ─── Main AppDashboard ────────────────────────────────────────────────────────
const AppDashboard = ({ onLogout }) => {
  const [tab, setTab] = useState("play");
  const [screen, setScreen] = useState("home");
  const [slide, setSlide] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [matches, setMatches] = useState([]);
  const [selectedResult, setSelectedResult] = useState(null);
  const [resultTab, setResultTab] = useState("leaderboard");
const [refreshing, setRefreshing] = useState(false);
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const currentUserUid =
    currentUser?.uid || currentUser?.gameUID || currentUser?._id || "";

  // API Base Added Here
  const API_BASE = import.meta.env.VITE_API_URL || "https://playzo-vn8e.onrender.com/api";

  useEffect(() => {
  const loadMatches = async () => {
    try {
      const res = await fetch(`${API_BASE}/matches`);
      const data = await res.json();
      let safeData = [];
      if (Array.isArray(data)) safeData = data;
      else if (Array.isArray(data?.matches)) safeData = data.matches;
      else if (Array.isArray(data?.data)) safeData = data.data;
      setMatches(safeData);
    } catch (err) {
      console.error("Failed to load matches:", err);
      setMatches([]);
    }
  };

  loadMatches();
  const interval = setInterval(loadMatches, 10 * 1000);
  return () => clearInterval(interval);
}, [API_BASE]);
   
  
  useEffect(() => {
    const timer = setInterval(() => {
      setSlide((p) => (p === 2 ? 0 : p + 1));
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const categories = [
  { key: "br_match", title: "BR Match", img: "/image/img-1.jpg" },
  { key: "br_survival", title: "BR Survival", img: "/image/img-2.jpg" },
  { key: "clash_squad", title: "Clash Squad", img: "/image/img-3.jpg" },
  { key: "cs_2vs2", title: "CS 2vs2", img: "/image/img-1.jpg" },
  { key: "lone_wolf", title: "Lone Wolf", img: "/image/img-2.jpg" },
  { key: "training", title: "Training Match", img: "/image/img-3.jpg" },
];
  
  // --- PROFILE TAB ---
  if (tab === "profile") {
    if (screen === "wallet") {
      return (
        <div className="bg-white min-h-screen mx-auto pb-24">
          <Wallet onBack={() => setScreen("home")} />
          <BottomMenu tab={tab} setTab={setTab} />
        </div>
      );
    }
    if (screen === "withdraw") {
      return (
        <div className="bg-white min-h-screen mx-auto pb-24 shadow-xl">
          <Withdraw onBack={() => setScreen("home")} />
          <BottomMenu tab={tab} setTab={setTab} />
        </div>
      );
    }
    if (screen === "all_rules") {
      return (
        <div className="bg-white min-h-screen mx-auto">
          <AllRulesPage onBack={() => setScreen("home")} />
        </div>
      );
    }
    if (screen === "my_profile") {
      return (
        <div className="bg-white min-h-screen mx-auto">
          <AccountInfo onBack={() => setScreen("home")} />
        </div>
      );
    }
    return (
      <div className="bg-white min-h-screen mx-auto pb-24">
        <Profile
          onLogout={onLogout}
          onWallet={() => setScreen("wallet")}
          onWithdraw={() => setScreen("withdraw")}
          onAllRules={() => setScreen("all_rules")}
          onMyProfile={() => setScreen("my_profile")}
        />
        <BottomMenu tab={tab} setTab={setTab} />
      </div>
    );
  }
  // --- SHOP TAB ---
  if (tab === "shop") {
    return (
      <div className="bg-white min-h-screen mx-auto pb-24">
        <div className="p-4 text-center text-gray-400 mt-20 text-lg font-bold">
          🛒 Shop Coming Soon...
        </div>
        <BottomMenu tab={tab} setTab={setTab} />
      </div>
    );
  }
  // --- MY MATCHES TAB ---
  if (tab === "matches") {
    return (
      <div className="mx-auto min-h-screen">
        <MyMatch />
        <BottomMenu tab={tab} setTab={setTab} />
      </div>
    );
  }
  // --- RESULTS TAB ---
  if (tab === "results") {
    if (selectedResult) {
      return (
        <div className="mx-auto min-h-screen">
          <div className="bg-[#0a0e1a] px-4 pt-4">
            <button
              onClick={() => setSelectedResult(null)}
              className="flex items-center gap-2 text-orange-400 text-sm font-bold mb-2"
            >
              ← Back to Results
            </button>
          </div>
          <MatchResultsPage
            matchId={selectedResult.matchId || selectedResult._id}
            matchTitle={selectedResult.matchTitle}
            killPrice={selectedResult.killPrice}
            results={selectedResult.results}
            publishedAt={
              selectedResult.submittedAt || selectedResult.publishedAt
            }
            mapName={selectedResult.mapName}
            currentUserUid={currentUserUid}
          />
          <BottomMenu
            tab={tab}
            setTab={(t) => {
              setTab(t);
              setSelectedResult(null);
            }}
          />
        </div>
      );
    }
    return (
      <div className="mx-auto min-h-screen bg-[#f7f2fb]">
        <div
          style={{
            display: "flex",
            background: "#fff",
            borderBottom: "2px solid #ede9fe",
            position: "sticky",
            top: 0,
            zIndex: 40,
          }}
        >
          {[
            { id: "leaderboard", label: "🏆 Leaderboard" },
            { id: "matchresults", label: "📊 Match Results" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setResultTab(t.id)}
              style={{
                flex: 1,
                padding: "13px 0",
                border: "none",
                background: "transparent",
                fontWeight: 700,
                fontSize: 13,
                color: resultTab === t.id ? "#4f46e5" : "#9ca3af",
                borderBottom:
                  resultTab === t.id
                    ? "2px solid #4f46e5"
                    : "2px solid transparent",
                cursor: "pointer",
                transition: "all 0.2s",
                marginBottom: -2,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {resultTab === "leaderboard" ? (
          <Leaderboard />
        ) : (
          <ResultsListPage
            onSelectResult={(match) => setSelectedResult(match)}
            currentUserUid={currentUserUid}
          />
        )}
        <BottomMenu tab={tab} setTab={setTab} />
      </div>
    );
  }
  // --- CATEGORY SCREEN ---
  if (screen === "category") {
    return (
      <div className="mx-auto min-h-screen bg-white">
        <MatchList
          category={selectedCategory}
          title={selectedCategory}
          onBack={() => setScreen("home")}
          onJoinSuccess={(matchId, newBalance) => {
            const user = JSON.parse(localStorage.getItem("user") || "{}");
            localStorage.setItem(
              "user",
              JSON.stringify({ ...user, balance: newBalance }),
            );
          }}
        />
        <BottomMenu tab={tab} setTab={setTab} />
      </div>
    );
  }
  // --- HOME SCREEN ---
  return (
    <div className="bg-gray-50 min-h-screen mx-auto pb-24">
      <div className="p-4">
        <div className="relative w-full h-44 overflow-hidden rounded-3xl shadow-lg border-4 border-white">
          {categories.slice(0, 3).map((c, i) => (
            <img
              key={i}
              src={c.img}
              className="absolute w-full h-full object-cover transition-opacity duration-1000"
              style={{ opacity: slide === i ? 1 : 0 }}
              alt="Slider"
            />
          ))}
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  slide === i ? "w-6 bg-white" : "w-1.5 bg-white/50"
                }`}
              />
            ))}
          </div>
        </div>
         
{/* Live Marquee */}
 <div className="mt-4 bg-[#111827] border border-orange-500/30 rounded-2xl overflow-hidden">
  <marquee
    scrollamount="6"
    className="py-2 text-orange-400 text-sm font-extrabold"
  >
    🎮 uthiYo ESPORTS • FREE FIRE LIVE MATCH • DAILY SCRIMS • WIN REAL CASH • JOIN CUSTOM ROOM NOW 🚀
  </marquee>
</div>

{/* kichu na  */}



         <div className="flex items-center justify-between mt-6 px-1">
  <h2 className="font-black text-gray-800 text-lg tracking-tight uppercase">
    Free Fire <span className="text-orange-500">Arena</span>
  </h2>
  <div className="flex items-center gap-2">
    <span className="text-[10px] bg-orange-100 text-orange-600 px-2 py-1 rounded-md font-bold animate-pulse">
      LIVE NOW
    </span>
    <button
  onClick={async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`${API_BASE}/matches`);
      const data = await res.json();
      let safeData = [];
      if (Array.isArray(data)) safeData = data;
      else if (Array.isArray(data?.matches)) safeData = data.matches;
      else if (Array.isArray(data?.data)) safeData = data.data;
      setMatches(safeData);
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setRefreshing(false), 800);
    }
  }}
  disabled={refreshing}
  className="flex items-center justify-center w-8 h-8 bg-orange-50 border border-orange-200 rounded-full active:scale-95 transition-all disabled:opacity-70"
>
  <span
    className={`text-orange-500 text-sm ${refreshing ? "animate-spin" : ""}`}
  >
    🔄
  </span>
</button>
  </div>
</div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          {categories.map((c) => {
            const count = matches.filter(
              (m) => (m.category || "").toLowerCase().trim() === c.key,
            ).length;
            return (
              <div
                key={c.key}
                onClick={() => {
                  setSelectedCategory(c.key);
                  setScreen("category");
                }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2.5 cursor-pointer active:scale-95 transition hover:shadow-md"
              >
                <div className="relative">
                  <img
                    src={c.img}
                    className="h-28 w-full object-cover rounded-xl"
                    alt={c.title}
                  />
                  {count > 0 && (
                    <span className="absolute top-2 right-2 bg-green-500 text-white text-[9px] px-2 py-0.5 rounded-full font-bold">
                      {count}
                    </span>
                  )}
                </div>
                <div className="mt-2 ml-1">
                  <p className="text-xs font-black text-gray-800 uppercase tracking-wide">
                    {c.title}
                  </p>
                  <p className="text-[10px] text-gray-400 font-medium">
                    Join Tournament
                  </p>
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

export default AppDashboard;