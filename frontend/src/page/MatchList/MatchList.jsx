 import React, { useState, useEffect, useCallback } from "react";
import MatchCard from "../MatchCard/MatchCard";
import BottomMenu from "../../Component/BottomMenu/BottomMenu";

const API_BASE =
  import.meta.env.VITE_API_URL || "https://playzo-vn8e.onrender.com/api";

const MatchList = ({ category, onBack, onJoinSuccess, title, tab, setTab }) => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchMatches = useCallback(
    async (isManual = false) => {
      if (isManual) setRefreshing(true);
      setError(null);

      try {
        const res = await fetch(`${API_BASE}/matches`);

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();

        let allMatches = [];
        if (Array.isArray(data)) {
          allMatches = data;
        } else if (Array.isArray(data?.data)) {
          allMatches = data.data;
        } else if (Array.isArray(data?.matches)) {
          allMatches = data.matches;
        } else {
          throw new Error("Invalid data format received");
        }

        let filteredMatches = allMatches;
        if (category) {
          filteredMatches = allMatches.filter((m) => {
            const matchCat = (m.category || "").toLowerCase().trim();
            const filterCat = category.toLowerCase().trim();
            return matchCat === filterCat;
          });
        }

        filteredMatches = filteredMatches.filter(
          (m) => m.status !== "completed" && m.status !== "cancelled",
        );

        setMatches(filteredMatches);
        setLastUpdated(new Date());
      } catch (err) {
        setError(err.message || "Failed to load matches");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [category],
  );

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  useEffect(() => {
    const interval = setInterval(() => fetchMatches(), 10 * 1000);
    return () => clearInterval(interval);
  }, [fetchMatches]);

  const handleJoinSuccess = (matchId, newBalance) => {
    setMatches((prev) =>
      prev.map((m) =>
        m._id === matchId
          ? { ...m, joinedPlayers: (m.joinedPlayers || 0) + 1 }
          : m,
      ),
    );
    if (onJoinSuccess) onJoinSuccess(matchId, newBalance);
  };

  return (
    <div className="bg-gray-100 min-h-screen pb-24">
      {/* HEADER */}
      <div className="bg-white p-4 flex items-center justify-between shadow sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="text-2xl font-bold text-gray-700 active:scale-95 transition-all"
          >
            ←
          </button>
          <div>
            <h2 className="font-bold uppercase text-gray-800">{title}</h2>
            <p className="text-xs text-gray-500">
              Category: {category || "All"}
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchMatches(true)}
          disabled={refreshing}
          className="flex items-center gap-1 text-xs font-bold text-orange-500 bg-orange-50 px-3 py-1.5 rounded-full border border-orange-200 active:scale-95 transition-all disabled:opacity-50"
        >
          {refreshing ? (
            <span className="inline-block w-3 h-3 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <span>🔄</span>
          )}
          {refreshing ? "Updating..." : "Refresh"}
        </button>
      </div>

      {/* COUNT + LAST UPDATED BAR */}
      <div className="px-4 py-3 bg-white border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Total Matches:</span>
          <span className="bg-orange-100 text-orange-600 text-sm font-bold px-3 py-1 rounded-2xl">
            {matches.length}
          </span>
        </div>

        {lastUpdated && (
          <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
            <span className="text-green-500">●</span>
            Updated:
            <span className="font-medium text-gray-500">
              {lastUpdated.toLocaleTimeString("en-BD", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        )}
      </div>

      {/* Auto refresh indicator */}
      <div className="px-3 py-2 bg-green-50 border-b border-green-100">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] text-green-600 font-medium">
            Auto refresh every 10 seconds
          </span>
        </div>
      </div>

      {/* ERROR STATE */}
      {error && (
        <div className="m-3 bg-red-50 border-2 border-red-200 rounded-xl p-4">
          <p className="text-red-700 font-bold text-sm mb-2">
            ⚠️ Error Loading Matches
          </p>
          <p className="text-red-600 text-xs mb-3 font-mono">{error}</p>
          <button
            onClick={() => fetchMatches(true)}
            className="w-full bg-red-500 text-white px-4 py-2 rounded-lg font-bold text-sm active:scale-95 transition-all"
          >
            🔄 Try Again
          </button>
        </div>
      )}

      {/* LOADING STATE */}
      {loading && !error ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-600 font-bold">Loading matches...</p>
          <p className="text-xs text-gray-400">Please wait</p>
        </div>
      ) : !error ? (
        /* MATCH LIST */
        <div className="p-3 space-y-3">
          {matches.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
              <p className="text-5xl mb-3">🎮</p>
              <p className="text-gray-700 font-bold text-lg">
                No Match Available
              </p>
              <p className="text-gray-400 text-sm mt-2">
                {category
                  ? `No ${category.replace(/_/g, " ")} matches found`
                  : "No matches available"}
              </p>
              <p className="text-gray-300 text-xs mt-1">Check back later</p>
              <button
                onClick={() => fetchMatches(true)}
                className="mt-4 bg-orange-500 text-white px-6 py-2 rounded-lg text-sm font-bold active:scale-95 transition-all"
              >
                🔄 Refresh Now
              </button>
            </div>
          ) : (
          matches.map((match) => (
              <MatchCard
                key={match._id || match.id}
                match={match}
                totalMatches={matches.length}   // Total matches count for badge
                onJoinSuccess={(newBalance) =>
                  handleJoinSuccess(match._id || match.id, newBalance)
                }
              />
            ))
          )}
        </div>
      ) : null}

      {/* Bottom Menu */}
      {tab && setTab && <BottomMenu tab={tab} setTab={setTab} />}
    </div>
  );
};

export default MatchList;