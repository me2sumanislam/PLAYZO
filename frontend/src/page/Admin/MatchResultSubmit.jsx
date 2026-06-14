import React, { useState, useEffect, useCallback } from "react";
import api from "../../utils/api";

const MatchResultSubmit = () => {
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [players, setPlayers] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadMatches = useCallback(() => {
    api("/matches").then((d) => {
      const data = Array.isArray(d) ? d : d?.data || [];
      setMatches(data.filter((m) => m.status !== "completed"));
    });
  }, []);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  const handleMatchSelect = (id) => {
    const match = matches.find((m) => m._id === id);
    setSelectedMatch(match || null);
    setResults([]);

    // ✅ userId populate হলে _id নাও, না হলে সরাসরি toString()
    const joined = (match?.joinedUsers || []).map((p) => ({
      ...p,
      userId: p.userId?._id?.toString() || p.userId?.toString() || p.userId,
    }));
    setPlayers(joined);
  };

  // ✅ সব players একসাথে add
  const addAllPlayers = () => {
    const allResults = players.map((p) => ({
      userId: p.userId,
      inGameName: p.inGameName,
      position: "",
      kills: 0,
    }));
    setResults(allResults);
  };

  const addPlayerRow = () => {
    setResults([
      ...results,
      { userId: "", inGameName: "", position: "", kills: 0 },
    ]);
  };

  const handlePlayerSelect = (index, userId) => {
    const player = players.find((p) => p.userId === userId);
    const updated = [...results];
    updated[index].userId = userId;
    updated[index].inGameName = player?.inGameName || "";
    setResults(updated);
  };

  const handleChange = (index, field, value) => {
    const updated = [...results];
    updated[index][field] = value;
    setResults(updated);
  };

  const calcPrize = (position, kills) => {
    if (!selectedMatch) return 0;
    let prize = (kills || 0) * (selectedMatch.perKill || 0);
    if (position == 1) prize += selectedMatch.prizes?.first || 0;
    else if (position == 2) prize += selectedMatch.prizes?.second || 0;
    else if (position == 3) prize += selectedMatch.prizes?.third || 0;
    else if (position == 4) prize += selectedMatch.prizes?.fourth || 0;
    return Math.floor(prize);
  };

  const isUserAlreadyAdded = (userId, currentIndex) =>
    results.some((r, i) => i !== currentIndex && r.userId === userId);

  const totalPrize = results.reduce(
    (sum, r) => sum + calcPrize(r.position, r.kills),
    0,
  );

   const startMatch = async () => {
  if (!selectedMatch) {
    return alert("Match select করুন");
  }

  try {
    const res = await api(
      `/matches/live/${selectedMatch._id}`,
      {
        method: "PUT",
      },
    );

    if (res.success) {
      alert(res.message);

      // match status instantly update
      setSelectedMatch({
        ...selectedMatch,
        status: "live",
      });

      // reload matches
      loadMatches();
    } else {
      alert("❌ " + res.message);
    }
  } catch (err) {
    console.error(err);

    alert("Server Error!");
  }
};

  const submitResult = async () => {
    if (!selectedMatch) return alert("Match select করুন");
    if (results.length === 0) return alert("কমপক্ষে একজন player যোগ করুন");

    const hasEmpty = results.some((r) => !r.userId);
    if (hasEmpty) return alert("সব player select করুন");

    const positions = results
      .map((r) => Number(r.position))
      .filter((p) => p > 0);
    if (positions.length !== new Set(positions).size) {
      return alert("একই position দুজনকে দেওয়া যাবে না");
    }

    const userIds = results.map((r) => r.userId);
    if (userIds.length !== new Set(userIds).size) {
      return alert("একই player দুইবার যোগ করা যাবে না");
    }

    setLoading(true);
    try {
      const res = await api(`/admin/matches/${selectedMatch._id}/result`, {
        method: "PUT",
        body: JSON.stringify({
          results: results.map((r) => ({
            userId: r.userId,
            inGameName: r.inGameName,
            position: Number(r.position) || 0,
            kills: Number(r.kills) || 0,
          })),
        }),
      });

      if (res.success) {
        alert("✅ Result submit হয়েছে! Prize distribute হয়েছে।");
        setResults([]);
        setSelectedMatch(null);
        setPlayers([]);
        loadMatches();
      } else {
        alert("❌ " + res.message);
      }
    } catch {
      alert("Server error!");
    }
    setLoading(false);
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-lg font-black text-slate-800 mb-4">
        🏆 Match Result Submit
      </h2>

      {/* Match Select */}
      <select
        className="w-full p-3 border rounded-xl text-sm mb-4 focus:outline-none focus:border-orange-500"
        onChange={(e) => handleMatchSelect(e.target.value)}
        value={selectedMatch?._id || ""}
      >
        <option value="">-- Match select করুন --</option>
        {matches.map((m) => (
          <option key={m._id} value={m._id}>
            {m.title} ({m.joinedPlayers}/{m.totalPlayers}) — {m.status}
          </option>
        ))}
      </select>

      {/* Selected Match Info */}
      {selectedMatch && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-4 text-xs">
          <p className="font-bold text-orange-700">{selectedMatch.title}</p>
          <p className="text-gray-600 mt-1">
            Per Kill: ৳{selectedMatch.perKill} &nbsp;|&nbsp; 1st: ৳
            {selectedMatch.prizes?.first} &nbsp;|&nbsp; 2nd: ৳
            {selectedMatch.prizes?.second} &nbsp;|&nbsp; 3rd: ৳
            {selectedMatch.prizes?.third}
          </p>
          <p className="text-gray-500 mt-1">
            Joined Players: <strong>{players.length} জন</strong>
          </p>
        </div>
      )}

      {selectedMatch && selectedMatch.status !== "live" && (
        <button
          onClick={startMatch}
          className="w-full py-3 bg-red-600 text-white rounded-xl font-black text-sm mb-4"
        >
          🚀 Start Match
        </button>
      )}

      {/* Joined Players Preview */}
      {selectedMatch && players.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4">
          <p className="text-xs font-bold text-slate-600 mb-2">
            📋 Joined Players ({players.length} জন)
          </p>
          <div className="flex flex-wrap gap-2">
            {players.map((p, i) => (
              <span
                key={i}
                className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700"
              >
                {p.inGameName
                  ? `${p.inGameName} — Slot #${p.slotNumber}`
                  : `Slot #${p.slotNumber}`}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Players Result Input */}
      {selectedMatch && (
        <div className="space-y-3">
          {/* Buttons */}
          <div className="flex gap-2">
            {/* ✅ সব players একসাথে */}
            <button
              onClick={addAllPlayers}
              disabled={
                players.length === 0 || results.length === players.length
              }
              className="flex-1 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-bold disabled:opacity-40"
            >
              ⚡ Add All {players.length} Players
            </button>
            {/* একজন একজন */}
            <button
              onClick={addPlayerRow}
              disabled={results.length >= players.length && players.length > 0}
              className="flex-1 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-bold disabled:opacity-40"
            >
              + Add Player
            </button>
          </div>

          {results.map((r, i) => (
            <div key={i} className="bg-white border rounded-xl p-3 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-gray-500">
                  Player #{i + 1}
                </span>
                <button
                  onClick={() =>
                    setResults(results.filter((_, idx) => idx !== i))
                  }
                  className="text-red-400 text-xs font-bold"
                >
                  ✕ Remove
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* Player Dropdown */}
                <div className="col-span-2">
                  <label className="text-xs text-gray-500 mb-1 block">
                    Player
                  </label>
                  <select
                    value={r.userId}
                    onChange={(e) => handlePlayerSelect(i, e.target.value)}
                    className="w-full p-2 border rounded-lg text-sm focus:outline-none focus:border-orange-500"
                  >
                    <option value="">-- Player select করুন --</option>
                    {players.map((p) => (
                      <option
                        key={p.userId}
                        value={p.userId}
                        disabled={isUserAlreadyAdded(p.userId, i)}
                      >
                        {p.inGameName
                          ? `${p.inGameName} — Slot #${p.slotNumber}`
                          : `Slot #${p.slotNumber}`}
                        {isUserAlreadyAdded(p.userId, i) ? " ✓" : ""}
                      </option>
                    ))}
                  </select>
                  {r.inGameName && (
                    <p className="text-xs text-green-600 font-semibold mt-1">
                      ✅ {r.inGameName}
                    </p>
                  )}
                </div>

                {/* Position */}
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">
                    Position
                  </label>
                  <select
                    value={r.position}
                    onChange={(e) =>
                      handleChange(i, "position", e.target.value)
                    }
                    className="w-full p-2 border rounded-lg text-sm focus:outline-none focus:border-orange-500"
                  >
                    <option value="">Select</option>
                    {Array.from({ length: 48 }, (_, n) => n + 1).map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Kills */}
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">
                    Kills
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={r.kills}
                    onChange={(e) => handleChange(i, "kills", e.target.value)}
                    className="w-full p-2 border rounded-lg text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Prize Preview */}
              <div className="mt-2 bg-green-50 rounded-lg p-2 text-center">
                <span className="text-xs text-gray-500">Estimated Prize: </span>
                <span className="text-green-700 font-black text-sm">
                  ৳{calcPrize(r.position, r.kills)}
                </span>
              </div>
            </div>
          ))}

          {/* Total Prize */}
          {results.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex justify-between items-center">
              <span className="text-sm font-bold text-green-700">
                Total Prize
              </span>
              <span className="text-green-700 font-black text-lg">
                ৳{totalPrize}
              </span>
            </div>
          )}

          {/* Submit Button */}
          {results.length > 0 && (
            <button
              onClick={submitResult}
              disabled={loading}
              className="w-full py-3 bg-green-700 text-white rounded-xl font-black text-sm disabled:opacity-50"
            >
              {loading
                ? "Submitting..."
                : `✅ Result Submit করুন (${results.length} players)`}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default MatchResultSubmit;
