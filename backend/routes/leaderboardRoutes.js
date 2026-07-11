 // routes/leaderboardRoutes.js
// (Postgres/Supabase version — converted from Mongoose)
// আগে JS তে loop করে aggregate করা হতো, এখন সরাসরি SQL GROUP BY দিয়ে —
// দ্রুত এবং কম মেমরি লাগে (match_results টেবিল থেকে সরাসরি হিসাব)

const express = require("express");
const router  = express.Router();
const { Pool } = require("pg");

const pool = require("../utils/db");

// সপ্তাহের শুরু (সোমবার, লোকাল সময় অনুযায়ী) বের করার SQL এক্সপ্রেশন
// Postgres এ date_trunc('week', ...) সোমবার থেকেই সপ্তাহ শুরু ধরে (ISO 8601)
async function getLeaderboard(res, { weekOnly }) {
  const client = await pool.connect();
  try {
    const whereClause = weekOnly
      ? `WHERE m.status = 'completed' AND m.completed_at >= date_trunc('week', now())`
      : `WHERE m.status = 'completed'`;

    const { rows } = await client.query(
      `SELECT
         mr.user_id,
         MAX(mr.in_game_name)       AS in_game_name,
         SUM(mr.prize)::numeric     AS total_prize,
         SUM(mr.kills)::int         AS total_kills,
         COUNT(*)::int              AS total_matches
       FROM match_results mr
       JOIN matches m ON m.id = mr.match_id
       ${whereClause}
       AND mr.user_id IS NOT NULL
       GROUP BY mr.user_id`
    );

    const players = rows.map((r) => ({
      userId: r.user_id,
      inGameName: r.in_game_name || "—",
      totalPrize: Number(r.total_prize),
      totalKills: r.total_kills,
      totalMatches: r.total_matches,
    }));

    const byPrize   = [...players].sort((a, b) => b.totalPrize   - a.totalPrize).slice(0, 10);
    const byKills   = [...players].sort((a, b) => b.totalKills   - a.totalKills).slice(0, 10);
    const byMatches = [...players].sort((a, b) => b.totalMatches - a.totalMatches).slice(0, 10);

    const payload = { success: true, data: { byPrize, byKills, byMatches } };
    if (weekOnly) {
      const { rows: weekRows } = await client.query(`SELECT date_trunc('week', now()) AS week_start`);
      payload.weekStart = weekRows[0].week_start;
    }

    res.json(payload);
  } finally {
    client.release();
  }
}

// ═══════════════════════════════════════════
// WEEKLY LEADERBOARD
// ═══════════════════════════════════════════
router.get("/weekly", async (req, res) => {
  try {
    await getLeaderboard(res, { weekOnly: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ═══════════════════════════════════════════
// ALL TIME LEADERBOARD
// ═══════════════════════════════════════════
router.get("/alltime", async (req, res) => {
  try {
    await getLeaderboard(res, { weekOnly: false });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;