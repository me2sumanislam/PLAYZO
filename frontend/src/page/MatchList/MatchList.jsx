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
try {
const res = await fetch(`${API_BASE}/matches`);
const data = await res.json();

```
  let allMatches = [];

  if (Array.isArray(data)) {
    allMatches = data;
  } else if (Array.isArray(data?.data)) {
    allMatches = data.data;
  }

  allMatches = allMatches.filter(
    (m) => m.status !== "completed" && m.status !== "cancelled"
  );

  setMatches(allMatches);
} catch (err) {
  console.log(err);
} finally {
  setLoading(false);
}
```

}, []);

useEffect(() => {
fetchMatches();
}, [fetchMatches]);

// GROUP MATCHES BY CATEGORY
const groupedMatches = matches.reduce((acc, match) => {
const cat = match.category || "Other";

```
if (!acc[cat]) {
  acc[cat] = [];
}

acc[cat].push(match);

return acc;
```

}, {});

const handleJoinSuccess = (matchId, newBalance) => {
setMatches((prev) =>
prev.map((m) =>
m._id === matchId
? { ...m, joinedPlayers: (m.joinedPlayers || 0) + 1 }
: m
)
);

```
if (onJoinSuccess) {
  onJoinSuccess(matchId, newBalance);
}
```

};

return ( <div className="bg-gray-100 min-h-screen pb-24">

```
  {/* HEADER */}
  <div className="bg-white p-4 flex items-center gap-3 shadow sticky top-0 z-10">
    <button
      onClick={onBack}
      className="text-2xl font-bold text-gray-700"
    >
      ←
    </button>

    <div>
      <h2 className="font-bold text-gray-800">
        🎮 Match Categories
      </h2>

      <p className="text-xs text-gray-500">
        Total Categories: {Object.keys(groupedMatches).length}
      </p>
    </div>
  </div>

  {loading ? (
    <div className="flex justify-center items-center py-20">
      <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  ) : (
    <div className="p-3 space-y-4">

      {Object.entries(groupedMatches).map(([category, categoryMatches]) => {
        const isOpen = openCategory === category;

        return (
          <div
            key={category}
            className="bg-white rounded-2xl shadow-sm overflow-hidden"
          >

            {/* CATEGORY CARD */}
            <div
              onClick={() =>
                setOpenCategory(isOpen ? null : category)
              }
              className="p-4 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all"
            >

              <div>
                <h3 className="font-bold text-gray-800 uppercase">
                  {category.replace(/_/g, " ")}
                </h3>

                <p className="text-xs text-gray-500 mt-1">
                  Click to view matches
                </p>
              </div>

              <div className="flex items-center gap-3">

                {/* MATCH COUNT BADGE */}
                <div className="bg-orange-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                  {categoryMatches.length}
                </div>

                <div className="text-xl">
                  {isOpen ? "▲" : "▼"}
                </div>
              </div>
            </div>

            {/* MATCHES */}
            {isOpen && (
              <div className="p-3 bg-gray-50 border-t space-y-3">

                {categoryMatches.map((match) => (
                  <MatchCard
                    key={match._id || match.id}
                    match={match}
                    onJoinSuccess={(newBalance) =>
                      handleJoinSuccess(
                        match._id || match.id,
                        newBalance
                      )
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
