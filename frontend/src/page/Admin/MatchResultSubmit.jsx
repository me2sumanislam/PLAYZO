 // page/Admin/MatchResultSubmit.jsx
import React, { useState, useEffect, useCallback } from "react";
import { api } from "../../utils/adminApi";

const MODE_CONFIG = {
  br_solo:     { matchType: "solo",   teamSize: 1,  label: "BR Solo" },
  br_duo:      { matchType: "team",   teamSize: 2,  label: "BR Duo 2vs2" },
  br_squad:    { matchType: "team",   teamSize: 4,  label: "BR Squad 4vs4" },
  cs_solo:     { matchType: "solo",   teamSize: 1,  label: "CS Solo" },
  cs_duo:      { matchType: "team",   teamSize: 2,  label: "CS Duo" },
  cs_squad:    { matchType: "team",   teamSize: 4,  label: "Clash Squad" },
  cs_6vs6:     { matchType: "team",   teamSize: 6,  label: "CS 6vs6" },
  lw_solo:     { matchType: "solo",   teamSize: 1,  label: "LW Solo" },
  lw_duo:      { matchType: "team",   teamSize: 2,  label: "LW Duo" },
  free_match:  { matchType: "solo",   teamSize: 1,  label: "Free Match" },
  training:    { matchType: "solo",   teamSize: 1,  label: "Training" },
  br_match:    { matchType: "solo",   teamSize: 1,  label: "BR Match" },
  br_survival: { matchType: "solo",   teamSize: 1,  label: "BR Survival" },
  clash_squad: { matchType: "team",   teamSize: 4,  label: "Clash Squad" },
  cs_2vs2:     { matchType: "team",   teamSize: 2,  label: "CS 2vs2" },
  lone_wolf:   { matchType: "solo",   teamSize: 1,  label: "Lone Wolf" },
};

const getMode = (match) => {
  const cfg = MODE_CONFIG[match?.category || "br_solo"] || MODE_CONFIG.br_solo;
  return {
    matchType: match?.matchType || cfg.matchType,
    teamSize:  match?.teamSize  || cfg.teamSize,
    label:     cfg.label,
  };
};

const fmt = (n) => "৳" + Number(n || 0).toLocaleString();

const MatchResultSubmit = () => {
  const [matches,     setMatches]     = useState([]);
  const [match,       setMatch]       = useState(null);
  const [players,     setPlayers]     = useState([]);
  const [results,     setResults]     = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [roomData,    setRoomData]    = useState({});
  const [roomMsg,     setRoomMsg]     = useState("");
  const [screenshots, setScreenshots] = useState([]);
  const [zoomedImg,   setZoomedImg]   = useState(null);
  const [winnerTeam,  setWinnerTeam]  = useState("A");
  const [error,       setError]       = useState("");

  const loadMatches = useCallback(() => {
    setError("");
    api("/matches")
      .then((d) => {
        const data = Array.isArray(d) ? d : d?.data || [];
        setMatches(data.filter((m) => m.status !== "completed"));
      })
      .catch(() => setError("Matches লোড হয়নি। Refresh করুন।"));
  }, []);

  useEffect(() => { loadMatches(); }, [loadMatches]);

  const loadScreenshots = useCallback(async (matchId) => {
    try {
      const res = await api(`/results/admin/match/${matchId}`);
      setScreenshots(res?.data || []);
    } catch { setScreenshots([]); }
  }, []);

  const handleMatchSelect = (id) => {
    const m = matches.find((x) => x._id === id);
    setMatch(m || null);
    setResults([]);
    setScreenshots([]);
    setWinnerTeam("A");
    setRoomMsg("");
    if (id) loadScreenshots(id);
    const joined = (m?.joinedUsers || []).map((p) => ({
      ...p,
      userId: p.userId?._id?.toString() || p.userId?.toString() || p.userId,
    }));
    setPlayers(joined);
  };

  const addAllPlayers = () =>
    setResults(players.map((p) => ({ userId: p.userId, inGameName: p.inGameName, position: "", kills: 0 })));

  const addPlayerRow = () =>
    setResults([...results, { userId: "", inGameName: "", position: "", kills: 0 }]);

  const handlePlayerSelect = (idx, userId) => {
    const p = players.find((x) => x.userId === userId);
    const updated = [...results];
    updated[idx].userId    = userId;
    updated[idx].inGameName = p?.inGameName || "";
    setResults(updated);
  };

  const handleChange = (idx, field, value) => {
    const updated = [...results];
    updated[idx][field] = value;
    setResults(updated);
  };

  const calcPrize = (pos, kills) => {
    if (!match) return 0;
    let prize = (kills || 0) * (match.perKill || 0);
    if (pos == 1) prize += match.prizes?.first  || 0;
    if (pos == 2) prize += match.prizes?.second || 0;
    if (pos == 3) prize += match.prizes?.third  || 0;
    if (pos == 4) prize += match.prizes?.fourth || 0;
    return Math.floor(prize);
  };

  const isAlreadyAdded = (userId, curIdx) =>
    results.some((r, i) => i !== curIdx && r.userId === userId);

  const totalPrize = results.reduce((sum, r) => sum + calcPrize(r.position, r.kills), 0);
  const prizePool  = match
    ? (match.prizes?.first || 0) + (match.prizes?.second || 0) + (match.prizes?.third || 0) + (match.prizes?.fourth || 0)
    : 0;
  const isOverBudget = prizePool > 0 && totalPrize > prizePool;

  const mode       = match ? getMode(match) : null;
  const isTeam     = mode?.matchType === "team";
  const teamPool   = match?.prizePool || match?.winPrize || 0;
  const teamA      = players.filter((p) => (p.team || "A") === "A");
  const teamB      = players.filter((p) => (p.team || "A") === "B");
  const winners    = winnerTeam === "A" ? teamA : teamB;
  const prizeEach  = winners.length > 0 ? Math.floor(teamPool / winners.length) : 0;

  const startMatch = async () => {
    if (!match) return;
    const res = await api(`/matches/live/${match._id}`, { method: "PUT" });
    if (res.success) { alert(res.message); setMatch({ ...match, status: "live" }); loadMatches(); }
    else alert("❌ " + res.message);
  };

  const updateRoom = async () => {
    if (!match) return;
    const res = await api(`/matches/update-room/${match._id}`, {
      method: "PUT",
      body: JSON.stringify(roomData[match._id] || {}),
    });
    setRoomMsg(res.success ? "✅ Room Updated!" : "❌ Failed");
    if (res.success) loadMatches();
  };

  const submitSolo = async () => {
    if (!match)                    return alert("Match select করুন");
    if (results.length === 0)      return alert("কমপক্ষে একজন player যোগ করুন");
    if (results.some(r => !r.userId)) return alert("সব player select করুন");
    const positions = results.map(r => Number(r.position)).filter(p => p > 0);
    if (positions.length !== new Set(positions).size) return alert("একই position দুজনকে দেওয়া যাবে না");
    if (new Set(results.map(r => r.userId)).size !== results.length) return alert("একই player দুইবার যোগ করা যাবে না");
    if (isOverBudget && !window.confirm(`⚠️ Total prize ৳${totalPrize} প্রাইজ পুল ৳${prizePool} এর বেশি! তবুও submit করবেন?`)) return;
    setLoading(true);
    const res = await api(`/admin/matches/${match._id}/result`, {
      method: "PUT",
      body: JSON.stringify({
        results: results.map(r => ({
          userId:     r.userId,
          inGameName: r.inGameName,
          position:   Number(r.position) || 0,
          kills:      Number(r.kills) || 0,
        })),
      }),
    });
    if (res.success) {
      alert("✅ Result submit হয়েছে! Prize distribute হয়েছে।");
      setResults([]); setMatch(null); setPlayers([]); setScreenshots([]);
      loadMatches();
    } else alert("❌ " + res.message);
    setLoading(false);
  };

  const submitTeam = async () => {
    if (!match)           return alert("Match select করুন");
    if (!winnerTeam)      return alert("Winner team select করুন");
    if (winners.length === 0) return alert("Winner team-এ কোনো player নেই");
    const winnerUserIds = winners.map(p => p.userId).filter(Boolean);
    if (winnerUserIds.length === 0) return alert("Player userId পাওয়া যাচ্ছে না");
    setLoading(true);
    const res = await api(`/admin/matches/${match._id}/result`, {
      method: "PUT",
      body: JSON.stringify({ winnerUserIds, totalPrize: teamPool }),
    });
    if (res.success) {
      alert("✅ " + res.message);
      setMatch(null); setPlayers([]); setScreenshots([]);
      loadMatches();
    } else alert("❌ " + (res.message || "Failed"));
    setLoading(false);
  };

  const inp = {
    padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13, width: "100%", boxSizing: "border-box", outline: "none",
  };

  return (
    <div style={{ padding: 24, maxWidth: 680, fontFamily: "'Inter', sans-serif" }}>
      <h2 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 800 }}>🏆 Match Result Submit</h2>

      {error && (
        <div style={{ background: "#fee2e2", color: "#dc2626", padding: "10px 14px", borderRadius: 10, marginBottom: 16, fontSize: 13 }}>
          ⚠️ {error}
        </div>
      )}

      {/* Zoom Modal */}
      {zoomedImg && (
        <div onClick={() => setZoomedImg(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", cursor: "zoom-out" }}>
          <img src={zoomedImg} alt="" style={{ maxWidth: "92vw", maxHeight: "92vh", borderRadius: 8 }} onClick={e => e.stopPropagation()} />
          <button onClick={() => setZoomedImg(null)} style={{ position: "absolute", top: 16, right: 16, background: "#fff", border: "none", borderRadius: "50%", width: 36, height: 36, fontWeight: 700, cursor: "pointer" }}>✕</button>
        </div>
      )}

      {/* Match Select */}
      <select onChange={e => handleMatchSelect(e.target.value)} value={match?._id || ""} style={{ ...inp, marginBottom: 16 }}>
        <option value="">-- Match select করুন --</option>
        {matches.map(m => (
          <option key={m._id} value={m._id}>
            {m.title} ({m.joinedPlayers}/{m.totalPlayers}) — {getMode(m).label} — {m.status}
          </option>
        ))}
      </select>

      {match && (
        <>
          {/* Match Info */}
          <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 12, padding: "12px 14px", marginBottom: 16, fontSize: 13 }}>
            <div style={{ fontWeight: 700, color: "#c2410c" }}>{match.title} <span style={{ fontWeight: 500, color: "#7c3aed" }}>({mode?.label})</span></div>
            <div style={{ color: "#6b7280", marginTop: 4 }}>
              Per Kill: {fmt(match.perKill)} · 1st: {fmt(match.prizes?.first)} · 2nd: {fmt(match.prizes?.second)} · 3rd: {fmt(match.prizes?.third)}
            </div>
            <div style={{ color: "#6b7280", marginTop: 2 }}>Joined: {players.length} জন</div>
          </div>

          {/* Start Match */}
          {match.status !== "live" && (
            <button onClick={startMatch} style={{ width: "100%", padding: 12, background: "#dc2626", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer", marginBottom: 16 }}>
              🚀 Start Match
            </button>
          )}

          {/* Room Details */}
          <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
            <div style={{ fontWeight: 700, color: "#0369a1", marginBottom: 10, fontSize: 13 }}>🔑 Room Details</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              <div>
                <label style={{ fontSize: 11, color: "#6b7280", display: "block", marginBottom: 4 }}>Room ID</label>
                <input style={inp} placeholder="Room ID" defaultValue={match.roomId || ""}
                  onChange={e => setRoomData(p => ({ ...p, [match._id]: { ...p[match._id], roomId: e.target.value } }))} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#6b7280", display: "block", marginBottom: 4 }}>Password</label>
                <input style={inp} placeholder="Room Password" defaultValue={match.roomPassword || ""}
                  onChange={e => setRoomData(p => ({ ...p, [match._id]: { ...p[match._id], roomPassword: e.target.value } }))} />
              </div>
            </div>
            <button onClick={updateRoom} style={{ width: "100%", padding: 9, background: "#0284c7", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
              Update Room Details
            </button>
            {roomMsg && <p style={{ marginTop: 6, color: "#0369a1", fontWeight: 600, fontSize: 12 }}>{roomMsg}</p>}
          </div>

          {/* Screenshots */}
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 6px" }}>📸 Screenshots ({screenshots.length})</p>
            <p style={{ fontSize: 11, color: "#9ca3af", margin: "0 0 10px" }}>click করলে zoom হবে</p>
            {screenshots.length === 0 ? (
              <p style={{ textAlign: "center", color: "#d1d5db", fontSize: 12, padding: "12px 0" }}>কোনো screenshot নেই</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {screenshots.map((s, i) => (
                  <div key={s._id || i} style={{ borderRadius: 8, overflow: "hidden", border: "1px solid #e5e7eb" }}>
                    <img src={s.screenshot?.url} alt="" style={{ width: "100%", height: 80, objectFit: "cover", cursor: "zoom-in", display: "block" }}
                      onClick={() => setZoomedImg(s.screenshot?.url)} />
                    <p style={{ fontSize: 10, color: "#6b7280", padding: "4px 7px", background: "#f9fafb", margin: 0 }}>
                      {s.submittedBy?.name || s.submittedBy?.phone || "User"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Joined Players */}
          {players.length > 0 && (
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: "12px 14px", marginBottom: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 8px", color: "#374151" }}>📋 Joined Players ({players.length} জন)</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {players.map((p, i) => (
                  <span key={i} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 600 }}>
                    {p.inGameName || `Slot #${p.slotNumber}`}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ══ TEAM MATCH UI ══ */}
          {isTeam && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ background: "#fefce8", border: "1px solid #fde68a", borderRadius: 12, padding: "14px 16px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#92400e", marginBottom: 4 }}>💰 Prize Pool</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#92400e" }}>{fmt(teamPool)}</div>
                <div style={{ fontSize: 12, color: "#78350f", marginTop: 4 }}>
                  Winner team সবাই পাবে: {fmt(prizeEach)} each
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {["A", "B"].map((team) => {
                  const tp = players.filter(p => (p.team || "A") === team);
                  const isW = winnerTeam === team;
                  return (
                    <div key={team} style={{ borderRadius: 12, padding: "12px 14px", border: `2px solid ${isW ? "#22c55e" : "#e5e7eb"}`, background: isW ? "#f0fdf4" : "#f9fafb" }}>
                      <p style={{ margin: "0 0 8px", fontWeight: 700, color: isW ? "#15803d" : "#374151" }}>
                        {isW ? "✅ " : ""}Team {team} ({tp.length} জন)
                      </p>
                      {tp.length === 0 ? <p style={{ fontSize: 11, color: "#d1d5db" }}>কেউ নেই</p> : tp.map((p, i) => (
                        <p key={i} style={{ margin: 0, fontSize: 12, color: "#374151", borderBottom: "1px solid #f3f4f6", padding: "3px 0" }}>{p.inGameName || `Slot #${p.slotNumber}`}</p>
                      ))}
                    </div>
                  );
                })}
              </div>

              <div>
                <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Winner Team Select করুন:</p>
                <div style={{ display: "flex", gap: 10 }}>
                  {["A", "B"].map(team => (
                    <button key={team} onClick={() => setWinnerTeam(team)} style={{
                      flex: 1, padding: 12, border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer",
                      background: winnerTeam === team ? "#22c55e" : "#f3f4f6", color: winnerTeam === team ? "#fff" : "#374151",
                    }}>
                      🏆 Team {team} {winnerTeam === team ? "✅" : ""}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "12px 14px" }}>
                <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: 13, color: "#15803d" }}>Prize Summary</p>
                <p style={{ margin: 0, fontSize: 13, color: "#374151" }}>
                  Team {winnerTeam} এর {winners.length} জন × {fmt(prizeEach)} = {fmt(prizeEach * winners.length)}
                </p>
              </div>

              <button onClick={submitTeam} disabled={loading || !winnerTeam} style={{
                padding: 14, background: loading ? "#9ca3af" : "#22c55e", color: "#fff", border: "none", borderRadius: 12,
                fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", width: "100%",
              }}>
                {loading ? "Submitting..." : `✅ Team ${winnerTeam} Winner — Submit করুন`}
              </button>
            </div>
          )}

          {/* ══ SOLO MATCH UI ══ */}
          {!isTeam && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={addAllPlayers} disabled={players.length === 0 || results.length === players.length}
                  style={{ flex: 1, padding: 10, background: "#7c3aed", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", opacity: players.length === 0 ? 0.5 : 1 }}>
                  ⚡ Add All {players.length} Players
                </button>
                <button onClick={addPlayerRow} style={{ flex: 1, padding: 10, background: "#3b82f6", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                  + Add Player
                </button>
              </div>

              {results.map((r, i) => (
                <div key={i} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "14px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7280" }}>Player #{i + 1}</span>
                    <button onClick={() => setResults(results.filter((_, idx) => idx !== i))} style={{ background: "none", border: "none", color: "#ef4444", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>✕ Remove</button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div style={{ gridColumn: "1 / -1" }}>
                      <select value={r.userId} onChange={e => handlePlayerSelect(i, e.target.value)} style={{ ...inp }}>
                        <option value="">-- Player select করুন --</option>
                        {players.map(p => (
                          <option key={p.userId} value={p.userId} disabled={isAlreadyAdded(p.userId, i)}>
                            {p.inGameName ? `${p.inGameName} — Slot #${p.slotNumber}` : `Slot #${p.slotNumber}`}
                            {isAlreadyAdded(p.userId, i) ? " ✓" : ""}
                          </option>
                        ))}
                      </select>
                      {r.inGameName && <p style={{ fontSize: 11, color: "#16a34a", fontWeight: 600, marginTop: 4 }}>✅ {r.inGameName}</p>}
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: "#6b7280", display: "block", marginBottom: 4 }}>Position</label>
                      <select value={r.position} onChange={e => handleChange(i, "position", e.target.value)} style={inp}>
                        <option value="">Select</option>
                        {Array.from({ length: 48 }, (_, n) => n + 1).map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: "#6b7280", display: "block", marginBottom: 4 }}>Kills</label>
                      <input type="number" min="0" value={r.kills} onChange={e => handleChange(i, "kills", e.target.value)} style={inp} />
                    </div>
                  </div>
                  <div style={{ marginTop: 10, background: "#f0fdf4", borderRadius: 8, padding: "8px 12px", textAlign: "center" }}>
                    <span style={{ fontSize: 12, color: "#6b7280" }}>Estimated Prize: </span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: "#16a34a" }}>{fmt(calcPrize(r.position, r.kills))}</span>
                  </div>
                </div>
              ))}

              {results.length > 0 && (
                <>
                  <div style={{ borderRadius: 12, padding: "14px 16px", background: isOverBudget ? "#fef2f2" : "#f0fdf4", border: `1px solid ${isOverBudget ? "#fecaca" : "#bbf7d0"}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: isOverBudget ? "#b91c1c" : "#15803d" }}>Total Prize</span>
                      <span style={{ fontWeight: 900, fontSize: 20, color: isOverBudget ? "#b91c1c" : "#15803d" }}>{fmt(totalPrize)}</span>
                    </div>
                    {prizePool > 0 && (
                      <p style={{ margin: "6px 0 0", fontSize: 12, color: isOverBudget ? "#b91c1c" : "#6b7280" }}>
                        {isOverBudget ? `⚠️ Prize Pool ${fmt(prizePool)} — বেশি হয়েছে ${fmt(totalPrize - prizePool)}!` : `✅ Prize Pool ${fmt(prizePool)} — বাকি ${fmt(prizePool - totalPrize)}`}
                      </p>
                    )}
                  </div>
                  <button onClick={submitSolo} disabled={loading} style={{
                    padding: 14, background: loading ? "#9ca3af" : isOverBudget ? "#dc2626" : "#22c55e",
                    color: "#fff", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", width: "100%",
                  }}>
                    {loading ? "Submitting..." : `✅ Result Submit করুন (${results.length} players)`}
                  </button>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MatchResultSubmit;