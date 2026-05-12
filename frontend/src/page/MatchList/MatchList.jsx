 import React, { useState, useEffect, useCallback } from "react";
import MatchCard from "../MatchCard/MatchCard";
const API = "https://playzo-vn8e.onrender.com/api";
const MatchList = ({ category, onBack, onJoinSuccess, title }) => {
  const [matches, setMatches]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing]   = useState(false);

  const fetchMatches = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res  = await fetch(`${API}/api/matches`);
      const data = await res.json();
      let all = Array.isArray(data) ? data : data?.data || [];

      if (category) {
        all = all.filter(
          (m) => (m.category || "").toLowerCase().trim() === category.toLowerCase().trim()
        );
      }

      setMatches(all);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Match fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [category]);

  // first load
  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  // auto refresh — 10 সেকেন্ড
  useEffect(() => {
    const interval = setInterval(() => fetchMatches(), 10 * 1000);
    return () => clearInterval(interval);
  }, [fetchMatches]);

  const handleJoinSuccess = (matchId, newBalance) => {
    setMatches((prev) =>
      prev.map((m) =>
        m._id === matchId
          ? { ...m, joinedPlayers: (m.joinedPlayers || 0) + 1 }
          : m
      )
    );
    if (onJoinSuccess) onJoinSuccess(matchId, newBalance);
  };

  return (
    <div className="bg-gray-100 min-h-screen max-w-[450px] mx-auto pb-24">

      {/* HEADER */}
      <div className="bg-white p-4 flex items-center justify-between shadow">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-lg font-bold">←</button>
          <h2 className="font-bold uppercase">{title}</h2>
        </div>

        {/* Manual Refresh */}
        <button
          onClick={() => fetchMatches(true)}
          disabled={refreshing}
          className="flex items-center gap-1 text-xs font-bold text-orange-500 bg-orange-50 px-3 py-1.5 rounded-full border border-orange-200 active:scale-95 transition-all disabled:opacity-50"
        >
          {refreshing ? (
            <span className="inline-block w-3 h-3 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          ) : "🔄"}
          {refreshing ? "Updating..." : "Refresh"}
        </button>
      </div>

      {/* COUNT + LAST UPDATED */}
      <div className="px-3 py-2 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Total: <b>{matches.length}</b> matches
        </p>
        {lastUpdated && (
          <p className="text-[10px] text-gray-400">
            {lastUpdated.toLocaleTimeString("en-BD", {
              hour: "2-digit", minute: "2-digit", second: "2-digit"
            })}
          </p>
        )}
      </div>

      {/* Auto refresh indicator */}
      <div className="px-3 mb-2">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] text-gray-400">Auto refresh every 10 seconds</span>
        </div>
      </div>

      {/* LIST */}
      <div className="p-3 space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400">Loading matches...</p>
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🎮</p>
            <p className="text-gray-400 font-bold">No Match Available</p>
            <p className="text-gray-300 text-xs mt-1">Check back later</p>
          </div>
        ) : (
          matches.map((match) => (
            <MatchCard
              key={match._id || match.id}
              match={match}
              onJoinSuccess={(newBalance) =>
                handleJoinSuccess(match._id || match.id, newBalance)
              }
            />
          ))
        )}
      </div>

    </div>
  );
};

export default MatchList;