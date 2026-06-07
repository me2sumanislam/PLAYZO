 // LudoTournamentManager.jsx — Ludo-specific prize system (no kills)
// 1v1: winner (rank 1) পুরো prize পাবে
// 2v2: winning team এর 2 জন prize ভাগ করে পাবে
// 4player: rank অনুযায়ী prize (prizes.first/second/third/fourth)

import React, { useState, useEffect, useCallback, useRef } from "react";

const API_BASE = (
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  "https://playzo-vn8e.onrender.com"
).replace("/api", "");

const getToken = () =>
  localStorage.getItem("adminToken") || localStorage.getItem("token") || "";

const api = async (path, opts = {}) => {
  try {
    const headers = { Authorization: `Bearer ${getToken()}` };
    if (!(opts.body instanceof FormData)) headers["Content-Type"] = "application/json";
    const res = await fetch(`${API_BASE}/api${path}`, { headers, ...opts });
    return await res.json();
  } catch {
    return { success: false, message: "Network error" };
  }
};

const MODES = [
  { id: "1v1",     label: "⚔️ 1 vs 1",   slots: 2 },
  { id: "2v2",     label: "👥 2 vs 2",   slots: 4 },
  { id: "4player", label: "🎮 4 Player", slots: 4 },
];
const LUDO_MAPS = ["Classic", "Quick Ludo", "Arrow", "Magic"];

// ─── Badge ───────────────────────────────────────────────────────
const Badge = ({ status }) => {
  const M = {
    upcoming:  { bg: "#dbeafe", c: "#1e40af", t: "Upcoming" },
    live:      { bg: "#dcfce7", c: "#166534", t: "🔴 Live"   },
    completed: { bg: "#ede9fe", c: "#5b21b6", t: "Completed" },
    cancelled: { bg: "#fee2e2", c: "#991b1b", t: "Cancelled" },
  };
  const s = M[status] || { bg: "#f3f4f6", c: "#374151", t: status };
  return (
    <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: s.bg, color: s.c }}>
      {s.t}
    </span>
  );
};

// ─── Prize calculator helper ──────────────────────────────────────
// Returns array of {userId, inGameName, rank, prize, isWinner, isWinnerTeam}
const buildInitialResults = (match) => {
  const users = match.joinedUsers || [];
  const mode  = match.mode;
  const prizes = match.prizes || {};

  if (mode === "1v1") {
    // 2 জন — winner gets winPrize, loser gets 0
    return users.map((u, i) => ({
      userId:    u.userId?._id || u.userId || "",
      inGameName: u.inGameName || `Player ${i+1}`,
      rank:      i === 0 ? 1 : 2,
      prize:     i === 0 ? (match.winPrize || 0) : 0,
      isWinner:  i === 0,
    }));
  }

  if (mode === "2v2") {
    // 4 জন — 2 winner team, 2 loser team
    // winPrize = মোট prize pool → ভাগ হয় 2 জনে
    const eachPrize = Math.floor((match.winPrize || 0) / 2);
    return users.map((u, i) => ({
      userId:    u.userId?._id || u.userId || "",
      inGameName: u.inGameName || `Player ${i+1}`,
      rank:      i < 2 ? 1 : 2,   // default: first 2 = winner team
      prize:     i < 2 ? eachPrize : 0,
      team:      i < 2 ? "A" : "B",
      isWinner:  i < 2,
    }));
  }

  // 4player — rank prize
  const rankPrize = [
    prizes.first  || 0,
    prizes.second || 0,
    prizes.third  || 0,
    prizes.fourth || 0,
  ];
  return users.map((u, i) => ({
    userId:    u.userId?._id || u.userId || "",
    inGameName: u.inGameName || `Player ${i+1}`,
    rank:      i + 1,
    prize:     rankPrize[i] || 0,
  }));
};

// ─── IMAGE RESULT MODAL ───────────────────────────────────────────
const ImageResultModal = ({ match, onClose, onDone }) => {
  const [results, setResults] = useState(() => buildInitialResults(match));
  const [imgPreviews, setImgPreviews] = useState([]);
  const [previewImg,  setPreviewImg]  = useState(null);
  const [winTeam,     setWinTeam]     = useState("A"); // for 2v2
  const [saving,      setSaving]      = useState(false);
  const [msg,         setMsg]         = useState("");
  const fileRef = useRef();

  // 2v2: winning team change হলে prize recalculate
  const handleWinTeam = (team) => {
    setWinTeam(team);
    const eachPrize = Math.floor((match.winPrize || 0) / 2);
    setResults(prev => prev.map((r) => ({
      ...r,
      isWinner: r.team === team,
      prize:    r.team === team ? eachPrize : 0,
      rank:     r.team === team ? 1 : 2,
    })));
  };

  // 1v1: winner select
  const handleWinner1v1 = (winnerIdx) => {
    setResults(prev => prev.map((r, i) => ({
      ...r,
      rank:     i === winnerIdx ? 1 : 2,
      prize:    i === winnerIdx ? (match.winPrize || 0) : 0,
      isWinner: i === winnerIdx,
    })));
  };

  const handleImgUpload = (e) => {
    Array.from(e.target.files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) =>
        setImgPreviews(p => [...p, { name: file.name, url: ev.target.result }]);
      reader.readAsDataURL(file);
    });
  };

  const update4p = (i, field, val) => {
    setResults(prev => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: field === "rank" ? Number(val) : Number(val) || 0 };
      return next;
    });
  };

  const submit = async () => {
    // Validate ranks
    const ranks = results.map(r => r.rank);
    if (new Set(ranks).size !== ranks.length) {
      setMsg("❌ Duplicate rank আছে! প্রতিটা player আলাদা rank দিন।");
      return;
    }

    setSaving(true);
    setMsg("");

    const payload = {
      results,
      ...(match.mode === "2v2" ? { winningTeam: winTeam } : {}),
    };

    const res = await api(`/ludo-tournament/result/${match._id}`, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    setSaving(false);
    if (res.success) {
      setMsg("✅ Result submit ও prize distribute হয়েছে!");
      setTimeout(() => { onDone?.(); onClose(); }, 1000);
    } else {
      setMsg("❌ " + (res.message || "Error"));
    }
  };

  const totalPrize = results.reduce((s, r) => s + (r.prize || 0), 0);

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000,
      display: "flex", alignItems: "flex-start", justifyContent: "center",
      overflowY: "auto", padding: "20px 12px",
    }}>
      <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 760, boxShadow: "0 24px 64px rgba(0,0,0,0.25)", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ color: "#fff", fontSize: 15, fontWeight: 800 }}>🏆 Result Submit</div>
            <div style={{ color: "#c4b5fd", fontSize: 12, marginTop: 2 }}>
              {match.title} &nbsp;·&nbsp; {match.mode.toUpperCase()} &nbsp;·&nbsp; {match.joinedPlayers}/{match.totalSlots} players
            </div>
          </div>
          <button onClick={onClose}
            style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 8, color: "#fff", width: 32, height: 32, fontSize: 17, cursor: "pointer" }}>
            ✕
          </button>
        </div>

        <div style={{ padding: 20 }}>

          {/* Screenshot Upload */}
          <div style={{ marginBottom: 20 }}>
            <div style={SL}>📸 Screenshot দেখে দেখে result দিন</div>
            <div onClick={() => fileRef.current?.click()}
              style={{ border: "2px dashed #c4b5fd", borderRadius: 10, padding: "12px 16px", textAlign: "center", cursor: "pointer", background: "#faf5ff", fontSize: 13, color: "#7c3aed" }}>
              📂 Screenshot select করুন (multiple OK)
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleImgUpload} style={{ display: "none" }} />

            {imgPreviews.length > 0 && (
              <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                {imgPreviews.map((img, i) => (
                  <div key={i} style={{ position: "relative" }}>
                    <img src={img.url} alt=""
                      onClick={() => setPreviewImg(img.url)}
                      style={{ width: 110, height: 72, objectFit: "cover", borderRadius: 8, cursor: "zoom-in", border: "2px solid #e5e7eb" }}
                      onMouseEnter={e => e.target.style.borderColor = "#7c3aed"}
                      onMouseLeave={e => e.target.style.borderColor = "#e5e7eb"}
                    />
                    <button onClick={() => setImgPreviews(p => p.filter((_, j) => j !== i))}
                      style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", background: "#ef4444", border: "none", color: "#fff", fontSize: 10, cursor: "pointer" }}>
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
            {imgPreviews.length > 0 && (
              <p style={{ fontSize: 11, color: "#9ca3af", margin: "6px 0 0" }}>
                💡 Image এ click করলে বড় দেখবেন। দেখে নিচে সঠিক result দিন।
              </p>
            )}
          </div>

          {/* ════ 1v1 MODE ════ */}
          {match.mode === "1v1" && (
            <div>
              <div style={SL}>⚔️ কে জিতেছে? (Winner select করুন)</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {results.map((r, i) => (
                  <div key={i}
                    onClick={() => handleWinner1v1(i)}
                    style={{
                      padding: 16, borderRadius: 12, cursor: "pointer", textAlign: "center",
                      border: `2px solid ${r.isWinner ? "#7c3aed" : "#e5e7eb"}`,
                      background: r.isWinner ? "#ede9fe" : "#fff",
                      transition: "all 0.15s",
                    }}>
                    <div style={{ fontSize: 28, marginBottom: 6 }}>{r.isWinner ? "🏆" : "😔"}</div>
                    <div style={{ fontWeight: 800, fontSize: 14, color: r.isWinner ? "#5b21b6" : "#374151" }}>
                      {r.inGameName}
                    </div>
                    <div style={{ fontSize: 12, marginTop: 4, color: r.isWinner ? "#7c3aed" : "#9ca3af" }}>
                      {r.isWinner ? `৳${r.prize} prize পাবে` : "Prize নেই"}
                    </div>
                    <div style={{ marginTop: 8, fontSize: 11, fontWeight: 700,
                      color: r.isWinner ? "#059669" : "#6b7280",
                      background: r.isWinner ? "#d1fae5" : "#f3f4f6",
                      padding: "3px 10px", borderRadius: 20, display: "inline-block",
                    }}>
                      {r.isWinner ? "✓ Winner" : "Loser"}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12, padding: "10px 14px", background: "#f8fafc", borderRadius: 8, display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: "#6b7280" }}>Winner Prize:</span>
                <span style={{ fontWeight: 800, color: "#059669" }}>৳{match.winPrize || 0}</span>
              </div>
            </div>
          )}

          {/* ════ 2v2 MODE ════ */}
          {match.mode === "2v2" && (
            <div>
              <div style={SL}>👥 কোন Team জিতেছে?</div>

              {/* Team selector */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                {["A", "B"].map((team) => (
                  <div key={team}
                    onClick={() => handleWinTeam(team)}
                    style={{
                      padding: "14px 12px", borderRadius: 12, cursor: "pointer", textAlign: "center",
                      border: `2px solid ${winTeam === team ? "#7c3aed" : "#e5e7eb"}`,
                      background: winTeam === team ? "#ede9fe" : "#fff",
                    }}>
                    <div style={{ fontSize: 24, marginBottom: 4 }}>{winTeam === team ? "🏆" : "🎲"}</div>
                    <div style={{ fontWeight: 800, fontSize: 15, color: winTeam === team ? "#5b21b6" : "#374151" }}>
                      Team {team}
                    </div>
                    <div style={{ fontSize: 11, color: winTeam === team ? "#7c3aed" : "#9ca3af", marginTop: 4 }}>
                      {winTeam === team ? `প্রতিজন ৳${Math.floor((match.winPrize||0)/2)}` : "Prize নেই"}
                    </div>
                  </div>
                ))}
              </div>

              {/* Player assignment */}
              <div style={SL}>কোন player কোন team এ? (Slot assign করুন)</div>
              <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      {["Player", "In-Game Name", "Team", "Prize"].map((h, i) => (
                        <th key={i} style={{ padding: "9px 10px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#6b7280", borderBottom: "1px solid #e5e7eb" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, i) => (
                      <tr key={i} style={{ background: r.team === winTeam ? "#faf5ff" : "#fff" }}>
                        <td style={{ padding: "9px 10px", fontWeight: 700, color: "#7c3aed", fontSize: 12 }}>#{i+1}</td>
                        <td style={{ padding: "9px 10px" }}>
                          <input
                            value={r.inGameName}
                            onChange={(e) => setResults(prev => {
                              const n = [...prev]; n[i] = { ...n[i], inGameName: e.target.value }; return n;
                            })}
                            style={{ border: "1px solid #e5e7eb", borderRadius: 6, padding: "5px 8px", fontSize: 12, width: "100%", boxSizing: "border-box" }}
                          />
                        </td>
                        <td style={{ padding: "9px 10px" }}>
                          <div style={{ display: "flex", gap: 4 }}>
                            {["A", "B"].map((t) => (
                              <button key={t}
                                onClick={() => {
                                  const eachPrize = Math.floor((match.winPrize || 0) / 2);
                                  setResults(prev => {
                                    const n = [...prev];
                                    n[i] = { ...n[i], team: t, isWinner: t === winTeam, prize: t === winTeam ? eachPrize : 0, rank: t === winTeam ? 1 : 2 };
                                    return n;
                                  });
                                }}
                                style={{
                                  padding: "4px 10px", borderRadius: 6, border: `1.5px solid ${r.team === t ? "#7c3aed" : "#e5e7eb"}`,
                                  background: r.team === t ? "#ede9fe" : "#fff", color: r.team === t ? "#5b21b6" : "#6b7280",
                                  fontWeight: 700, fontSize: 11, cursor: "pointer",
                                }}>
                                {t}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td style={{ padding: "9px 10px", fontWeight: 700, color: r.prize > 0 ? "#059669" : "#9ca3af" }}>
                          {r.prize > 0 ? `৳${r.prize}` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: 10, padding: "10px 14px", background: "#f8fafc", borderRadius: 8 }}>
                <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Prize Distribution:</div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>
                  Team {winTeam} জিতেছে → প্রতিজন পাবে ৳{Math.floor((match.winPrize||0)/2)}
                  &nbsp;(মোট ৳{match.winPrize||0})
                </div>
              </div>
            </div>
          )}

          {/* ════ 4PLAYER MODE ════ */}
          {match.mode === "4player" && (
            <div>
              <div style={SL}>🎮 4 Player — Rank অনুযায়ী Prize দিন</div>
              <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      {["Slot", "In-Game Name", "Rank", "Prize (৳)"].map((h, i) => (
                        <th key={i} style={{ padding: "9px 10px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#6b7280", borderBottom: "1px solid #e5e7eb" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, i) => (
                      <tr key={i} style={{ background: r.rank === 1 ? "#faf5ff" : i % 2 === 0 ? "#fff" : "#fafafa" }}>
                        <td style={{ padding: "9px 10px", fontWeight: 700, color: "#7c3aed", fontSize: 12 }}>
                          {r.rank === 1 ? "🥇" : r.rank === 2 ? "🥈" : r.rank === 3 ? "🥉" : `#${r.rank}`}
                        </td>
                        <td style={{ padding: "9px 10px" }}>
                          <input
                            value={r.inGameName}
                            onChange={(e) => update4p(i, "inGameName", e.target.value)}
                            style={{ border: "1px solid #e5e7eb", borderRadius: 6, padding: "5px 8px", fontSize: 12, width: "100%", boxSizing: "border-box" }}
                          />
                        </td>
                        <td style={{ padding: "9px 10px" }}>
                          <select
                            value={r.rank}
                            onChange={(e) => {
                              const newRank = Number(e.target.value);
                              const prizes4p = [
                                match.prizes?.first  || 0,
                                match.prizes?.second || 0,
                                match.prizes?.third  || 0,
                                match.prizes?.fourth || 0,
                              ];
                              setResults(prev => {
                                const n = [...prev];
                                n[i] = { ...n[i], rank: newRank, prize: prizes4p[newRank - 1] || 0 };
                                return n;
                              });
                            }}
                            style={{ border: "1px solid #e5e7eb", borderRadius: 6, padding: "5px 8px", fontSize: 12, width: 70 }}
                          >
                            {[1, 2, 3, 4].map(v => <option key={v} value={v}>{v}</option>)}
                          </select>
                        </td>
                        <td style={{ padding: "9px 10px" }}>
                          <input
                            type="number" min="0"
                            value={r.prize}
                            onChange={(e) => update4p(i, "prize", e.target.value)}
                            style={{
                              border: `1px solid ${r.prize > 0 ? "#a7f3d0" : "#e5e7eb"}`,
                              borderRadius: 6, padding: "5px 8px", fontSize: 12, width: 90,
                              background: r.prize > 0 ? "#f0fdf4" : "#fff",
                              fontWeight: r.prize > 0 ? 700 : 400,
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Prize breakdown */}
              <div style={{ marginTop: 10, padding: "10px 14px", background: "#f8fafc", borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>Prize Setup (match থেকে):</div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 12 }}>
                  {["first","second","third","fourth"].map((k, i) => (
                    <span key={k} style={{ fontWeight: 600 }}>
                      {["🥇","🥈","🥉","4️⃣"][i]} ৳{match.prizes?.[k] || 0}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Total + submit */}
          <div style={{ marginTop: 16, padding: "12px 14px", background: "#f8fafc", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 600 }}>মোট Prize Distribute হবে:</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: totalPrize > 0 ? "#059669" : "#374151" }}>৳{totalPrize}</span>
          </div>

          {msg && (
            <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: msg.includes("✅") ? "#d1fae5" : "#fee2e2",
              color: msg.includes("✅") ? "#065f46" : "#991b1b",
            }}>
              {msg}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button onClick={onClose}
              style={{ flex: 1, padding: 12, borderRadius: 10, background: "#f3f4f6", border: "none", fontSize: 13, cursor: "pointer" }}>
              Cancel
            </button>
            <button onClick={submit} disabled={saving}
              style={{
                flex: 2, padding: 12, borderRadius: 10,
                background: saving ? "#a7f3d0" : "linear-gradient(135deg, #059669, #047857)",
                color: "#fff", border: "none", fontSize: 14, fontWeight: 800,
                cursor: saving ? "not-allowed" : "pointer",
              }}>
              {saving ? "⏳ Submitting..." : "✅ Submit & Prize Distribute"}
            </button>
          </div>
        </div>
      </div>

      {/* Fullscreen image */}
      {previewImg && (
        <div onClick={() => setPreviewImg(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", cursor: "zoom-out" }}>
          <img src={previewImg} alt="" style={{ maxWidth: "95vw", maxHeight: "92vh", borderRadius: 10, objectFit: "contain" }} />
          <div style={{ position: "absolute", top: 16, right: 20, color: "#fff", fontSize: 28, cursor: "pointer" }}>✕</div>
        </div>
      )}
    </div>
  );
};

// ─── CREATE FORM ──────────────────────────────────────────────────
const CreateLudoForm = ({ onCreated, onCancel }) => {
  const [form, setForm] = useState({
    title: "", mode: "4player", entryFee: "", winPrize: "",
    startTime: "", map: "Classic", device: "Mobile", image: "",
    prizes: { first: "", second: "", third: "", fourth: "" },
  });
  const [msg, setMsg]       = useState("");
  const [loading, setLoading] = useState(false);

  const set  = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));
  const setP = (k) => (e) => setForm(p => ({ ...p, prizes: { ...p.prizes, [k]: e.target.value } }));

  const handleImg = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = (ev) => setForm(p => ({ ...p, image: ev.target.result }));
    r.readAsDataURL(file);
  };

  const submit = async () => {
    if (!form.title.trim()) { setMsg("❌ Match Title দিন"); return; }
    if (!form.startTime)    { setMsg("❌ Start Time দিন"); return; }
    setLoading(true); setMsg("");

    const payload = {
      ...form,
      entryFee: Number(form.entryFee || 0),
      winPrize: Number(form.winPrize || 0),
      prizes: {
        first:  Number(form.prizes.first  || 0),
        second: Number(form.prizes.second || 0),
        third:  Number(form.prizes.third  || 0),
        fourth: Number(form.prizes.fourth || 0),
      },
    };

    const d = await api("/ludo-tournament/create", { method: "POST", body: JSON.stringify(payload) });
    setLoading(false);
    if (d.success) { setMsg("✅ Tournament তৈরি হয়েছে!"); setTimeout(() => onCreated?.(), 700); }
    else setMsg("❌ " + (d.message || "Failed"));
  };

  const inp = { width: "100%", padding: "10px 12px", border: "1.5px solid #e5e7eb", borderRadius: 10, fontSize: 13, background: "#f9fafb", outline: "none", boxSizing: "border-box" };

  // Prize fields depend on mode
  const is1v1 = form.mode === "1v1";
  const is2v2 = form.mode === "2v2";

  return (
    <div style={{ background: "#fff", borderRadius: 14, padding: 20, border: "1px solid #e5e7eb", marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>🎲 নতুন Ludo Tournament</div>
        <button onClick={onCancel} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#9ca3af" }}>✕</button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <label style={LBL}>Match Title *</label>
          <input placeholder="যেমন: Ludo Solo #1" style={inp} value={form.title} onChange={set("title")} />
        </div>

        <div>
          <label style={LBL}>Mode</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {MODES.map((m) => (
              <button key={m.id} type="button" onClick={() => setForm(p => ({ ...p, mode: m.id }))}
                style={{
                  padding: "10px 6px", borderRadius: 10, cursor: "pointer",
                  border: `2px solid ${form.mode === m.id ? "#7c3aed" : "#e5e7eb"}`,
                  background: form.mode === m.id ? "#ede9fe" : "#fff",
                  color: form.mode === m.id ? "#5b21b6" : "#6b7280",
                  fontSize: 11, fontWeight: 700,
                }}>
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={LBL}>Start Time *</label>
          <input type="datetime-local" style={inp} value={form.startTime} onChange={set("startTime")} />
        </div>

        <div>
          <label style={LBL}>Entry Fee (৳)</label>
          <input placeholder="Entry Fee" style={inp} type="number" value={form.entryFee} onChange={set("entryFee")} />
        </div>

        {/* Prize fields by mode */}
        {is1v1 && (
          <div>
            <label style={LBL}>Winner Prize (৳) — 1 জন পাবে</label>
            <input placeholder="Winner Prize" style={inp} type="number" value={form.winPrize} onChange={set("winPrize")} />
          </div>
        )}

        {is2v2 && (
          <div>
            <label style={LBL}>Total Prize Pool (৳) — জয়ী team এর 2 জন ভাগ করে পাবে</label>
            <input placeholder="Total Prize (2 জনে ভাগ হবে)" style={inp} type="number" value={form.winPrize} onChange={set("winPrize")} />
            {form.winPrize && (
              <div style={{ fontSize: 11, color: "#7c3aed", marginTop: 4 }}>
                প্রতিজন পাবে: ৳{Math.floor(Number(form.winPrize) / 2)}
              </div>
            )}
          </div>
        )}

        {!is1v1 && !is2v2 && (
          <div>
            <label style={LBL}>Rank Prize (৳) — 4 Player Solo</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <input placeholder="🥇 1st Prize" style={inp} type="number" value={form.prizes.first}  onChange={setP("first")} />
              <input placeholder="🥈 2nd Prize" style={inp} type="number" value={form.prizes.second} onChange={setP("second")} />
              <input placeholder="🥉 3rd Prize" style={inp} type="number" value={form.prizes.third}  onChange={setP("third")} />
              <input placeholder="4th Prize"    style={inp} type="number" value={form.prizes.fourth} onChange={setP("fourth")} />
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label style={LBL}>Map</label>
            <select style={inp} value={form.map} onChange={set("map")}>
              {LUDO_MAPS.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label style={LBL}>Device</label>
            <select style={inp} value={form.device} onChange={set("device")}>
              <option>Mobile</option><option>PC</option>
            </select>
          </div>
        </div>

        <div>
          <label style={LBL}>Banner Image (optional)</label>
          <input type="file" accept="image/*" onChange={handleImg} style={{ fontSize: 12, color: "#6b7280" }} />
          {form.image && <img src={form.image} alt="" style={{ marginTop: 8, width: "100%", height: 90, objectFit: "cover", borderRadius: 8 }} />}
        </div>

        <button type="button" onClick={submit} disabled={loading}
          style={{
            padding: 13, background: loading ? "#a78bfa" : "linear-gradient(135deg, #7c3aed, #4f46e5)",
            color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer", marginTop: 4,
          }}>
          {loading ? "⏳ Creating..." : "🎲 Create Ludo Tournament"}
        </button>

        {msg && (
          <div style={{ padding: "10px 14px", borderRadius: 8, fontSize: 13,
            background: msg.includes("✅") ? "#d1fae5" : "#fee2e2",
            color: msg.includes("✅") ? "#065f46" : "#991b1b",
          }}>
            {msg}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── MATCH CARD ───────────────────────────────────────────────────
const MatchCard = ({ m, onResult, onDelete, onRoomUpdate }) => {
  const [roomInput, setRoomInput] = useState(m.roomCode || "");
  const [roomLoading, setRoomLoading] = useState(false);

  const updateRoom = async () => {
    setRoomLoading(true);
    await api(`/ludo-tournament/update-room/${m._id}`, {
      method: "PUT", body: JSON.stringify({ roomCode: roomInput }),
    });
    setRoomLoading(false);
    onRoomUpdate?.();
  };

  const deleteMatch = async () => {
    if (!window.confirm(`"${m.title}" delete করবেন?`)) return;
    await api(`/ludo-tournament/${m._id}`, { method: "DELETE" });
    onDelete?.();
  };

  const prizeInfo = () => {
    if (m.mode === "1v1") return `Winner: ৳${m.winPrize || 0}`;
    if (m.mode === "2v2") return `Team Prize: ৳${m.winPrize || 0} (প্রতিজন ৳${Math.floor((m.winPrize||0)/2)})`;
    return `🥇৳${m.prizes?.first||0} 🥈৳${m.prizes?.second||0} 🥉৳${m.prizes?.third||0}`;
  };

  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: 16, marginBottom: 10, border: "1px solid #e5e7eb", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: "#111" }}>{m.title}</div>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
            {m.mode.toUpperCase()} &nbsp;·&nbsp; Entry: ৳{m.entryFee} &nbsp;·&nbsp; {prizeInfo()}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Badge status={m.status} />
          <button onClick={deleteMatch} style={{ background: "none", border: "none", color: "#dc2626", fontSize: 16, cursor: "pointer" }}>🗑</button>
        </div>
      </div>

      {/* Slots */}
      <div style={{ display: "flex", gap: 5, marginBottom: 12, flexWrap: "wrap" }}>
        {Array.from({ length: m.totalSlots }).map((_, i) => (
          <div key={i} style={{
            width: 30, height: 30, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, fontWeight: 700,
            background: i < m.joinedPlayers ? "#7c3aed" : "#f3f4f6",
            color: i < m.joinedPlayers ? "#fff" : "#9ca3af",
          }}>
            {i < m.joinedPlayers ? (m.joinedUsers?.[i]?.inGameName?.[0]?.toUpperCase() || "✓") : "—"}
          </div>
        ))}
        <span style={{ fontSize: 11, color: "#6b7280", alignSelf: "center", marginLeft: 4 }}>
          {m.joinedPlayers}/{m.totalSlots}
        </span>
      </div>

      {/* Room code */}
      {(m.status === "upcoming" || m.status === "live") && (
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <input
            placeholder="Room Code দিন"
            value={roomInput}
            onChange={(e) => setRoomInput(e.target.value)}
            style={{ flex: 1, padding: "7px 10px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 12 }}
          />
          <button onClick={updateRoom} disabled={roomLoading}
            style={{ padding: "7px 14px", background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            {roomLoading ? "..." : "Set"}
          </button>
        </div>
      )}

      {m.roomCode && m.status === "live" && (
        <div style={{ background: "#f0fdf4", padding: "6px 10px", borderRadius: 6, fontSize: 12, marginBottom: 8, fontWeight: 600, color: "#065f46" }}>
          🔑 Room Code: {m.roomCode}
        </div>
      )}

      {/* Result button */}
      {m.status === "live" && (
        <button onClick={() => onResult(m)}
          style={{
            width: "100%", padding: "11px 0",
            background: "linear-gradient(135deg, #10b981, #059669)",
            color: "#fff", border: "none", borderRadius: 8, fontWeight: 800, fontSize: 13, cursor: "pointer",
          }}>
          📸 Result দিন
        </button>
      )}

      {/* Completed result */}
      {m.status === "completed" && m.results?.length > 0 && (
        <div style={{ background: "#f0fdf4", borderRadius: 8, padding: "10px 12px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#065f46", marginBottom: 8 }}>🏆 Final Result</div>
          {[...m.results].sort((a, b) => a.rank - b.rank).map((r, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", fontSize: 12 }}>
              <span>
                {r.rank === 1 ? "🥇" : r.rank === 2 ? "🥈" : r.rank === 3 ? "🥉" : `#${r.rank}`}
                &nbsp; {r.inGameName || "—"}
                {m.mode === "2v2" && r.team ? <span style={{ color: "#7c3aed", marginLeft: 6 }}>(Team {r.team})</span> : null}
              </span>
              <span style={{ fontWeight: 700, color: r.prize > 0 ? "#059669" : "#9ca3af" }}>
                {r.prize > 0 ? `৳${r.prize}` : "—"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── MAIN ─────────────────────────────────────────────────────────
const LudoTournamentManager = () => {
  const [matches, setMatches]         = useState([]);
  const [loading, setLoading]         = useState(false);
  const [showCreate, setShowCreate]   = useState(false);
  const [filter, setFilter]           = useState("all");
  const [resultMatch, setResultMatch] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const d = await api("/ludo-tournament");
    setMatches(Array.isArray(d?.data) ? d.data : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = filter === "all" ? matches : matches.filter(m => m.status === filter);
  const counts = {
    all:       matches.length,
    upcoming:  matches.filter(m => m.status === "upcoming").length,
    live:      matches.filter(m => m.status === "live").length,
    completed: matches.filter(m => m.status === "completed").length,
  };

  return (
    <div style={{ padding: 16, maxWidth: 950, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>🎲 Ludo Tournaments</div>
          <div style={{ fontSize: 12, color: "#9ca3af" }}>Total: {matches.length}</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setShowCreate(v => !v)}
            style={{
              padding: "9px 16px",
              background: showCreate ? "#e5e7eb" : "linear-gradient(135deg, #7c3aed, #4f46e5)",
              color: showCreate ? "#374151" : "#fff",
              border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer",
            }}>
            {showCreate ? "✕ বন্ধ করুন" : "+ নতুন Tournament"}
          </button>
          <button onClick={load} style={{ padding: "9px 12px", background: "#f3f4f6", borderRadius: 8, border: "none", cursor: "pointer" }}>
            {loading ? "⏳" : "🔄"}
          </button>
        </div>
      </div>

      {/* Create Form — inline, no tab */}
      {showCreate && (
        <CreateLudoForm
          onCreated={() => { setShowCreate(false); load(); }}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {/* Filter */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {["all","upcoming","live","completed"].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            style={{
              padding: "6px 14px", borderRadius: 20, border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer",
              background: filter === f ? "#7c3aed" : "#f3f4f6",
              color: filter === f ? "#fff" : "#374151",
            }}>
            {f.toUpperCase()} ({counts[f]})
          </button>
        ))}
      </div>

      {loading && <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>⏳ Loading...</div>}
      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>
          কোনো tournament নেই।{" "}
          <span style={{ color: "#7c3aed", cursor: "pointer" }} onClick={() => setShowCreate(true)}>
            + নতুন বানান
          </span>
        </div>
      )}
      {filtered.map((m) => (
        <MatchCard key={m._id} m={m}
          onResult={(match) => setResultMatch(match)}
          onDelete={load}
          onRoomUpdate={load}
        />
      ))}

      {resultMatch && (
        <ImageResultModal
          match={resultMatch}
          onClose={() => setResultMatch(null)}
          onDone={load}
        />
      )}
    </div>
  );
};

const LBL = { fontSize: 11, color: "#6b7280", marginBottom: 4, display: "block", fontWeight: 600 };
const SL  = { fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.4 };

export default LudoTournamentManager;