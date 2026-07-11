 // frontend/src/Component/ImageResultModal/ImageResultModal.jsx
// ─────────────────────────────────────────────────────────────────
// Admin এর Result-Submit Modal
// Flow: match এ user-দের submit করা screenshot fetch করে দেখানো →
//       admin দেখে winner/rank select করে → prize distribute
// Props: match (object), onClose (fn), onDone (fn)
// ─────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useRef } from "react";

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

const SL = { fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.4 };

// ─── Prize calculator helper ──────────────────────────────────────
// Returns array of {userId, inGameName, rank, prize, isWinner, team}
const buildInitialResults = (match) => {
  const users = match.joinedUsers || [];
  const mode  = match.mode;
  const prizes = match.prizes || {};

  if (mode === "1v1") {
    return users.map((u, i) => ({
      userId:     u.userId?._id || u.userId || "",
      inGameName: u.inGameName || `Player ${i + 1}`,
      rank:       i === 0 ? 1 : 2,
      prize:      i === 0 ? (match.winPrize || 0) : 0,
      isWinner:   i === 0,
    }));
  }

  if (mode === "2v2") {
    const eachPrize = Math.floor((match.winPrize || 0) / 2);
    return users.map((u, i) => ({
      userId:     u.userId?._id || u.userId || "",
      inGameName: u.inGameName || `Player ${i + 1}`,
      rank:       i < 2 ? 1 : 2,
      prize:      i < 2 ? eachPrize : 0,
      team:       i < 2 ? "A" : "B",
      isWinner:   i < 2,
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
    userId:     u.userId?._id || u.userId || "",
    inGameName: u.inGameName || `Player ${i + 1}`,
    rank:       i + 1,
    prize:      rankPrize[i] || 0,
  }));
};

// ─── IMAGE RESULT MODAL ───────────────────────────────────────────
const ImageResultModal = ({ match, onClose, onDone }) => {
  const [results, setResults]         = useState(() => buildInitialResults(match));
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubs, setLoadingSubs] = useState(true);
  const [previewImg, setPreviewImg]   = useState(null);
  const [winTeam, setWinTeam]         = useState("A"); // for 2v2
  const [saving, setSaving]           = useState(false);
  const [msg, setMsg]                 = useState("");

  // ✅ Player-দের আসল submit করা screenshot fetch — এটাই "match folder"
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingSubs(true);
      const res = await api(`/ludo-result/admin/match/${match._id}`);
      if (!cancelled) {
        setSubmissions(res?.success ? res.data : []);
        setLoadingSubs(false);
      }
    })();
    return () => { cancelled = true; };
  }, [match._id]);

  const rejectSubmission = async (submissionId) => {
    const adminNote = window.prompt("Reject করার কারণ (optional):", "") || "";
    const res = await api(`/ludo-result/admin/reject/${submissionId}`, {
      method: "PUT",
      body: JSON.stringify({ adminNote }),
    });
    if (res?.success) {
      setSubmissions(prev => prev.map(s =>
        s.id === submissionId ? { ...s, status: "rejected", admin_note: adminNote } : s
      ));
    } else {
      alert(res?.message || "Reject করা যায়নি");
    }
  };

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

  const update4p = (i, field, val) => {
    setResults(prev => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: field === "rank" ? Number(val) : Number(val) || 0 };
      return next;
    });
  };

  const submit = async () => {
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

    // ✅ canonical endpoint — screenshot submissions গুলো এটাই 'published' করে দেয়
    const res = await api(`/ludo-result/admin/submit/${match._id}`, {
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

          {/* ✅ Player-দের match-এ submit করা আসল screenshot (match folder) */}
          <div style={{ marginBottom: 20 }}>
            <div style={SL}>📸 Player-দের submit করা Screenshot ({submissions.length})</div>

            {loadingSubs && <div style={{ fontSize: 12, color: "#9ca3af" }}>⏳ Loading...</div>}
            {!loadingSubs && submissions.length === 0 && (
              <div style={{ fontSize: 12, color: "#9ca3af", background: "#fffbeb", padding: "8px 12px", borderRadius: 8 }}>
                এখনো কেউ screenshot submit করেনি।
              </div>
            )}
            {!loadingSubs && submissions.length > 0 && (
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {submissions.map((s) => (
                  <div key={s.id} style={{ width: 130 }}>
                    <img src={s.screenshot_url} alt=""
                      onClick={() => setPreviewImg(s.screenshot_url)}
                      style={{
                        width: 130, height: 84, objectFit: "cover", borderRadius: 8, cursor: "zoom-in",
                        border: `2px solid ${s.status === "rejected" ? "#fca5a5" : "#e5e7eb"}`,
                        opacity: s.status === "rejected" ? 0.5 : 1,
                      }}
                    />
                    <div style={{ fontSize: 11, fontWeight: 700, marginTop: 4 }}>{s.submitter_name}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 2 }}>
                      <span style={{ fontSize: 10, color: "#9ca3af" }}>{s.status}</span>
                      {s.status !== "rejected" && (
                        <button onClick={() => rejectSubmission(s.id)}
                          style={{ fontSize: 10, color: "#dc2626", background: "none", border: "none", cursor: "pointer" }}>
                          reject
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {submissions.length > 0 && (
              <p style={{ fontSize: 11, color: "#9ca3af", margin: "8px 0 0" }}>
                💡 Screenshot এ click করে বড় দেখুন, তারপর নিচে সঠিক winner/rank সিলেক্ট করুন।
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
                      {winTeam === team ? `প্রতিজন ৳${Math.floor((match.winPrize || 0) / 2)}` : "Prize নেই"}
                    </div>
                  </div>
                ))}
              </div>

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
                        <td style={{ padding: "9px 10px", fontWeight: 700, color: "#7c3aed", fontSize: 12 }}>#{i + 1}</td>
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
                  Team {winTeam} জিতেছে → প্রতিজন পাবে ৳{Math.floor((match.winPrize || 0) / 2)}
                  &nbsp;(মোট ৳{match.winPrize || 0})
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

              <div style={{ marginTop: 10, padding: "10px 14px", background: "#f8fafc", borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>Prize Setup (match থেকে):</div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 12 }}>
                  {["first", "second", "third", "fourth"].map((k, i) => (
                    <span key={k} style={{ fontWeight: 600 }}>
                      {["🥇", "🥈", "🥉", "4️⃣"][i]} ৳{match.prizes?.[k] || 0}
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

export default ImageResultModal;