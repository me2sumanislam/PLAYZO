 import React, { useState, useEffect, useCallback } from "react";
import MatchCard from "../MatchCard/MatchCard";
import BottomMenu from "../../Component/BottomMenu/BottomMenu";

const API_BASE = import.meta.env.VITE_API_URL || "https://playzo-vn8e.onrender.com/api";

const MatchList = ({ category: initialCategory, onBack, onJoinSuccess, title, tab, setTab }) => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState(initialCategory || "all");

  const categories = [
    { key: "all", label: "All Matches", emoji: "🎮" },
    { key: "classic", label: "Classic", emoji: "🏟️" },
    { key: "tdm", label: "TDM", emoji: "⚔️" },
    { key: "ranked", label: "Ranked", emoji: "🏆" },
    { key: "custom", label: "Custom", emoji: "🔧" },
    { key: "ludo", label: "Ludo", emoji: "🎲" },
  ];

  const fetchMatches = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/matches`);
      const data = await res.json();
      let allMatches = Array.isArray(data) ? data : data?.data || [];

      let filtered = allMatches;
      if (activeCategory !== "all") {
        filtered = allMatches.filter(m => 
          (m.category || "").toLowerCase() === activeCategory.toLowerCase()
        );
      }

      filtered = filtered.filter(m => 
        m.status !== "completed" && m.status !== "cancelled"
      );

      setMatches(filtered);
    } catch (err) {
      setError("Failed to load matches");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeCategory]);

  useEffect(() => { fetchMatches(); }, [fetchMatches]);
  useEffect(() => {
    const interval = setInterval(() => fetchMatches(), 10000);
    return () => clearInterval(interval);
  }, [fetchMatches]);

  // Get count for each category (এখানে সব ম্যাচ থেকে কাউন্ট করা হচ্ছে)
  const categoryCounts = React.useMemo(() => {
    const counts = { all: matches.length };
    categories.forEach(cat => {
      if (cat.key !== "all") {
        counts[cat.key] = matches.filter(m => 
          (m.category || "").toLowerCase() === cat.key
        ).length;
      }
    });
    return counts;
  }, [matches]);

  return (
    <div className="bg-gray-100 min-h-screen pb-24">
      {/* ==================== CATEGORY CARDS ==================== */}
      <div className="grid grid-cols-3 gap-3 p-4">
        {categories.map((cat) => {
          const count = categoryCounts[cat.key] || 0;
          return (
            <div
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`relative bg-white rounded-3xl p-4 shadow-md border-2 transition-all active:scale-[0.97] cursor-pointer overflow-hidden ${
                activeCategory === cat.key 
                  ? "border-orange-500 shadow-orange-100" 
                  : "border-gray-100"
              }`}
            >
              {/* Improved Badge */}
              <div className="absolute -top-1.5 -right-1.5 bg-gradient-to-br from-orange-500 to-red-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-2xl shadow-md min-w-[22px] text-center flex items-center justify-center">
                {count}
              </div>

              <div className="flex flex-col items-center text-center pt-1">
                <div className="text-4xl mb-3">{cat.emoji}</div>
                <p className="font-bold text-sm text-gray-800 leading-tight tracking-tight">
                  {cat.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ==================== HEADER ==================== */}
      <div className="bg-white px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-2xl font-bold text-gray-700">←</button>
          <div>
            <h2 className="font-bold text-lg text-gray-800">
              {activeCategory === "all" ? title : activeCategory.toUpperCase()}
            </h2>
            <p className="text-xs text-gray-500">{matches.length} Matches</p>
          </div>
        </div>

        <button
          onClick={() => fetchMatches(true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 text-xs font-bold text-orange-600 bg-orange-50 px-4 py-2 rounded-2xl border border-orange-200 active:scale-95 disabled:opacity-60"
        >
          {refreshing ? "⏳" : "🔄"} Refresh
        </button>
      </div>

      {/* MATCH LIST */}
      <div className="p-3 space-y-3">
        {loading ? (
          <div className="flex flex-col items-center py-20">
            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl">
            <p className="text-5xl mb-3">🎮</p>
            <p className="font-bold">No matches available</p>
          </div>
        ) : (
          matches.map((match) => (
            <MatchCard
              key={match._id}
              match={match}
              onJoinSuccess={(newBalance) => handleJoinSuccess(match._id, newBalance)}
            />
          ))
        )}
      </div>

      {tab && setTab && <BottomMenu tab={tab} setTab={setTab} />}
    </div>
  );
};

export default MatchList;