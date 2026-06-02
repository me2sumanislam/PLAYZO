 import React, { useState, useEffect, useCallback } from "react";

const API_BASE = (import.meta.env.VITE_API_URL || "https://playzo-vn8e.onrender.com").replace("/api", "");

const getToken = () =>
  localStorage.getItem("adminToken") || localStorage.getItem("token") || "";

const api = async (path, opts = {}) => {
  try {
    const res = await fetch(`${API_BASE}/api${path}`, {
      headers: { 
        "Content-Type": "application/json", 
        Authorization: `Bearer ${getToken()}` 
      },
      ...opts,
    });
    return await res.json();
  } catch (err) {
    return { success: false, message: "Network error" };
  }
};

const fmt = (n) => "৳" + Number(n || 0).toLocaleString();

const inp = {
  width: "100%", 
  boxSizing: "border-box",
  padding: "10px 12px", 
  border: "1.5px solid #e5e7eb",
  borderRadius: 10, 
  fontSize: 13, 
  background: "#f9fafb",
  outline: "none", 
  fontFamily: "inherit",
};

const LUDO_MAPS = ["Classic", "Quick Ludo", "Arrow", "Magic"];
const MODES = [
  { id: "1v1", label: "⚔️ 1 vs 1 (2 জন)", slots: 2 },
  { id: "2v2", label: "👥 2 vs 2 (4 জন)", slots: 4 },
  { id: "4player", label: "🎮 4 Player Solo", slots: 4 },
];

// Create Form
const CreateLudoForm = ({ onCreated }) => {
  const [form, setForm] = useState({
    title: "", mode: "4player",
    entryFee: "", winPrize: "",
    startTime: "", map: "Classic", device: "Mobile", image: "",
    prizes: { first: "", second: "", third: "", fourth: "" },
  });
  const [msg, setMsg] = useState("");

  const f = (key) => ({
    style: inp,
    value: form[key] || "",
    onChange: (e) => setForm(p => ({ ...p, [key]: e.target.value }))
  });

  const fp = (key) => ({
    style: inp,
    value: form.prizes[key] || "",
    onChange: (e) => setForm(p => ({ ...p, prizes: { ...p.prizes, [key]: e.target.value } }))
  });

  const handleImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setForm(p => ({ ...p, image: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    if (!form.title || !form.startTime) {
      setMsg("❌ Title ও Start Time দিন");
      return;
    }

    const payload = {
      ...form,
      entryFee: Number(form.entryFee || 0),
      winPrize: Number(form.winPrize || 0),
      prizes: {
        first: Number(form.prizes.first || 0),
        second: Number(form.prizes.second || 0),
        third: Number(form.prizes.third || 0),
        fourth: Number(form.prizes.fourth || 0),
      },
    };

    const d = await api("/ludo-tournament/create", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    if (d.success) {
      setMsg("✅ Ludo tournament created successfully!");
      setForm({
        title: "", mode: "4player", entryFee: "", winPrize: "",
        startTime: "", map: "Classic", device: "Mobile", image: "",
        prizes: { first: "", second: "", third: "", fourth: "" }
      });
      onCreated?.();
    } else {
      setMsg("❌ " + (d.message || "Failed to create"));
    }
  };

  return (
    <div style={{ background: "#fff", borderRadius: 14, padding: 20, border: "1px solid #e5e7eb" }}>
      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 18, color: "#111" }}>🎲 নতুন Ludo Tournament</div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4, fontWeight: 600 }}>Match Title *</div>
          <input placeholder="যেমন: Ludo Solo #1" {...f("title")} />
        </div>

        <div>
          <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6, fontWeight: 600 }}>Mode</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => setForm(p => ({ ...p, mode: m.id }))}
                style={{
                  padding: "10px 8px",
                  borderRadius: 10,
                  border: `2px solid ${form.mode === m.id ? "#7c3aed" : "#e5e7eb"}`,
                  background: form.mode === m.id ? "#ede9fe" : "#fff",
                  color: form.mode === m.id ? "#5b21b6" : "#6b7280",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4, fontWeight: 600 }}>Start Time *</div>
          <input type="datetime-local" {...f("startTime")} />
        </div>

        <div>
          <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6, fontWeight: 600 }}>Entry & Prize</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <input placeholder="Entry Fee" {...f("entryFee")} type="number" />
            <input placeholder="Win Prize" {...f("winPrize")} type="number" />
          </div>
        </div>

        <button 
          onClick={submit}
          style={{
            padding: 12,
            background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            marginTop: 10
          }}
        >
          🎲 Create Ludo Tournament
        </button>

        {msg && <div style={{ marginTop: 10, padding: 10, borderRadius: 8, background: msg.includes("✅") ? "#d1fae5" : "#fee2e2" }}>{msg}</div>}
      </div>
    </div>
  );
};

// ================= MAIN COMPONENT =================
const LudoTournamentManager = () => {
  const [tab, setTab] = useState("list");
  const [matches, setMatches] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);

  // Result Submission States
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [results, setResults] = useState([]);
  const [winningTeam, setWinningTeam] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const d = await api("/ludo-tournament");
    setMatches(Array.isArray(d?.data) ? d.data : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openResultModal = (match) => {
    setSelectedMatch(match);
    const initialResults = (match.joinedUsers || []).map((player, index) => ({
      userId: player.userId?._id || player.userId,
      rank: index + 1,
      prize: 0,
      kills: 0,
    }));
    setResults(initialResults);
    setWinningTeam("");
    setTab("result");
  };

  const submitResult = async () => {
    if (!selectedMatch) return;

    const payload = {
      results,
      ...(selectedMatch.mode === "2v2" && { winningTeam })
    };

    const res = await api(`/ludo-tournament/result/${selectedMatch._id}`, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (res.success) {
      alert("✅ Result সফলভাবে সাবমিট হয়েছে এবং Prize বিতরণ করা হয়েছে!");
      setTab("list");
      setSelectedMatch(null);
      load();
    } else {
      alert("❌ " + (res.message || "Something went wrong"));
    }
  };

  const filtered = filter === "all" ? matches : matches.filter(m => m.status === filter);

  const counts = {
    all: matches.length,
    upcoming: matches.filter(m => m.status === "upcoming").length,
    live: matches.filter(m => m.status === "live").length,
    completed: matches.filter(m => m.status === "completed").length,
  };

  return (
    <div style={{ padding: 16, maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>🎲 Ludo Tournaments</div>
          <div style={{ fontSize: 12, color: "#9ca3af" }}>Total: {matches.length}</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setTab("create")} style={{ padding: "8px 16px", background: "#7c3aed", color: "#fff", border: "none", borderRadius: 8 }}>
            + Create New
          </button>
          <button onClick={load} style={{ padding: "8px 12px", background: "#f3f4f6", borderRadius: 8 }}>🔄</button>
        </div>
      </div>

      {tab === "create" && <CreateLudoForm onCreated={load} />}

      {tab === "list" && (
        <>
          <div style={{ marginBottom: 12 }}>
            {["all", "upcoming", "live", "completed"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  marginRight: 6,
                  padding: "6px 12px",
                  borderRadius: 20,
                  background: filter === f ? "#7c3aed" : "#f3f4f6",
                  color: filter === f ? "#fff" : "#374151",
                  border: "none",
                }}
              >
                {f.toUpperCase()} ({counts[f]})
              </button>
            ))}
          </div>

          {filtered.map((m) => (
            <div key={m._id} style={{ background: "#fff", padding: 16, borderRadius: 12, marginBottom: 12, border: "1px solid #e5e7eb" }}>
              <h3>{m.title}</h3>
              <p>Status: <strong>{m.status}</strong> | Mode: <strong>{m.mode}</strong></p>
              <p>Joined: {m.joinedPlayers}/{m.totalSlots}</p>
              
              {m.status === "live" && (
                <button 
                  onClick={() => openResultModal(m)}
                  style={{ 
                    background: "#10b981", 
                    color: "white", 
                    padding: "10px 18px", 
                    border: "none", 
                    borderRadius: 8,
                    fontWeight: 700,
                    marginTop: 10
                  }}
                >
                  📝 Submit Result
                </button>
              )}

              {m.status === "completed" && m.results?.length > 0 && (
                <p style={{ color: "#10b981", marginTop: 8 }}>✅ Result Submitted</p>
              )}
            </div>
          ))}
        </>
      )}

      {/* ================= RESULT SUBMISSION FORM ================= */}
      {tab === "result" && selectedMatch && (
        <div style={{ background: "#fff", padding: 24, borderRadius: 12, border: "1px solid #e5e7eb" }}>
          <h3>Submit Result — {selectedMatch.title} ({selectedMatch.mode})</h3>
          <p><strong>Players:</strong> {selectedMatch.joinedPlayers}</p>

          {selectedMatch.mode === "2v2" && (
            <div style={{ margin: "20px 0" }}>
              <label style={{ fontWeight: 600 }}>Winning Team:</label>
              <input 
                type="text" 
                placeholder="Team A or Team B"
                value={winningTeam}
                onChange={(e) => setWinningTeam(e.target.value)}
                style={{ width: "100%", padding: 12, marginTop: 8, borderRadius: 8 }}
              />
            </div>
          )}

          <table style={{ width: "100%", borderCollapse: "collapse", margin: "20px 0" }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                <th style={{ padding: 12, textAlign: "left" }}>Player</th>
                <th style={{ padding: 12 }}>Rank</th>
                <th style={{ padding: 12 }}>Prize (৳)</th>
                <th style={{ padding: 12 }}>Kills</th>
              </tr>
            </thead>
            <tbody>
              {results.map((res, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: 12, fontWeight: 600 }}>
                    {selectedMatch.joinedUsers[i]?.userId?.name || `Player ${i + 1}`}
                  </td>
                  <td style={{ padding: 12 }}>
                    <input 
                      type="number" 
                      min="1"
                      value={res.rank} 
                      onChange={(e) => {
                        const newResults = [...results];
                        newResults[i].rank = Number(e.target.value);
                        setResults(newResults);
                      }}
                      style={{ width: 70, padding: 8 }}
                    />
                  </td>
                  <td style={{ padding: 12 }}>
                    <input 
                      type="number" 
                      value={res.prize} 
                      onChange={(e) => {
                        const newResults = [...results];
                        newResults[i].prize = Number(e.target.value);
                        setResults(newResults);
                      }}
                      style={{ width: 110, padding: 8 }}
                    />
                  </td>
                  <td style={{ padding: 12 }}>
                    <input 
                      type="number" 
                      value={res.kills} 
                      onChange={(e) => {
                        const newResults = [...results];
                        newResults[i].kills = Number(e.target.value);
                        setResults(newResults);
                      }}
                      style={{ width: 90, padding: 8 }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: 30 }}>
            <button 
              onClick={submitResult}
              style={{ 
                background: "#10b981", 
                color: "white", 
                padding: "14px 28px", 
                border: "none", 
                borderRadius: 10, 
                fontSize: 16,
                fontWeight: 700,
                marginRight: 12
              }}
            >
              ✅ Submit Final Result
            </button>
            <button 
              onClick={() => setTab("list")}
              style={{ padding: "14px 24px", background: "#e5e7eb", border: "none", borderRadius: 10 }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LudoTournamentManager;