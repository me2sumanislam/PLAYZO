 // frontend/src/page/Admin/MatchResultSubmit.jsx
import React, { useState, useEffect, useCallback } from "react";
import { api } from "../../utils/adminApi";

const MODE_CONFIG = {
  br_solo:     { logic: "solo_kill", winnerCount: 1,  label: "BR Solo (48)" },
  br_duo:      { logic: "team_only", winnerCount: 2,  label: "BR Duo (48→24 teams)" },
  br_squad:    { logic: "team_only", winnerCount: 4,  label: "BR Squad (48→12 teams)" },
  cs_solo:     { logic: "solo_pos",  winnerCount: 1,  label: "CS Solo (1v1)" },
  cs_duo:      { logic: "team_only", winnerCount: 2,  label: "CS Duo (2v2)" },
  cs_squad:    { logic: "team_only", winnerCount: 4,  label: "CS Squad (4v4)" },
  cs_6vs6:     { logic: "team_only", winnerCount: 6,  label: "CS 6vs6 (6v6)" },
  lw_solo:     { logic: "solo_pos",  winnerCount: 1,  label: "LW Solo (1v1)" },
  lw_duo:      { logic: "team_only", winnerCount: 2,  label: "LW Duo (2v2)" },
  free_match:  { logic: "solo_kill", winnerCount: 1,  label: "Free Match" },
  training:    { logic: "solo_kill", winnerCount: 1,  label: "Training" },
  br_match:    { logic: "solo_kill", winnerCount: 1,  label: "BR Match" },
  br_survival: { logic: "solo_kill", winnerCount: 1,  label: "BR Survival" },
  clash_squad: { logic: "team_only", winnerCount: 4,  label: "Clash Squad (4v4)" },
  cs_2vs2:     { logic: "team_only", winnerCount: 2,  label: "CS 2vs2" },
  lone_wolf:   { logic: "solo_pos",  winnerCount: 1,  label: "Lone Wolf Solo" },
};

const fmt = (n) => "৳" + Number(n || 0).toLocaleString();

const inp = {
  padding: "9px 12px", border: "1px solid #d1d5db",
  borderRadius: 8, fontSize: 13, width: "100%",
  boxSizing: "border-box", outline: "none",
};

const MatchResultSubmit = () => {
  const [matches,     setMatches]     = useState([]);
  const [match,       setMatch]       = useState(null);
  const [players,     setPlayers]     = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");

  // Room update state
  const [roomId,      setRoomId]      = useState("");
  const [roomPass,    setRoomPass]    = useState("");
  const [roomMsg,     setRoomMsg]     = useState("");

  // Screenshot state
  const [screenshots, setScreenshots] = useState([]);
  const [zoomedImg,   setZoomedImg]   = useState(null);

  // ── BR Solo result state
  const [soloResults, setSoloResults] = useState([]);

  // ── Team Only winner state
  const [winners,     setWinners]     = useState(new Set());
  const [teamPrize,   setTeamPrize]   = useState("");

  // ── CS Solo / LW Solo winner state
  const [soloWinner,  setSoloWinner]  = useState("");

  const loadMatches = useCallback(() => {
    setError("");
    api("/matches")
      .then((d) => {
        const data = Array.isArray(d) ? d : d?.data || [];
        setMatches(data.filter((m) => m.status !== "completed"));
      })
      .catch(() => setError("Matches লোড হয়নি।"));
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
    setRoomId(m?.roomId || "");
    setRoomPass(m?.roomPassword || "");
    setRoomMsg("");
    setError("");
    setWinners(new Set());
    setSoloWinner("");
    setTeamPrize(m?.prizePool || m?.winPrize || "");

    const joined = (m?.joinedUsers || []).map((p) => ({
      ...p,
      userId: p.userId?._id?.toString() || p.userId?.toString() || p.userId,
    }));
    setPlayers(joined);

    // BR Solo: সব player এর জন্য row বানাও
    setSoloResults(
      joined.map((p) => ({
        userId:     p.userId,
        inGameName: p.inGameName || p.gameName || "",
        position:   "",
        kills:      "",
      }))
    );

    if (id) loadScreenshots(id);
  };

  // ── Room Update ─────────────────────────────────────────────────────────────
  const updateRoom = async () => {
    if (!match) return;
    if (!roomId.trim()) { setRoomMsg("❌ Room ID দিন"); return; }
    setRoomMsg("Updating...");
    const res = await api(`/matches/update-room/${match._id}`, {
      method: "PUT",
      body:   JSON.stringify({ roomId: roomId.trim(), roomPassword: roomPass.trim() }),
    });
    if (res.success) {
      setRoomMsg("✅ Room Updated!");
      setMatch((prev) => ({ ...prev, roomId: roomId.trim(), roomPassword: roomPass.trim(), isRoomOpen: true }));
      loadMatches();
    } else {
      setRoomMsg("❌ " + (res.message || "Failed"));
    }
  };

  // ── Start Match ─────────────────────────────────────────────────────────────
  const startMatch = async () => {
    if (!match) return;
    const res = await api(`/matches/live/${match._id}`, { method: "PUT" });
    if (res.success) {
      setMatch((prev) => ({ ...prev, status: "live" }));
      loadMatches();
    } else {
      setError("❌ " + res.message);
    }
  };

  // ── Winner Toggle (team_only) ────────────────────────────────────────────────
  const cfg = match ? (MODE_CONFIG[match.category] || MODE_CONFIG.br_solo) : null;

  const toggleWinner = (uid) => {
    setWinners((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) {
        next.delete(uid);
      } else {
        if (next.size >= cfg.winnerCount) {
          setError(`⚠️ সর্বোচ্চ ${cfg.winnerCount} জন winner select করতে পারবেন`);
          return prev;
        }
        next.add(uid);
      }
      setError("");
      return next;
    });
  };

  // ── Prize Calculations ───────────────────────────────────────────────────────
  const calcSoloPrize = (pos, kills) => {
    if (!match) return 0;
    const p1 = match.prizes?.first  || 60;
    const p2 = match.prizes?.second || 40;
    const p3 = match.prizes?.third  || 30;
    const p4 = match.prizes?.fourth || 20;
    const kp = match.perKill        || 0;
    const p  = Number(pos)   || 0;
    const k  = Number(kills) || 0;
    const placement = p === 1 ? p1 : p === 2 ? p2 : p === 3 ? p3 : p === 4 ? p4 : 0;
    return Math.floor(placement + k * kp);
  };

  const soloTotalPrize = soloResults.reduce((s, r) => s + calcSoloPrize(r.position, r.kills), 0);
  const prizePool      = match ? (match.prizePool || match.winPrize || 0) : 0;
  const isOverBudget   = prizePool > 0 && soloTotalPrize > prizePool;
  const prizeEach      = winners.size > 0 && teamPrize ? Math.floor(Number(teamPrize) / winners.size) : 0;

  // ── Submit BR Solo ───────────────────────────────────────────────────────────
  const submitSolo = async () => {
    const toSubmit = soloResults.filter((r) => r.position || r.kills);
    if (toSubmit.length === 0) { setError("❌ কমপক্ষে ১ জনের data দিন"); return; }
    const positions = toSubmit.map((r) => Number(r.position)).filter((p) => p > 0);
    if (positions.length !== new Set(positions).size) { setError("❌ একই position দুজনকে দেওয়া যাবে না"); return; }
    if (isOverBudget && !window.confirm(`⚠️ Total ৳${soloTotalPrize} > Pool ৳${prizePool}। তবুও submit করবেন?`)) return;

    setLoading(true); setError("");
    const res = await api(`/admin/matches/${match._id}/result`, {
      method: "PUT",
      body: JSON.stringify({
        results: toSubmit.map((r) => ({
          userId:     r.userId,
          inGameName: r.inGameName,
          position:   Number(r.position) || 0,
          kills:      Number(r.kills)    || 0,
        })),
      }),
    });
    setLoading(false);
    if (res.success) {
      alert(`✅ ${res.message}${res.redAlert ? "\n\n⚠️ RED ALERT: Kill prize বেশি হয়ে গেছে!" : ""}`);
      setMatch(null); setPlayers([]); setSoloResults([]); setScreenshots([]);
      loadMatches();
    } else {
      setError("❌ " + (res.message || "Failed"));
    }
  };

  // ── Submit CS Solo / LW Solo ─────────────────────────────────────────────────
  const submitSoloPos = async () => {
    if (!soloWinner) { setError("❌ Winner select করুন"); return; }
    const winner = players.find((p) => p.userId === soloWinner);
    setLoading(true); setError("");
    const res = await api(`/admin/matches/${match._id}/result`, {
      method: "PUT",
      body: JSON.stringify({
        results: [{
          userId:     soloWinner,
          inGameName: winner?.inGameName || winner?.gameName || "—",
          position:   1,
          kills:      0,
        }],
      }),
    });
    setLoading(false);
    if (res.success) {
      alert("✅ " + res.message);
      setMatch(null); setPlayers([]); setScreenshots([]);
      loadMatches();
    } else {
      setError("❌ " + (res.message || "Failed"));
    }
  };

  // ── Submit Team Only ─────────────────────────────────────────────────────────
  const submitTeam = async () => {
    if (winners.size === 0) { setError("❌ Winner select করুন"); return; }
    if (!teamPrize || Number(teamPrize) <= 0) { setError("❌ Prize amount দিন"); return; }
    if (winners.size !== cfg.winnerCount && !window.confirm(`⚠️ ${cfg.winnerCount} জন winner দরকার কিন্তু ${winners.size} জন select হয়েছে। তবুও submit করবেন?`)) return;

    setLoading(true); setError("");
    const res = await api(`/admin/matches/${match._id}/result`, {
      method: "PUT",
      body: JSON.stringify({
        winnerUserIds: [...winners],
        totalPrize:    Number(teamPrize),
      }),
    });
    setLoading(false);
    if (res.success) {
      alert("✅ " + res.message);
      setMatch(null); setPlayers([]); setScreenshots([]); setWinners(new Set());
      loadMatches();
    } else {
      setError("❌ " + (res.message || "Failed"));
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 720, fontFamily: "'Inter', sans-serif" }}>
      <h2 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 800 }}>🏆 Match Result Submit</h2>

      {/* Zoom Modal */}
      {zoomedImg && (
        <div onClick={() => setZoomedImg(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", cursor: "zoom-out" }}>
          <img src={zoomedImg} alt="" style={{ maxWidth: "92vw", maxHeight: "92vh", borderRadius: 8 }} onClick={(e) => e.stopPropagation()} />
          <button onClick={() => setZoomedImg(null)} style={{ position: "absolute", top: 16, right: 16, background: "#fff", border: "none", borderRadius: "50%", width: 36, height: 36, fontWeight: 700, cursor: "pointer" }}>✕</button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ background: "#fee2e2", color: "#dc2626", padding: "10px 14px", borderRadius: 10, marginBottom: 16, fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* Match Select */}
      <select onChange={(e) => handleMatchSelect(e.target.value)} value={match?._id || ""} style={{ ...inp, marginBottom: 16, fontSize: 14 }}>
        <option value="">-- Match select করুন --</option>
        {matches.map((m) => {
          const c = MODE_CONFIG[m.category] || MODE_CONFIG.br_solo;
          return (
            <option key={m._id} value={m._id}>
              {m.title} | {c.label} | {m.joinedPlayers}/{m.totalPlayers} players | {m.status}
            </option>
          );
        })}
      </select>

      {match && cfg && (
        <>
          {/* Match Info */}
          <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 12, padding: "12px 16px", marginBottom: 16, fontSize: 13 }}>
            <div style={{ fontWeight: 800, color: "#c2410c", fontSize: 15 }}>{match.title}</div>
            <div style={{ color: "#7c3aed", fontWeight: 700, marginTop: 2 }}>{cfg.label}</div>
            <div style={{ color: "#6b7280", marginTop: 4 }}>
              {cfg.logic === "solo_kill" && <>Per Kill: {fmt(match.perKill)} · 1st: {fmt(match.prizes?.first || 60)} · 2nd: {fmt(match.prizes?.second || 40)} · 3rd: {fmt(match.prizes?.third || 30)} · 4th: {fmt(match.prizes?.fourth || 20)}</>}
              {cfg.logic !== "solo_kill" && <>Prize Pool: {fmt(prizePool)} ÷ {cfg.winnerCount} জন = {fmt(Math.floor(prizePool / cfg.winnerCount))}</>}
            </div>
            <div style={{ color: "#6b7280", marginTop: 2 }}>Joined: {players.length} জন</div>
          </div>

          {/* Start Match */}
          {match.status !== "live" && (
            <button onClick={startMatch} style={{ width: "100%", padding: 12, background: "#dc2626", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer", marginBottom: 16 }}>
              🚀 Match Live করুন
            </button>
          )}

          {/* ── Room Update ─────────────────────────────────────────────── */}
          <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
            <div style={{ fontWeight: 700, color: "#0369a1", marginBottom: 10, fontSize: 13 }}>🔑 Room Details</div>

            {match.roomId && (
              <div style={{ background: "#e0f2fe", borderRadius: 8, padding: "8px 12px", marginBottom: 10, fontSize: 13 }}>
                Current: <b>{match.roomId}</b> / <b>{match.roomPassword || "no pass"}</b>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              <div>
                <label style={{ fontSize: 11, color: "#6b7280", display: "block", marginBottom: 4 }}>Room ID</label>
                <input
                  style={inp}
                  placeholder="Room ID"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#6b7280", display: "block", marginBottom: 4 }}>Password</label>
                <input
                  style={inp}
                  placeholder="Room Password"
                  value={roomPass}
                  onChange={(e) => setRoomPass(e.target.value)}
                />
              </div>
            </div>
            <button onClick={updateRoom} style={{ width: "100%", padding: 9, background: "#0284c7", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
              ✅ Room Update করুন
            </button>
            {roomMsg && <p style={{ marginTop: 6, color: roomMsg.startsWith("✅") ? "#065f46" : "#dc2626", fontWeight: 600, fontSize: 12 }}>{roomMsg}</p>}
          </div>

          {/* ── Screenshots ──────────────────────────────────────────────── */}
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 6px" }}>📸 Player Screenshots ({screenshots.length})</p>
            {screenshots.length === 0 ? (
              <p style={{ textAlign: "center", color: "#d1d5db", fontSize: 12, padding: "12px 0" }}>কোনো screenshot নেই</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
                {screenshots.map((s, i) => (
                  <div key={s._id || i} style={{ borderRadius: 8, overflow: "hidden", border: "1px solid #e5e7eb" }}>
                    <img
                      src={s.screenshot?.url} alt=""
                      style={{ width: "100%", height: 70, objectFit: "cover", cursor: "zoom-in", display: "block" }}
                      onClick={() => setZoomedImg(s.screenshot?.url)}
                    />
                    <p style={{ fontSize: 9, color: "#6b7280", padding: "3px 5px", background: "#f9fafb", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {s.submittedBy?.name || s.submittedBy?.phone || "User"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ══════════════════════════════════════════════════════════════
              BR SOLO — Position + Kill দিয়ে result
          ══════════════════════════════════════════════════════════════ */}
          {cfg.logic === "solo_kill" && (
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>
                📝 Players এর Position ও Kill দিন
                <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 400, marginLeft: 8 }}>
                  (Prize না পেলে blank রাখুন)
                </span>
              </div>

              {soloResults.map((r, i) => {
                const prize   = calcSoloPrize(r.position, r.kills);
                const hasData = r.position || r.kills;
                return (
                  <div key={i} style={{
                    background: hasData ? "#f0fdf4" : "#fff",
                    border: `1px solid ${hasData ? "#86efac" : "#e5e7eb"}`,
                    borderRadius: 10, padding: "10px 14px", marginBottom: 8,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, flex: 1, color: "#111" }}>
                        {r.inGameName || `Player ${i + 1}`}
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <div>
                          <label style={{ fontSize: 10, color: "#9ca3af", display: "block" }}>POSITION</label>
                          <select
                            value={r.position}
                            onChange={(e) => {
                              const next = [...soloResults];
                              next[i].position = e.target.value;
                              setSoloResults(next);
                            }}
                            style={{ padding: "5px 8px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 13, width: 70 }}
                          >
                            <option value="">—</option>
                            {Array.from({ length: 48 }, (_, n) => n + 1).map((n) => (
                              <option key={n} value={n}>{n}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: 10, color: "#9ca3af", display: "block" }}>KILLS</label>
                          <input
                            type="number" min="0"
                            value={r.kills}
                            onChange={(e) => {
                              const next = [...soloResults];
                              next[i].kills = e.target.value;
                              setSoloResults(next);
                            }}
                            style={{ padding: "5px 8px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 13, width: 60 }}
                          />
                        </div>
                        {hasData && (
                          <div style={{ textAlign: "right" }}>
                            <label style={{ fontSize: 10, color: "#9ca3af", display: "block" }}>PRIZE</label>
                            <span style={{ fontWeight: 800, fontSize: 14, color: "#16a34a" }}>{fmt(prize)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Total + Submit */}
              <div style={{ borderRadius: 12, padding: "14px 16px", marginTop: 8, background: isOverBudget ? "#fef2f2" : "#f0fdf4", border: `1px solid ${isOverBudget ? "#fecaca" : "#bbf7d0"}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: isOverBudget ? "#b91c1c" : "#15803d" }}>মোট Prize</span>
                  <span style={{ fontWeight: 900, fontSize: 20, color: isOverBudget ? "#b91c1c" : "#15803d" }}>{fmt(soloTotalPrize)}</span>
                </div>
                {prizePool > 0 && (
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: isOverBudget ? "#b91c1c" : "#6b7280" }}>
                    {isOverBudget ? `⚠️ Prize Pool ${fmt(prizePool)} — বেশি: ${fmt(soloTotalPrize - prizePool)}` : `✅ Prize Pool ${fmt(prizePool)} — বাকি: ${fmt(prizePool - soloTotalPrize)}`}
                  </p>
                )}
              </div>

              <button onClick={submitSolo} disabled={loading} style={{
                width: "100%", padding: 14, marginTop: 12,
                background: loading ? "#9ca3af" : isOverBudget ? "#dc2626" : "#22c55e",
                color: "#fff", border: "none", borderRadius: 12,
                fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
              }}>
                {loading ? "Submitting..." : `✅ Result Submit (${soloResults.filter((r) => r.position || r.kills).length} players)`}
              </button>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              CS SOLO / LW SOLO — Single Winner
          ══════════════════════════════════════════════════════════════ */}
          {cfg.logic === "solo_pos" && (
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>
                🏆 Winner select করুন (১ জন)
              </div>
              <div style={{ background: "#d1fae5", borderRadius: 10, padding: "8px 12px", marginBottom: 12, fontSize: 13, color: "#065f46", fontWeight: 600 }}>
                Winner পুরো Prize পাবে: {fmt(prizePool)}
              </div>

              {players.map((p) => {
                const sel = soloWinner === p.userId;
                return (
                  <div
                    key={p.userId}
                    onClick={() => setSoloWinner(sel ? "" : p.userId)}
                    style={{
                      background: sel ? "#d1fae5" : "#fff",
                      border: `${sel ? 2 : 1}px solid ${sel ? "#10b981" : "#e5e7eb"}`,
                      borderRadius: 10, padding: "12px 14px", marginBottom: 8,
                      cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
                    }}
                  >
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%",
                      background: sel ? "#10b981" : "#f3f4f6",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: sel ? "#fff" : "#9ca3af", fontWeight: 700, fontSize: 13,
                    }}>
                      {sel ? "✓" : p.slotNumber || "?"}
                    </div>
                    <span style={{ fontWeight: 700, fontSize: 14, color: "#111", flex: 1 }}>
                      {p.inGameName || p.gameName || `Slot #${p.slotNumber}`}
                    </span>
                    {sel && <span style={{ fontWeight: 800, color: "#059669", fontSize: 14 }}>{fmt(prizePool)}</span>}
                  </div>
                );
              })}

              <button onClick={submitSoloPos} disabled={loading || !soloWinner} style={{
                width: "100%", padding: 14, marginTop: 8,
                background: loading || !soloWinner ? "#9ca3af" : "#22c55e",
                color: "#fff", border: "none", borderRadius: 12,
                fontSize: 15, fontWeight: 700, cursor: loading || !soloWinner ? "not-allowed" : "pointer",
              }}>
                {loading ? "Submitting..." : "✅ Winner Submit করুন"}
              </button>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              TEAM ONLY — Individual Winner Selection
              (players নিজেরা room এ team বানায়, admin winner select করে)
          ══════════════════════════════════════════════════════════════ */}
          {cfg.logic === "team_only" && (
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>
                🏆 Winner players select করুন ({cfg.winnerCount} জন)
              </div>

              <div style={{ background: "#dbeafe", borderRadius: 10, padding: "8px 12px", marginBottom: 8, fontSize: 12, color: "#1e40af", fontWeight: 600 }}>
                {winners.size}/{cfg.winnerCount} selected — প্রতিজন পাবে: {fmt(prizeEach)}
              </div>

              {/* Prize Amount */}
              <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "12px 14px", marginBottom: 12 }}>
                <label style={{ fontSize: 11, color: "#6b7280", fontWeight: 700, display: "block", marginBottom: 6 }}>
                  TOTAL PRIZE AMOUNT (৳)
                </label>
                <input
                  type="number"
                  value={teamPrize}
                  onChange={(e) => setTeamPrize(e.target.value)}
                  placeholder={`Default: ${prizePool}`}
                  style={{ ...inp, fontSize: 15, fontWeight: 700 }}
                />
                {teamPrize && winners.size > 0 && (
                  <p style={{ margin: "6px 0 0", fontSize: 12, color: "#059669", fontWeight: 600 }}>
                    প্রতিজন পাবে: {fmt(Math.floor(Number(teamPrize) / winners.size))}
                    {winners.size < cfg.winnerCount && (
                      <span style={{ color: "#dc2626", marginLeft: 8 }}>⚠️ {cfg.winnerCount - winners.size} জন আরো দরকার</span>
                    )}
                  </p>
                )}
              </div>

              {/* Player List */}
              {players.map((p) => {
                const sel = winners.has(p.userId);
                return (
                  <div
                    key={p.userId}
                    onClick={() => toggleWinner(p.userId)}
                    style={{
                      background: sel ? "#ede9fe" : "#fff",
                      border: `${sel ? 2 : 1}px solid ${sel ? "#7c3aed" : "#e5e7eb"}`,
                      borderRadius: 10, padding: "12px 14px", marginBottom: 8,
                      cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
                      transition: "all 0.15s",
                    }}
                  >
                    <div style={{
                      width: 30, height: 30, borderRadius: "50%",
                      background: sel ? "#7c3aed" : "#f3f4f6",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: sel ? "#fff" : "#9ca3af", fontWeight: 700, fontSize: 13, flexShrink: 0,
                    }}>
                      {sel ? "✓" : p.slotNumber || "?"}
                    </div>
                    <span style={{ fontWeight: 700, fontSize: 14, color: "#111", flex: 1 }}>
                      {p.inGameName || p.gameName || `Slot #${p.slotNumber}`}
                    </span>
                    {sel && teamPrize && (
                      <span style={{ fontWeight: 800, color: "#7c3aed", fontSize: 14 }}>{fmt(prizeEach)}</span>
                    )}
                  </div>
                );
              })}

              <button onClick={submitTeam} disabled={loading || winners.size === 0} style={{
                width: "100%", padding: 14, marginTop: 8,
                background: loading || winners.size === 0 ? "#9ca3af" : "#22c55e",
                color: "#fff", border: "none", borderRadius: 12,
                fontSize: 15, fontWeight: 700, cursor: loading || winners.size === 0 ? "not-allowed" : "pointer",
              }}>
                {loading ? "Submitting..." : `✅ ${winners.size} জন Winner Submit করুন`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MatchResultSubmit;