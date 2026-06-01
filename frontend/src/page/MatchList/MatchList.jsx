 import React, { useState, useEffect, useRef } from "react";
import MatchCard from "../MatchCard/MatchCard";
import BottomMenu from "../../Component/BottomMenu/BottomMenu";

const API_BASE = ((import.meta.env.VITE_API_URL || 'https://playzo-vn8e.onrender.com') + '/api').replace(/\/api\/api/, '/api');

// ✅ Pull-to-refresh — page change না করে শুধু data reload
const PullToRefresh = ({ onRefresh, children }) => {
  const startY = useRef(0);
  const pulling = useRef(false);

  const onTouchStart = (e) => {
    startY.current = e.touches[0].clientY;
    pulling.current = true;
  };

  const onTouchEnd = (e) => {
    if (!pulling.current) return;
    const diff = e.changedTouches[0].clientY - startY.current;
    if (diff > 80) onRefresh();
    pulling.current = false;
  };

  return (
    <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {children}
    </div>
  );
};

const MatchList = ({ category, title, onBack, onJoinSuccess, tab, setTab }) => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const fetchMatches = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch(`${API_BASE}/matches`);
      const data = await res.json();

      let allMatches = [];
      if (Array.isArray(data)) allMatches = data;
      else if (Array.isArray(data?.data)) allMatches = data.data;
      else if (Array.isArray(data?.matches)) allMatches = data.matches;

      if (category) {
        allMatches = allMatches.filter((m) =>
          (m.category || "").toLowerCase().trim() === category.toLowerCase().trim()
        );
      }

      allMatches = allMatches.filter(
        (m) => m.status !== "completed" && m.status !== "cancelled"
      );

      if (isMounted.current) {
        setMatches(allMatches);
        setLoading(false);
        setRefreshing(false);
      }
    } catch (err) {
      console.log(err);
      if (isMounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    fetchMatches();
    const interval = setInterval(() => fetchMatches(), 10000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  const handleRefresh = (e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    fetchMatches(true);
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="bg-gray-100 min-h-screen pb-24" style={{ overscrollBehaviorY: "contain" }}>

        {refreshing && (
          <div className="flex items-center justify-center py-2 bg-orange-50">
            <span className="inline-block w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mr-2" />
            <span className="text-xs text-orange-500 font-bold">Updating...</span>
          </div>
        )}

        {/* HEADER */}
        <div className="bg-white p-4 flex items-center justify-between shadow sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="text-2xl font-bold">←</button>
            <div>
              <h2 className="font-bold uppercase text-gray-800">
                {title || category?.replace(/_/g, " ") || "Matches"}
              </h2>
              <p className="text-xs text-gray-500">Total: {matches.length} matches</p>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1 text-xs font-bold text-orange-500 bg-orange-50 px-3 py-1.5 rounded-full border border-orange-200 active:scale-95 transition-all disabled:opacity-50"
          >
            <span className={refreshing ? "inline-block animate-spin" : ""}>🔄</span>
            {refreshing ? "Updating..." : "Refresh"}
          </button>
        </div>

        {/* CONTENT */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-600 font-bold">Loading matches...</p>
          </div>
        ) : (
          <div className="p-3 space-y-3">
            {matches.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
                <p className="text-5xl mb-3">🎮</p>
                <p className="text-gray-700 font-bold text-lg">No Match Available</p>
                <p className="text-gray-400 text-sm mt-2">
                  {category
                    ? `No ${category.replace(/_/g, " ")} matches found`
                    : "No matches available"}
                </p>
                <p className="text-gray-300 text-xs mt-1">Check back later</p>
                <button
                  onClick={handleRefresh}
                  className="mt-4 bg-orange-500 text-white px-6 py-2 rounded-lg text-sm font-bold active:scale-95 transition-all"
                >
                  🔄 Refresh Now
                </button>
              </div>
            ) : (
              matches.map((match) => (
                <MatchCard
                  key={match._id}
                  match={match}
                  totalMatches={null}
                  onJoinSuccess={(newBalance) =>
                    handleJoinSuccess(match._id, newBalance)
                  }
                />
              ))
            )}
          </div>
        )}

        {tab && setTab && <BottomMenu tab={tab} setTab={setTab} />}
      </div>
    </PullToRefresh>
  );
};

export default MatchList;