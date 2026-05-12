 import React, { useState, useEffect } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const Leaderboard = () => {
  const [tab, setTab]       = useState("weekly"); // weekly | alltime
  const [category, setCategory] = useState("byPrize"); // byPrize | byKills | byMatches
  const [data, setData]     = useState({ byPrize: [], byKills: [], byMatches: [] });
  const [loading, setLoading] = useState(false);
  const [weekStart, setWeekStart] = useState("");

  useEffect(() => {
    loadData();
  }, [tab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/leaderboard/${tab}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        if (json.weekStart) setWeekStart(json.weekStart);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const categories = [
    { id: "byPrize",   label: "🏆 Prize",   color: "#f59e0b" },
    { id: "byKills",   label: "🔫 Kills",   color: "#ef4444" },
    { id: "byMatches", label: "🎮 Matches", color: "#8b5cf6" },
  ];

  const players = data[category] || [];

  const rankStyle = (i) => {
    if (i === 0) return { bg: "#fef9c3", border: "#fde68a", color: "#92400e", badge: "🥇" };
    if (i === 1) return { bg: "#f1f5f9", border: "#e2e8f0", color: "#475569", badge: "🥈" };
    if (i === 2) return { bg: "#fff7ed", border: "#fed7aa", color: "#9a3412", badge: "🥉" };
    return { bg: "#f9fafb", border: "#e5e7eb", color: "#374151", badge: `#${i + 1}` };
  };

  const valueLabel = () => {
    if (category === "byPrize")   return { key: "totalPrize",   suffix: " TK" };
    if (category === "byKills")   return { key: "totalKills",   suffix: " Kills" };
    if (category === "byMatches") return { key: "totalMatches", suffix: " Matches" };
  };

  const val = valueLabel();

  return (
    <div style={{
      background: "#f7f2fb", minHeight: "100vh",
      maxWidth: 450, margin: "0 auto", paddingBottom: 100,
    }}>

      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
        padding: "20px 16px 16px",
      }}>
        <h2 style={{ color: "#fff", fontWeight: 800, fontSize: 18, marginBottom: 4 }}>
          🏆 Leaderboard
        </h2>
        {tab === "weekly" && weekStart && (
          <p style={{ color: "#c4b5fd", fontSize: 12 }}>
            এই সপ্তাহ: {new Date(weekStart).toLocaleDateString("en-BD")} থেকে
          </p>
        )}

        {/* Weekly / All Time Tab */}
        <div style={{
          display: "flex", gap: 8, marginTop: 14,
          background: "rgba(255,255,255,0.15)", borderRadius: 12, padding: 4,
        }}>
          {[
            { id: "weekly",  label: "📅 এই সপ্তাহ" },
            { id: "alltime", label: "⭐ সর্বকালীন" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1, padding: "8px 0", borderRadius: 10, border: "none",
                background: tab === t.id ? "#fff" : "transparent",
                color: tab === t.id ? "#4f46e5" : "#fff",
                fontWeight: 700, fontSize: 13, cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category Select */}
      <div style={{
        display: "flex", gap: 8, padding: "14px 16px 0",
      }}>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            style={{
              flex: 1, padding: "10px 0", borderRadius: 12, border: "none",
              background: category === c.id ? c.color : "#fff",
              color: category === c.id ? "#fff" : "#374151",
              fontWeight: 700, fontSize: 12, cursor: "pointer",
              boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
              transition: "all 0.2s",
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Players List */}
      <div style={{ padding: "14px 16px 0" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>
            Loading...
          </div>
        ) : players.length === 0 ? (
          <div style={{
            textAlign: "center", padding: 40,
            background: "#fff", borderRadius: 16,
            color: "#9ca3af", fontSize: 14,
          }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🎮</div>
            এখনো কোনো data নেই
          </div>
        ) : (
          players.map((p, i) => {
            const s = rankStyle(i);
            return (
              <div
                key={p.userId}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  background: s.bg, border: `1px solid ${s.border}`,
                  borderRadius: 14, padding: "12px 14px", marginBottom: 10,
                  boxShadow: i < 3 ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
                }}
              >
                {/* Rank Badge */}
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: i < 3 ? s.border : "#e5e7eb",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 800, fontSize: i < 3 ? 18 : 13, color: s.color,
                  flexShrink: 0,
                }}>
                  {s.badge}
                </div>

                {/* Player Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#111" }}>
                    {p.inGameName || "—"}
                  </div>
                  <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
                    {p.totalMatches} match • {p.totalKills} kills
                  </div>
                </div>

                {/* Value */}
                <div style={{
                  fontWeight: 800, fontSize: 15, color: s.color,
                  textAlign: "right",
                }}>
                  {category === "byPrize" ? `৳${p[val.key]}` : `${p[val.key]}${val.suffix}`}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Leaderboard;