 // routes/ludoMatchRoutes.js
// (Postgres/Supabase version — converted from Mongoose)
const express = require("express");
const router = express.Router();
const { Pool } = require("pg");
const { protect, adminOnly } = require("../middleware/auth");

const pool = new Pool({ connectionString: process.env.SUPABASE_DB_URL });

let sendMatchNotification = async () => {};
try {
  const notif = require("./notifications");
  if (typeof notif.sendMatchNotification === "function") {
    sendMatchNotification = notif.sendMatchNotification;
  }
} catch {}

const slotsForMode = (mode) => {
  if (mode === "1v1") return 2;
  if (mode === "2v2") return 4;
  if (mode === "4player") return 4;
  return 4;
};

function toTournamentJson(row) {
  if (!row) return row;
  return {
    id: row.id,
    _id: row.id,
    title: row.title,
    mode: row.mode,
    entryFee: row.entry_fee,
    winPrize: row.win_prize,
    totalSlots: row.total_slots,
    joinedPlayers: row.joined_players,
    roomCode: row.room_code,
    isRoomOpen: row.is_room_open,
    map: row.map,
    device: row.device,
    image: row.image,
    status: row.status,
    startTime: row.start_time,
    expiresAt: row.expires_at,
    winningTeam: row.winning_team,
    prizes: {
      first: row.prize_first,
      second: row.prize_second,
      third: row.prize_third,
      fourth: row.prize_fourth,
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ── Create Tournament ────────────────────────────────────────────────────────
router.post("/create", protect, adminOnly, async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      title, startTime, mode = "4player", entryFee = 0, winPrize = 0,
      map: mapName, device, image, prizes,
    } = req.body;

    const expiresAt = startTime
      ? new Date(new Date(startTime).getTime() + 20 * 60 * 1000)
      : new Date(Date.now() + 20 * 60 * 1000);
    const totalSlots = slotsForMode(mode);

    const { rows } = await client.query(
      `INSERT INTO ludo_tournaments (
        title, mode, entry_fee, win_prize, total_slots, joined_players,
        map, device, image, status, start_time, expires_at,
        prize_first, prize_second, prize_third, prize_fourth
      ) VALUES ($1,$2,$3,$4,$5,0,$6,$7,$8,'upcoming',$9,$10,$11,$12,$13,$14)
      RETURNING *`,
      [
        title, mode, entryFee, winPrize, totalSlots,
        mapName, device, image, startTime || null, expiresAt,
        prizes?.first || 0, prizes?.second || 0, prizes?.third || 0, prizes?.fourth || 0,
      ]
    );

    const match = rows[0];
    try { await sendMatchNotification(toTournamentJson(match), "ludo"); } catch {}

    res.status(201).json({ success: true, message: "Ludo tournament created", data: toTournamentJson(match) });
  } catch (err) {
    console.error("Create ludo tournament error:", err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

// ── Join with In-Game Name ───────────────────────────────────────────────────
router.put("/join/:id", protect, async (req, res) => {
  const client = await pool.connect();
  try {
    const { inGameName } = req.body;
    const userId = req.user.id; // ✅ token থেকে (body থেকে নয়, নিরাপত্তার জন্য)

    if (!inGameName || inGameName.trim() === "") {
      return res.json({ success: false, message: "In-Game Name দিতে হবে" });
    }

    await client.query("BEGIN");

    const { rows: matchRows } = await client.query(
      `SELECT * FROM ludo_tournaments WHERE id = $1 FOR UPDATE`,
      [req.params.id]
    );
    const match = matchRows[0];
    if (!match) {
      await client.query("ROLLBACK");
      return res.status(404).json({ success: false, message: "Match not found" });
    }

    if (match.status === "completed" || match.status === "cancelled") {
      await client.query("ROLLBACK");
      return res.json({ success: false, message: "Match আর join করা যাবে না" });
    }

    const { rows: alreadyRows } = await client.query(
      `SELECT id FROM ludo_participants WHERE tournament_id = $1 AND user_id = $2`,
      [match.id, userId]
    );
    if (alreadyRows.length > 0) {
      await client.query("ROLLBACK");
      return res.json({ success: false, message: "ইতোমধ্যে join করেছেন" });
    }

    if (match.joined_players >= match.total_slots) {
      await client.query("ROLLBACK");
      return res.json({ success: false, message: "Match ফুল হয়ে গেছে" });
    }

    const { rows: userRows } = await client.query(
      `SELECT * FROM users WHERE id = $1 FOR UPDATE`,
      [userId]
    );
    const user = userRows[0];
    if (!user) {
      await client.query("ROLLBACK");
      return res.status(404).json({ success: false, message: "User not found" });
    }
    if (Number(user.balance) < Number(match.entry_fee)) {
      await client.query("ROLLBACK");
      return res.json({ success: false, message: "পর্যাপ্ত balance নেই" });
    }

    const { rows: usedSlotRows } = await client.query(
      `SELECT slot_number FROM ludo_participants WHERE tournament_id = $1`,
      [match.id]
    );
    const usedSlots = usedSlotRows.map((r) => r.slot_number);
    let slot = 1;
    while (usedSlots.includes(slot)) slot++;

    await client.query(
      `UPDATE users SET balance = balance - $1 WHERE id = $2`,
      [match.entry_fee, userId]
    );

    await client.query(
      `INSERT INTO match_join_history (user_id, match_id, match_title, entry_fee)
       VALUES ($1,NULL,$2,$3)`,
      [userId, match.title, match.entry_fee]
    );
    // ⚠️ match_join_history.match_id শুধু `matches` টেবিলের সাথে FK link (ludo_tournaments না),
    // তাই এখানে NULL রেখে match_title দিয়ে বোঝানো হচ্ছে এটা কোন ludo ম্যাচ থেকে এসেছে

    await client.query(
      `INSERT INTO ludo_participants (tournament_id, user_id, slot_number, in_game_name)
       VALUES ($1,$2,$3,$4)`,
      [match.id, userId, slot, inGameName.trim()]
    );

    const newJoinedPlayers = match.joined_players + 1;
    const newStatus = newJoinedPlayers >= match.total_slots ? "live" : match.status;

    const { rows: updatedRows } = await client.query(
      `UPDATE ludo_tournaments SET joined_players = $1, status = $2 WHERE id = $3 RETURNING *`,
      [newJoinedPlayers, newStatus, match.id]
    );

    await client.query("COMMIT");

    const { rows: finalUserRows } = await client.query(`SELECT balance FROM users WHERE id = $1`, [userId]);

    res.json({
      success: true,
      message: "Join সফল! 🎉",
      newBalance: finalUserRows[0].balance,
      slotNumber: slot,
      data: toTournamentJson(updatedRows[0]),
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Ludo join error:", err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

 
// ── Get All Tournaments ───────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  const client = await pool.connect();
  try {
    const { mode, status } = req.query;
    const conditions = [];
    const params = [];
    if (mode) { params.push(mode); conditions.push(`mode = $${params.length}`); }
    if (status) { params.push(status); conditions.push(`status = $${params.length}`); }
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const { rows } = await client.query(
      `SELECT * FROM ludo_tournaments ${where} ORDER BY created_at DESC`,
      params
    );
    res.json({ success: true, data: rows.map(toTournamentJson) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

// ── Get Single Tournament ─────────────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  const client = await pool.connect();
  try {
    const { rows: matchRows } = await client.query(
      `SELECT * FROM ludo_tournaments WHERE id = $1`,
      [req.params.id]
    );
    const match = matchRows[0];
    if (!match) return res.status(404).json({ success: false, message: "Not found" });

    const { rows: participants } = await client.query(
      `SELECT lp.*, u.name, u.phone
       FROM ludo_participants lp
       JOIN users u ON u.id = lp.user_id
       WHERE lp.tournament_id = $1`,
      [match.id]
    );

    res.json({
      success: true,
      data: {
        ...toTournamentJson(match),
        joinedUsers: participants.map((p) => ({
          userId: { _id: p.user_id, name: p.name, phone: p.phone },
          slotNumber: p.slot_number,
          inGameName: p.in_game_name,
        })),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

// ── Update Room ──────────────────────────────────────────────────────────────
router.put("/update-room/:id", protect, adminOnly, async (req, res) => {
  const client = await pool.connect();
  try {
    const { roomCode } = req.body;
    const { rows } = await client.query(
      `UPDATE ludo_tournaments SET room_code = $1, status = 'live', is_room_open = true
       WHERE id = $2 RETURNING *`,
      [roomCode, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, message: "Room code updated, match is now LIVE", data: toTournamentJson(rows[0]) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

// ── Delete Tournament ─────────────────────────────────────────────────────────
router.delete("/:id", protect, adminOnly, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query(`DELETE FROM ludo_tournaments WHERE id = $1`, [req.params.id]);
    res.json({ success: true, message: "Match deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;