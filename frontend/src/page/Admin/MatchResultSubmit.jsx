 import React, { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';   // তোমার api ফাংশন
import { fmt } from '../../utils/helper'; // যদি থাকে

const MatchResultSubmit = () => {
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Prize Configuration
  const prizeConfig = {
    first: 60,
    second: 40,
    third: 20,
    perKill: 5,
  };

  const loadMatches = useCallback(() => {
    api("/matches")
      .then((d) => {
        const data = Array.isArray(d) ? d : d?.data || d?.matches || [];
        setMatches(data.filter(m => m.status === "live" || m.status === "upcoming"));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  const addPlayerResult = () => {
    setResults([...results, { 
      userId: '', 
      username: '', 
      position: '', 
      kills: 0 
    }]);
  };

  const handleResultChange = (index, field, value) => {
    const newResults = [...results];
    newResults[index][field] = value;
    setResults(newResults);
  };

  const removePlayer = (index) => {
    setResults(results.filter((_, i) => i !== index));
  };

  const calculatePrize = (position, kills) => {
    let prize = (kills || 0) * prizeConfig.perKill;
    
    if (position == 1) prize += prizeConfig.first;
    else if (position == 2) prize += prizeConfig.second;
    else if (position == 3) prize += prizeConfig.third;
    
    return Math.floor(prize);
  };

  const calculateAndSubmit = async () => {
    if (!selectedMatch) return alert("Please select a match");
    if (results.length === 0) return alert("At least one player add করুন");

    setLoading(true);
    setMessage("");

    try {
      const payload = {
        matchId: selectedMatch._id,
        results: results.map(r => ({
          ...r,
          prize: calculatePrize(r.position, r.kills)
        }))
      };

      const response = await api("/matches/result", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (response.success) {
        setMessage("✅ Result Submitted & Prize Distributed Successfully!");
        alert("সফলভাবে রেজাল্ট সাবমিট হয়েছে এবং টাকা ডিস্ট্রিবিউট হয়েছে!");
        setResults([]);
        setSelectedMatch(null);
        loadMatches(); // Refresh list
      } else {
        setMessage(response.message || "Failed to submit result");
      }
    } catch (err) {
      console.error(err);
      setMessage("Server Error occurred");
      alert("Error: " + (err.response?.data?.message || err.message));
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 20 }}>
        Match Result Submit & Prize Distribution
      </h1>

      {/* Match Selection */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>
          Select Match
        </label>
        <select
          onChange={(e) => {
            const match = matches.find(m => m._id === e.target.value);
            setSelectedMatch(match);
            setResults([]);
          }}
          style={{
            width: "100%",
            maxWidth: 500,
            padding: 14,
            borderRadius: 8,
            border: "1px solid #ccc",
            fontSize: 16
          }}
        >
          <option value="">-- Select Match --</option>
          {matches.map(m => (
            <option key={m._id} value={m._id}>
              {m.title} • {m.status} • {m.joinedPlayers || 0}/{m.totalPlayers}
            </option>
          ))}
        </select>
      </div>

      {selectedMatch && (
        <div style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 14,
          padding: 24,
          boxShadow: "0 2px 10px rgba(0,0,0,0.05)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2 style={{ fontSize: 20, fontWeight: 600 }}>
              {selectedMatch.title}
            </h2>
            <button
              onClick={addPlayerResult}
              style={{
                padding: "10px 20px",
                background: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: 8,
                cursor: "pointer"
              }}
            >
              + Add Player
            </button>
          </div>

          {results.map((res, index) => (
            <div key={index} style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 120px 100px 110px 60px",
              gap: 12,
              alignItems: "center",
              background: "#f9fafb",
              padding: 16,
              borderRadius: 10,
              marginBottom: 12
            }}>
              <input
                type="text"
                placeholder="Username"
                value={res.username}
                onChange={(e) => handleResultChange(index, 'username', e.target.value)}
                style={{ padding: 12, borderRadius: 6, border: "1px solid #ddd" }}
              />
              <input
                type="text"
                placeholder="User ID"
                value={res.userId}
                onChange={(e) => handleResultChange(index, 'userId', e.target.value)}
                style={{ padding: 12, borderRadius: 6, border: "1px solid #ddd" }}
              />
              <select
                value={res.position}
                onChange={(e) => handleResultChange(index, 'position', e.target.value)}
                style={{ padding: 12, borderRadius: 6, border: "1px solid #ddd" }}
              >
                <option value="">Position</option>
                <option value="1">1st</option>
                <option value="2">2nd</option>
                <option value="3">3rd</option>
                <option value="4">4th</option>
                <option value="5+">5+</option>
              </select>
              <input
                type="number"
                placeholder="Kills"
                value={res.kills}
                onChange={(e) => handleResultChange(index, 'kills', parseInt(e.target.value) || 0)}
                style={{ padding: 12, borderRadius: 6, border: "1px solid #ddd" }}
              />
              <div style={{ fontWeight: 700, fontSize: 18, color: "#16a34a" }}>
                ৳{calculatePrize(res.position, res.kills)}
              </div>
              <button
                onClick={() => removePlayer(index)}
                style={{ color: "red", fontWeight: 600 }}
              >
                ✕
              </button>
            </div>
          ))}

          <button
            onClick={calculateAndSubmit}
            disabled={loading || results.length === 0}
            style={{
              marginTop: 30,
              width: "100%",
              padding: 18,
              fontSize: 18,
              fontWeight: 600,
              background: loading ? "#9ca3af" : "#22c55e",
              color: "white",
              border: "none",
              borderRadius: 12,
              cursor: loading ? "not-allowed" : "pointer"
            }}
          >
            {loading ? "Submitting Result..." : "Submit Result & Distribute Prize"}
          </button>
        </div>
      )}

      {message && (
        <div style={{ marginTop: 20, padding: 16, background: "#dcfce7", color: "#166534", borderRadius: 8, fontWeight: 500 }}>
          {message}
        </div>
      )}
    </div>
  );
};

export default MatchResultSubmit;