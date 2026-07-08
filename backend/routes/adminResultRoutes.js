 // routes/adminResultRoutes.js
// (Postgres/Supabase version — converted from Mongoose)
const express = require("express");
const router = express.Router();
const { Pool } = require("pg");
const { protect, adminOnly } = require("../middleware/auth");
const { getSubmissionsByMatch } = require("../controllers/resultController");

const pool = new Pool({ connectionString: process.env.SUPABASE_DB_URL });

// Frontend: GET /api/results/admin/match/:matchId
router.get("/admin/match/:matchId", protect, adminOnly, getSubmissionsByMatch);

// Distribute route
router.put("/admin/distribute/:matchId", protect, adminOnly, async (req, res) => {
  const client = await pool.connect();
  try {
    const { winners } = req.body;
    if (!Array.isArray(winners) || winners.length === 0) {
      client.release();
      return res.status(400).json({ success: false, message: "কমপক্ষে ১ জন winner দিতে হবে" });
    }

    await client.query("BEGIN");

    const { rows: matchRows } = await client.query(
      `SELECT * FROM matches WHERE id = $1 FOR UPDATE`,
      [req.params.matchId]
    );
    const match = matchRows[0];
    if (!match) {
      await client.query("ROLLBACK");
      return res.status(404).json({ success: false, message: "Match পাওয়া যায়নি" });
    }
    if (match.status === "completed") {
      await client.query("ROLLBACK");
      return res.status(400).json({ success: false, message: "Result already submitted" });
    }
    if (match.prizes_distributed) {
      await client.query("ROLLBACK");
      return res.status(400).json({ success: false, message: "Prize already distributed" });
    }

    let totalDistributed = 0;
    const finalResults = [];

    for (let i = 0; i < winners.length; i++) {
      const winner = winners[i];
      const { rows: userRows } = await client.query(
        `SELECT * FROM users WHERE id = $1 FOR UPDATE`,
        [winner.userId]
      );
      const user = userRows[0];
      if (!user) continue;

      const prize = Number(winner.prize) || 0;
      if (prize <= 0) continue;

      totalDistributed += prize;

      await client.query(`SELECT adjust_user_balance($1, $2)`, [user.id, prize]);
      await client.query(
        `INSERT INTO transactions (user_id, type, amount, match_id, match_title)
         VALUES ($1,'match_prize',$2,$3,$4)`,
        [user.id, prize, match.id, match.title]
      );

      const inGameName = winner.inGameName || user.in_game_name || user.name || "Player";
      finalResults.push({
        userId: user.id,
        inGameName,
        prize,
        position: i + 1,
      });
    }

    // match_results টেবিলে ফলাফল সেভ করা (আগের row থাকলে মুছে নতুন করে)
    await client.query(`DELETE FROM match_results WHERE match_id = $1`, [match.id]);
    for (const r of finalResults) {
      await client.query(
        `INSERT INTO match_results (match_id, user_id, in_game_name, position, prize, rank)
         VALUES ($1,$2,$3,$4,$5,$4)`,
        [match.id, r.userId, r.inGameName, r.position, r.prize]
      );
    }

    await client.query(
      `UPDATE matches
       SET status = 'completed', completed_at = now(), prizes_distributed = true,
           delete_at = now() + interval '30 days'
       WHERE id = $1`,
      [match.id]
    );

    await client.query(
      `UPDATE result_submissions SET status = 'published', updated_at = now() WHERE match_id = $1`,
      [match.id]
    );

    await client.query("COMMIT");

    return res.json({
      success: true,
      message: `✅ ৳${totalDistributed} successfully distributed`,
      totalDistributed,
      winnersDistributed: finalResults.length,
      results: finalResults,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;