 const express = require("express");
const router  = express.Router();
const Match   = require("../models/Match");

// ═══════════════════════════════════════════
// HELPER — সপ্তাহের শুরু (সোমবার) বের করো
// ═══════════════════════════════════════════
const getWeekStart = () => {
  const now  = new Date();
  const day  = now.getDay(); // 0=Sun, 1=Mon...
  const diff = (day === 0 ? -6 : 1 - day); // সোমবার থেকে শুরু
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
};

// ═══════════════════════════════════════════
// WEEKLY LEADERBOARD
// ═══════════════════════════════════════════
router.get("/weekly", async (req, res) => {
  try {
    const weekStart = getWeekStart();

    // এই সপ্তাহের completed matches
    const matches = await Match.find({
      status:      "completed",
      completedAt: { $gte: weekStart },
    });

    const playerMap = {}; // userId → stats

    for (const match of matches) {
      for (const r of match.results || []) {
        const uid = r.userId?.toString();
        if (!uid) continue;

        if (!playerMap[uid]) {
          playerMap[uid] = {
            userId:     uid,
            inGameName: r.inGameName || "—",
            totalPrize: 0,
            totalKills: 0,
            totalMatches: 0,
          };
        }

        playerMap[uid].totalPrize   += r.prize  || 0;
        playerMap[uid].totalKills   += r.kills  || 0;
        playerMap[uid].totalMatches += 1;
      }
    }

    const players = Object.values(playerMap);

    // ৩টা আলাদা leaderboard
    const byPrize   = [...players].sort((a, b) => b.totalPrize   - a.totalPrize).slice(0, 10);
    const byKills   = [...players].sort((a, b) => b.totalKills   - a.totalKills).slice(0, 10);
    const byMatches = [...players].sort((a, b) => b.totalMatches - a.totalMatches).slice(0, 10);

    res.json({
      success: true,
      weekStart,
      data: { byPrize, byKills, byMatches },
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ═══════════════════════════════════════════
// ALL TIME LEADERBOARD
// ═══════════════════════════════════════════
router.get("/alltime", async (req, res) => {
  try {
    // সব completed matches
    const matches = await Match.find({ status: "completed" });

    const playerMap = {};

    for (const match of matches) {
      for (const r of match.results || []) {
        const uid = r.userId?.toString();
        if (!uid) continue;

        if (!playerMap[uid]) {
          playerMap[uid] = {
            userId:       uid,
            inGameName:   r.inGameName || "—",
            totalPrize:   0,
            totalKills:   0,
            totalMatches: 0,
          };
        }

        playerMap[uid].totalPrize   += r.prize  || 0;
        playerMap[uid].totalKills   += r.kills  || 0;
        playerMap[uid].totalMatches += 1;
      }
    }

    const players = Object.values(playerMap);

    const byPrize   = [...players].sort((a, b) => b.totalPrize   - a.totalPrize).slice(0, 10);
    const byKills   = [...players].sort((a, b) => b.totalKills   - a.totalKills).slice(0, 10);
    const byMatches = [...players].sort((a, b) => b.totalMatches - a.totalMatches).slice(0, 10);

    res.json({
      success: true,
      data: { byPrize, byKills, byMatches },
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;