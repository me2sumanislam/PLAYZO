 import React, { useState, useEffect, useCallback } from "react";
import MatchCard from "../MatchCard/MatchCard";
import BottomMenu from "../../Component/BottomMenu/BottomMenu";

const API_BASE =
import.meta.env.VITE_API_URL || "https://playzo-vn8e.onrender.com/api";

const MatchList = ({ onBack, onJoinSuccess, tab, setTab }) => {
const [matches, setMatches] = useState([]);
const [loading, setLoading] = useState(true);
const [openCategory, setOpenCategory] = useState(null);

const fetchMatches = useCallback(async () => {
setLoading(true);


try {
  const res = await fetch(`${API_BASE}/matches`);
  const data = await res.json();

  let allMatches = [];

  if (Array.isArray(data)) allMatches = data;
  else if (Array.isArray(data?.data)) allMatches = data.data;
  else if (Array.isArray(data?.matches)) allMatches = data.matches;

  allMatches = allMatches.filter(
    (m) => m.status !== "completed" && m.status !== "cancelled"
  );

  setMatches(allMatches);
} catch (err) {
  console.log(err);
} finally {
  setLoading(false);
}


}, []);

useEffect(() => {
fetchMatches();
}, [fetchMatches]);

useEffect(() => {
const interval = setInterval(() => {
fetchMatches();
}, 10000);


return () => clearInterval(interval);


}, [fetchMatches]);

const grouped = matches.reduce((acc, m) => {
const cat = m.category || "Other";
if (!acc[cat]) acc[cat] = [];
acc[cat].push(m);
return acc;
}, {});

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

return ( <div className="bg-gray-100 min-h-screen pb-24">


  {/* HEADER */}
  <div className="bg-white p-4 flex items-center justify-between shadow sticky top-0 z-10">
    <div className="flex items-center gap-3">
      <button
        onClick={onBack}
        className="text-2xl font-bold"
      >
        ←
      </button>

      <div>
        <h2 className="font-bold">Match Categories</h2>
        <p className="text-xs text-gray-500">
          Total: {Object.keys(grouped).length}
        </p>
      </div>
    </div>
  </div>

  {/* CONTENT */}
  {loading ? (
    <div className="flex justify-center py-20">
      <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  ) : (
    <div className="p-3 space-y-4">

      {Object.entries(grouped).map(([cat, list]) => {
        const open = openCategory === cat;

        return (
          <div key={cat} className="bg-white rounded-xl overflow-hidden">

            {/* CATEGORY */}
            <div
              onClick={() =>
                setOpenCategory(open ? null : cat)
              }
              className="p-4 flex justify-between items-center cursor-pointer"
            >
              <div>
                <h3 className="font-bold uppercase">
                  {cat}
                </h3>
                <p className="text-xs text-gray-500">
                  Click to open matches
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                  {list.length}
                </span>
                <span>{open ? "▲" : "▼"}</span>
              </div>
            </div>

            {/* MATCH LIST */}
            {open && (
              <div className="p-3 bg-gray-50 space-y-3">
                {list.map((match) => (
                  <MatchCard
                    key={match._id}
                    match={match}
                    onJoinSuccess={(newBalance) =>
                      handleJoinSuccess(match._id, newBalance)
                    }
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  )}

  {tab && setTab && (
    <BottomMenu tab={tab} setTab={setTab} />
  )}
</div>


);
};

export default MatchList;
