 // page/MatchJoin/MatchJoin.jsx
import React, { useState } from 'react';

// Mode config — match type অনুযায়ী team select দেখাবে
const TEAM_MODES = ["br_duo", "br_squad", "clash_squad", "cs_2vs2", "tdm_6v6"];

const MODE_LABEL = {
  br_solo:      "BR Solo",
  br_survival:  "BR Survival",
  br_duo:       "BR Duo (2vs2)",
  br_squad:     "BR Squad (4vs4)",
  clash_squad:  "Clash Squad (4vs4)",
  cs_2vs2:      "CS 2vs2",
  lone_wolf:    "Lone Wolf (1vs1)",
  tdm_6v6:      "TDM 6vs6",
  training:     "Training Match",
  br_match:     "BR Match",
};

const MatchJoin = ({ match, onBack, onConfirmJoin }) => {
  const [formData, setFormData] = useState({
    userName: '',
    gameId:   '',
    team:     'A',
  });

  if (!match) return null;

  const isTeamMode = TEAM_MODES.includes(match.category) || match.matchType === "team";
  const needsTeam  = isTeamMode && (match.teamSize || 1) > 1;

  // Team A ও Team B তে কতজন আছে
  const teamACnt = (match.joinedUsers || []).filter((u) => (u.team || "A") === "A").length;
  const teamBCnt = (match.joinedUsers || []).filter((u) => (u.team || "A") === "B").length;
  const tSize    = match.teamSize || 2;
  const teamAFull = teamACnt >= tSize;
  const teamBFull = teamBCnt >= tSize;

  const handleJoin = () => {
    if (!formData.userName.trim()) {
      alert("Game Name দিন");
      return;
    }
    if (needsTeam && !formData.team) {
      alert("Team select করুন");
      return;
    }
    if (needsTeam && formData.team === "A" && teamAFull) {
      alert("Team A full! Team B select করুন।");
      return;
    }
    if (needsTeam && formData.team === "B" && teamBFull) {
      alert("Team B full! Team A select করুন।");
      return;
    }
    onConfirmJoin(formData);
  };

  const inp = {
    width: "100%",
    padding: "12px 14px",
    border: "1.5px solid #e5e7eb",
    borderRadius: 10,
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    background: "#f9fafb",
  };

  return (
    <div style={{ background: "#fcfaff", minHeight: "100vh", maxWidth: 450, margin: "0 auto", fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)", padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <button onClick={onBack} style={{ background: "rgba(255,255,255,0.25)", border: "none", borderRadius: "50%", width: 32, height: 32, color: "#fff", fontSize: 16, cursor: "pointer", marginRight: 10 }}>❮</button>
          <span style={{ color: "#fff", fontWeight: 800, fontSize: 16 }}>🎮 Match Join করুন</span>
        </div>
      </div>

      <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Match Info */}
        <div style={{ background: "#fff", borderRadius: 12, padding: 14, border: "1px solid #e5e7eb" }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#111827", marginBottom: 4 }}>{match.title}</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
            <span style={{ background: "#dcfce7", color: "#166534", fontSize: 11, padding: "2px 8px", borderRadius: 20, fontWeight: 600 }}>
              {MODE_LABEL[match.category] || match.category}
            </span>
            {needsTeam && (
              <span style={{ background: "#dbeafe", color: "#1e40af", fontSize: 11, padding: "2px 8px", borderRadius: 20, fontWeight: 600 }}>
                Team Match
              </span>
            )}
            <span style={{ background: "#fef3c7", color: "#92400e", fontSize: 11, padding: "2px 8px", borderRadius: 20, fontWeight: 600 }}>
              Entry: ৳{match.entryFee}
            </span>
          </div>
        </div>

        {/* Game Name */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>
            Free Fire Username (In-Game Name) *
          </label>
          <input
            type="text"
            placeholder="আপনার in-game username লিখুন"
            value={formData.userName}
            onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
            style={inp}
          />
        </div>

        {/* Team Select — শুধু team mode এ এবং teamSize > 1 হলে */}
        {needsTeam && (
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8 }}>
              Team Select করুন *
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {["A", "B"].map((team) => {
                const cnt  = team === "A" ? teamACnt : teamBCnt;
                const full = team === "A" ? teamAFull : teamBFull;
                const sel  = formData.team === team;
                return (
                  <button
                    key={team}
                    onClick={() => !full && setFormData({ ...formData, team })}
                    disabled={full}
                    style={{
                      padding: "14px 0",
                      borderRadius: 10,
                      border: `2px solid ${sel ? "#22c55e" : full ? "#f3f4f6" : "#e5e7eb"}`,
                      background: sel ? "#f0fdf4" : full ? "#f9fafb" : "#fff",
                      color: sel ? "#16a34a" : full ? "#9ca3af" : "#374151",
                      fontWeight: 700,
                      fontSize: 15,
                      cursor: full ? "not-allowed" : "pointer",
                      textAlign: "center",
                    }}
                  >
                    Team {team}
                    <div style={{ fontSize: 11, fontWeight: 400, marginTop: 3 }}>
                      {cnt}/{tSize} joined {full ? "— FULL" : ""}
                    </div>
                    {sel && <div style={{ fontSize: 12, color: "#16a34a", marginTop: 2 }}>✅ Selected</div>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Entry Fee Warning */}
        <div style={{ background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#92400e", textAlign: "center", fontWeight: 600 }}>
          ৳{match.entryFee} আপনার wallet থেকে কাটা হবে
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <button
            onClick={onBack}
            style={{ flex: 1, padding: "12px 0", border: "1.5px solid #e5e7eb", borderRadius: 10, background: "#fff", color: "#374151", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
          >
            বাতিল
          </button>
          <button
            onClick={handleJoin}
            disabled={!formData.userName.trim() || (needsTeam && (formData.team === "A" && teamAFull) || (formData.team === "B" && teamBFull))}
            style={{
              flex: 2,
              padding: "12px 0",
              border: "none",
              borderRadius: 10,
              background: formData.userName.trim() ? "#22c55e" : "#86efac",
              color: "#fff",
              fontWeight: 700,
              fontSize: 14,
              cursor: formData.userName.trim() ? "pointer" : "not-allowed",
            }}
          >
            ✅ Confirm Join
          </button>
        </div>
      </div>
    </div>
  );
};

export default MatchJoin;