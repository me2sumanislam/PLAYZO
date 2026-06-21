import React, { useState } from "react";
import React, { useState, useEffect, useCallback } from "react";
import api from "../../utils/adminApi";

// Match mode config — category থেকে solo/team বোঝার জন্য
const MODE_CONFIG = {
  br_solo: { matchType: "solo", teamSize: 1, label: "BR Solo" },
  br_duo: { matchType: "team", teamSize: 2, label: "BR Duo 2vs2" },
  br_squad: { matchType: "team", teamSize: 4, label: "BR Squad 4vs4" },
  cs_solo: { matchType: "solo", teamSize: 1, label: "Clash Squad Solo" },
  cs_duo: { matchType: "team", teamSize: 2, label: "Clash Squad Duo" },
  cs_squad: { matchType: "team", teamSize: 4, label: "Clash Squad 4vs4" },
  cs_6vs6: { matchType: "team", teamSize: 6, label: "Clash Squad 6vs6" },
  lw_solo: { matchType: "solo", teamSize: 1, label: "Lone Wolf Solo" },
  lw_duo: { matchType: "team", teamSize: 2, label: "Lone Wolf Duo" },
  free_match: { matchType: "solo", teamSize: 1, label: "Free Match" },
  training: { matchType: "solo", teamSize: 1, label: "Training" },
  br_match: { matchType: "solo", teamSize: 1, label: "BR Match" },
  br_survival: { matchType: "solo", teamSize: 1, label: "BR Survival" },
  clash_squad: { matchType: "team", teamSize: 4, label: "Clash Squad" },
  cs_2vs2: { matchType: "team", teamSize: 2, label: "CS 2vs2" },
  lone_wolf: { matchType: "solo", teamSize: 1, label: "Lone Wolf" },
};

const getMatchMode = (match) => {
  const cfg = MODE_CONFIG[match?.category || "br_solo"] || MODE_CONFIG.br_solo;
  return {
    matchType: match?.matchType || cfg.matchType,
    teamSize: match?.teamSize || cfg.teamSize,
    label: cfg.label,
  };
};

const MatchResultSubmit = () => {
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [players, setPlayers] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Room details
  const [roomData, setRoomData] = useState({});
  const [roomMsg, setRoomMsg] = useState("");

  // Screenshots
  const [screenshots, setScreenshots] = useState([]);
  const [zoomedImg, setZoomedImg] = useState(null);

  // Team mode
  const [winnerTeam, setWinnerTeam] = useState("A");

  const loadMatches = useCallback(() => {
    api("/matches").then((d) => {
      const data = Array.isArray(d) ? d : d?.data || [];
      setMatches(data.filter((m) => m.status !== "completed"));
    });
  }, []);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  const loadScreenshots = useCallback(async (matchId) => {
    try {
      const res = await api(`/results/admin/match/${matchId}`);
      setScreenshots(res?.data || []);
    } catch {
      setScreenshots([]);
    }
  }, []);

  const handleMatchSelect = (id) => {
    const match = matches.find((m) => m._id === id);
    setSelectedMatch(match || null);
    setResults([]);
    setScreenshots([]);
    setWinnerTeam("A");
    if (id) loadScreenshots(id);

    // ✅ userId populate হলে _id নাও, না হলে সরাসরি toString()
    const joined = (match?.joinedUsers || []).map((p) => ({
      ...p,
      userId: p.userId?._id?.toString() || p.userId?.toString() || p.userId,
    }));
    setPlayers(joined);
  };

  // ✅ সব players একসাথে add (Solo)
  const addAllPlayers = () => {
    setResults(
      players.map((p) => ({
        userId: p.userId,
        inGameName: p.inGameName,
        position: "",
        kills: 0,
      })),
    );
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

  const prizePool = selectedMatch
    ? (selectedMatch.prizes?.first || 0) +
      (selectedMatch.prizes?.second || 0) +
      (selectedMatch.prizes?.third || 0) +
      (selectedMatch.prizes?.fourth || 0)
    : 0;
  const isOverBudget = prizePool > 0 && totalPrize > prizePool;

  // ── Team mode helpers ──────────────────────────────────────────
  const mode = selectedMatch ? getMatchMode(selectedMatch) : null;
  const isTeamMatch = mode?.matchType === "team";
  const teamPool = selectedMatch?.prizePool || selectedMatch?.winPrize || 0;
  const teamSize = selectedMatch ? getMatchMode(selectedMatch).teamSize || 1 : 1;
  const teamAPlayers = players.filter((p) => (p.team || "A") === "A");
  const teamBPlayers = players.filter((p) => (p.team || "A") === "B");
  const winnerCount =
    winnerTeam === "A" ? teamAPlayers.length : teamBPlayers.length;
  const prizeEach =
    winnerCount > 0
      ? Math.floor(teamPool / winnerCount)
      : Math.floor(teamPool / teamSize);

  const startMatch = async () => {
    if (!selectedMatch) return alert("Match select করুন");
    try {
      const res = await api(`/matches/live/${selectedMatch._id}`, {
        method: "PUT",
      });
      if (res.success) {
        alert(res.message);
        setSelectedMatch({ ...selectedMatch, status: "live" });
        loadMatches();
      } else {
        alert("❌ " + res.message);
      }
    } catch (err) {
      console.error(err);
      alert("Server Error!");
    }
  };

  const updateRoom = async () => {
    if (!selectedMatch) return;
    const d = await api(`/matches/update-room/${selectedMatch._id}`, {
      method: "PUT",
      body: JSON.stringify(roomData[selectedMatch._id] || {}),
    });
    setRoomMsg(d.success ? "✅ Room Updated!" : "❌ Failed");
    if (d.success) loadMatches();
  };

  // ── Submit (Solo) ────────────────────────────────────────────
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

    if (isOverBudget) {
      const ok = window.confirm(
        `⚠️ Total prize ৳${totalPrize} প্রাইজ পুল ৳${prizePool} এর বেশি! তবুও submit করবেন?`,
      );
      if (!ok) return;
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
        setScreenshots([]);
        loadMatches();
      } else {
        alert("❌ " + res.message);
      }
    } catch {
      alert("Server error!");
    }
    setLoading(false);
  };

  // ── Submit (Team) ────────────────────────────────────────────
  const submitTeamResult = async () => {
    if (!selectedMatch) return alert("Match select করুন");
    if (!winnerTeam) return alert("Winner team select করুন");

    const winnerPlayers = players.filter((p) => (p.team || "A") === winnerTeam);
    if (winnerPlayers.length === 0) return alert("Winner team-এ কোনো player নেই");

    const winnerUserIds = winnerPlayers.map((p) => p.userId).filter(Boolean);
    if (winnerUserIds.length === 0) return alert("Player userId পাওয়া যাচ্ছে না");

    setLoading(true);
    try {
      const res = await api(`/admin/matches/${selectedMatch._id}/result`, {
        method: "PUT",
        body: JSON.stringify({
          winnerUserIds,
          totalPrize: teamPool,
        }),
      });

      if (res.success) {
        alert("✅ " + res.message);
        setSelectedMatch(null);
        setPlayers([]);
        setScreenshots([]);
        loadMatches();
      } else {
        alert("❌ " + (res.message || "Failed"));
      }
    } catch {
      alert("Server Error");
    }
    setLoading(false);
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-lg font-black text-slate-800 mb-4">
        🏆 Match Result Submit
      </h2>

      {/* Zoom Modal */}
      {zoomedImg && (
        <div
          onClick={() => setZoomedImg(null)}
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center cursor-zoom-out"
        >
          <img
            src={zoomedImg}
            alt="zoomed"
            className="max-w-[92vw] max-h-[92vh] rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setZoomedImg(null)}
            className="absolute top-5 right-6 bg-white rounded-full w-9 h-9 font-black"
          >
            ✕
          </button>
        </div>
      )}

      {/* Match Select */}
      <select
        className="w-full p-3 border rounded-xl text-sm mb-4 focus:outline-none focus:border-orange-500"
        onChange={(e) => handleMatchSelect(e.target.value)}
        value={selectedMatch?._id || ""}
      >
        <option value="">-- Match select করুন --</option>
        {matches.map((m) => {
          const cfg = getMatchMode(m);
          return (
            <option key={m._id} value={m._id}>
              {m.title} ({m.joinedPlayers}/{m.totalPlayers}) — {cfg.label} —{" "}
              {m.status}
            </option>
          );
        })}
      </select>

      {/* Selected Match Info */}
      {selectedMatch && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-4 text-xs">
          <p className="font-bold text-orange-700">
            {selectedMatch.title}{" "}
            <span className="ml-1 text-[11px] font-medium text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
              {mode?.label}
            </span>
          </p>
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

      {/* Room Details */}
      {selectedMatch && (
        <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 mb-4">
          <p className="text-xs font-bold text-sky-700 mb-2">🔑 Room Details</p>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <label className="text-[11px] text-gray-500 mb-1 block">
                Room ID
              </label>
              <input
                placeholder="Room ID"
                defaultValue={selectedMatch.roomId || ""}
                onChange={(e) =>
                  setRoomData((p) => ({
                    ...p,
                    [selectedMatch._id]: {
                      ...p[selectedMatch._id],
                      roomId: e.target.value,
                    },
                  }))
                }
                className="w-full p-2 border border-sky-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="text-[11px] text-gray-500 mb-1 block">
                Password
              </label>
              <input
                placeholder="Room Password"
                defaultValue={selectedMatch.roomPassword || ""}
                onChange={(e) =>
                  setRoomData((p) => ({
                    ...p,
                    [selectedMatch._id]: {
                      ...p[selectedMatch._id],
                      roomPassword: e.target.value,
                    },
                  }))
                }
                className="w-full p-2 border border-sky-200 rounded-lg text-sm"
              />
            </div>
          </div>
          <button
            onClick={updateRoom}
            className="w-full py-2 bg-sky-600 text-white rounded-lg text-sm font-bold"
          >
            Update Room Details
          </button>
          {roomMsg && (
            <p className="mt-2 text-sky-700 font-semibold text-xs">{roomMsg}</p>
          )}
        </div>
      )}

      {/* Screenshots */}
      {selectedMatch && (
        <div className="bg-white border rounded-xl p-3 mb-4">
          <p className="text-xs font-bold text-slate-700 mb-1">
            📸 Screenshots ({screenshots.length})
          </p>
          <p className="text-[11px] text-gray-400 mb-2">click করলে zoom হবে</p>
          {screenshots.length === 0 ? (
            <p className="text-gray-300 text-xs text-center py-3">
              কোনো screenshot নেই
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {screenshots.map((sub, idx) => (
                <div
                  key={sub._id || idx}
                  className="rounded-lg overflow-hidden border"
                >
                  <img
                    src={sub.screenshot?.url}
                    alt=""
                    className="w-full h-20 object-cover cursor-zoom-in"
                    onClick={() => setZoomedImg(sub.screenshot?.url)}
                  />
                  <p className="text-[10px] text-gray-500 px-1 py-0.5 bg-gray-50">
                    {sub.submittedBy?.name || sub.submittedBy?.phone || "User"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
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

      {/* ══ TEAM MATCH UI ══ */}
      {selectedMatch && isTeamMatch && (
        <div className="space-y-3">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
            <p className="text-xs font-bold text-yellow-800 mb-1">
              💰 Prize Pool
            </p>
            <p className="text-2xl font-black text-yellow-800">৳{teamPool}</p>
            <p className="text-xs text-yellow-700 mt-1">
              Team Size: {mode.teamSize} জন · Winner team এর সবাই পাবে: ৳
              {prizeEach} each
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {["A", "B"].map((team) => {
              const teamPlayers = players.filter(
                (p) => (p.team || "A") === team,
              );
              const isWinner = winnerTeam === team;
              return (
                <div
                  key={team}
                  className={`rounded-xl p-3 border-2 ${
                    isWinner
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <p
                    className={`text-sm font-bold mb-2 ${
                      isWinner ? "text-green-700" : "text-gray-700"
                    }`}
                  >
                    {isWinner ? "✅ " : ""}Team {team}{" "}
                    <span className="font-normal text-[11px] text-gray-400">
                      ({teamPlayers.length} জন)
                    </span>
                  </p>
                  {teamPlayers.length === 0 ? (
                    <p className="text-xs text-gray-300">কেউ join করেনি</p>
                  ) : (
                    teamPlayers.map((p, i) => (
                      <p
                        key={i}
                        className="text-xs py-0.5 border-b border-gray-100 text-gray-700"
                      >
                        {p.inGameName || p.gameName || `Slot #${p.slotNumber}`}
                      </p>
                    ))
                  )}
                  {isWinner && teamPlayers.length > 0 && (
                    <p className="mt-2 text-xs font-bold text-green-700">
                      প্রতিজন পাবে: ৳{prizeEach}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div>
            <p className="text-sm font-bold text-gray-700 mb-2">
              Winner Team Select করুন:
            </p>
            <div className="flex gap-2">
              {["A", "B"].map((team) => (
                <button
                  key={team}
                  onClick={() => setWinnerTeam(team)}
                  className={`flex-1 py-3 rounded-xl font-black text-base ${
                    winnerTeam === team
                      ? "bg-green-500 text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  🏆 Team {team} {winnerTeam === team ? "✅" : ""}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-3">
            <p className="text-sm font-bold text-green-700 mb-1">
              Prize Summary
            </p>
            <p className="text-sm text-gray-700">
              Team {winnerTeam} এর {winnerCount} জন × ৳{prizeEach} = ৳
              {prizeEach * winnerCount}
            </p>
          </div>

          <button
            onClick={submitTeamResult}
            disabled={loading || !winnerTeam}
            className="w-full py-3 bg-green-500 text-white rounded-xl font-black text-sm disabled:opacity-50"
          >
            {loading
              ? "Submitting..."
              : `✅ Team ${winnerTeam} Winner — Submit করুন`}
          </button>
        </div>
      )}

      {/* ══ SOLO MATCH UI ══ */}
      {selectedMatch && !isTeamMatch && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <button
              onClick={addAllPlayers}
              disabled={
                players.length === 0 || results.length === players.length
              }
              className="flex-1 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-bold disabled:opacity-40"
            >
              ⚡ Add All {players.length} Players
            </button>
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

              <div className="mt-2 bg-green-50 rounded-lg p-2 text-center">
                <span className="text-xs text-gray-500">Estimated Prize: </span>
                <span className="text-green-700 font-black text-sm">
                  ৳{calcPrize(r.position, r.kills)}
                </span>
              </div>
            </div>
          ))}

          {results.length > 0 && (
            <div
              className={`rounded-xl p-3 border ${
                isOverBudget
                  ? "bg-red-50 border-red-200"
                  : "bg-green-50 border-green-200"
              }`}
            >
              <div className="flex justify-between items-center">
                <span
                  className={`text-sm font-bold ${
                    isOverBudget ? "text-red-700" : "text-green-700"
                  }`}
                >
                  Total Prize
                </span>
                <span
                  className={`font-black text-lg ${
                    isOverBudget ? "text-red-700" : "text-green-700"
                  }`}
                >
                  ৳{totalPrize}
                </span>
              </div>
              {prizePool > 0 && (
                <p
                  className={`mt-1 text-xs ${
                    isOverBudget ? "text-red-700" : "text-gray-500"
                  }`}
                >
                  {isOverBudget
                    ? `⚠️ Prize Pool ৳${prizePool} — বেশি হয়ে গেছে ৳${totalPrize - prizePool}!`
                    : `✅ Prize Pool ৳${prizePool} — বাকি আছে ৳${prizePool - totalPrize}`}
                </p>
              )}
            </div>
          )}

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