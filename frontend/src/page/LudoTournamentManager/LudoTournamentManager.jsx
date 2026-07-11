 // LudoTournamentManager.jsx — Ludo-specific prize system (no kills)
// 1v1: winner (rank 1) পুরো prize পাবে
// 2v2: winning team এর 2 জন prize ভাগ করে পাবে
// 4player: rank অনুযায়ী prize (prizes.first/second/third/fourth)

import React, { useState, useEffect, useCallback } from "react";
import ImageResultModal from "../../Component/ImageResultModal/ImageResultModal";

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
  const [ludoEnabled, setLudoEnabled] = useState(true);
  const [toggleLoading, setToggleLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const d = await api("/ludo-tournament");
    setMatches(Array.isArray(d?.data) ? d.data : []);
    setLoading(false);
  }, []);

  const loadSettings = useCallback(async () => {
    const d = await api("/settings");

    if (d?.success && d.data?.ludo_enabled !== undefined) {
      setLudoEnabled(d.data.ludo_enabled);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleToggleLudo = async () => {
    const newVal = !ludoEnabled;

    // ✅ বন্ধ করার আগে confirm — ভুল ক্লিক থেকে বাঁচাবে
    if (!newVal && !window.confirm("Ludo Tournament পুরো app থেকে বন্ধ করে দিতে চান?")) {
      return;
    }

    setToggleLoading(true);

    const res = await api("/settings/ludo_enabled", {
      method: "PUT",
      body: JSON.stringify({ value: newVal }),
    });

    setToggleLoading(false);

    if (res?.success) {
      setLudoEnabled(newVal);
    } else {
      alert(res?.message || "Toggle করা যায়নি");
    }
  };

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

          <button
            onClick={handleToggleLudo}
            disabled={toggleLoading}
            style={{
              padding: "9px 16px",
              background: ludoEnabled ? "#fee2e2" : "#d1fae5",
              color: ludoEnabled ? "#991b1b" : "#065f46",
              border: "none",
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 13,
              cursor: toggleLoading ? "not-allowed" : "pointer",
            }}
          >
            {toggleLoading
              ? "⏳..."
              : ludoEnabled
              ? "🚫 Ludo বন্ধ করুন"
              : "✅ Ludo চালু করুন"}
          </button>

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

export default LudoTournamentManager;