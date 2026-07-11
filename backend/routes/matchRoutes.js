 // routes/matchRoutes.js
const express = require("express");
const router  = express.Router();
const { Pool } = require("pg");
const { protect, adminOnly } = require("../middleware/auth");

const pool = require("../utils/db");

// notifications optional — না থাকলেও চলবে
let sendMatchNotification = async () => {};
try {
  const notif = require("./notifications");
  if (typeof notif.sendMatchNotification === "function") {
    sendMatchNotification = notif.sendMatchNotification;
  }
} catch {}

const MODE_CONFIG = {
  br_solo:      { matchType: "solo", teamSize: 1,  defaultTotal: 48 },
  br_survival:  { matchType: "solo", teamSize: 1,  defaultTotal: 48 },
  br_duo:       { matchType: "team", teamSize: 2,  defaultTotal: 48 },
  br_squad:     { matchType: "team", teamSize: 4,  defaultTotal: 48 },
  clash_squad:  { matchType: "team", teamSize: 4,  defaultTotal:  8 },
  cs_solo:      { matchType: "team", teamSize: 1,  defaultTotal:  2 },
  cs_duo:       { matchType: "team", teamSize: 2,  defaultTotal:  4 },
  cs_2vs2:      { matchType: "team", teamSize: 2,  defaultTotal:  4 },
  cs_squad:     { matchType: "team", teamSize: 4,  defaultTotal:  8 },
  cs_6vs6:      { matchType: "team", teamSize: 6,  defaultTotal: 12 },
  lw_solo:      { matchType: "team", teamSize: 1,  defaultTotal:  2 },
  lw_duo:       { matchType: "team", teamSize: 2,  defaultTotal:  4 },
  lone_wolf:    { matchType: "team", teamSize: 1,  defaultTotal:  2 },
  training:     { matchType: "solo", teamSize: 1,  defaultTotal: 48 },
  free_match:   { matchType: "solo", teamSize: 1,  defaultTotal: 48 },
};

// snake_case row → camelCase JSON (frontend পুরনো ফরম্যাট আশা করে)
function toMatchJson(row) {
  if (!row) return row;
  return {
    id: row.id,
    _id: row.id,
    title: row.title,
    category: row.category,
    matchType: row.match_type,
    teamSize: row.team_size,
    entryFee: row.entry_fee,
    winPrize: row.win_prize,
    prizes: row.prizes || {},
    perKill: row.per_kill,
    prizePool: row.prize_pool,
    map: row.map,
    device: row.device,
    image: row.image,
    startTime: row.start_time,
    expiresAt: row.expires_at,
    totalPlayers: row.total_players,
    joinedPlayers: row.joined_players,
    roomId: row.room_id,
    roomPassword: row.room_password,
    isRoomOpen: row.is_room_open,
    winnerTeam: row.winner_team,
    completedAt: row.completed_at,
    deleteAt: row.delete_at,
    status: row.status,
    gemEntryEnabled: row.gem_entry_enabled,
    gemEntryCost: row.gem_entry_cost,
    gemEntrySlots: row.gem_entry_slots,
    gemEntryUsed: row.gem_entry_used,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ── Test ──────────────────────────────────────────────────────────────────────
router.get("/test", (req, res) => res.json({ success: true, message: "Match Routes OK" }));

// ── Create Match ──────────────────────────────────────────────────────────────
router.post("/create", protect, adminOnly, async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      title, startTime, category = "br_solo", totalPlayers, prizePool,
      entryFee = 0, winPrize = 0, prizes, perKill = 0,
      map: mapName, device, image, roomId, roomPassword,
      gemEntryEnabled = false, gemEntryCost = 0, gemEntrySlots = 0,
    } = req.body;

    const cfg = MODE_CONFIG[category] || MODE_CONFIG.br_solo;
    const expiresAt = startTime
      ? new Date(new Date(startTime).getTime() + 20 * 60 * 1000)
      : new Date(Date.now() + 20 * 60 * 1000);

    if (gemEntryEnabled && (Number(gemEntryCost) <= 0 || Number(gemEntrySlots) <= 0)) {
      return res.status(400).json({
        success: false,
        message: "Gem Entry চালু করলে gemEntryCost ও gemEntrySlots অবশ্যই ০ এর বেশি হতে হবে",
      });
    }

    const { rows } = await client.query(
      `INSERT INTO matches (
        title, category, match_type, team_size, entry_fee, win_prize,
        prize_first, prize_second, prize_third, prize_fourth, prizes,
        per_kill, prize_pool, map, device, image, start_time, expires_at,
        total_players, room_id, room_password, joined_players, status,
        gem_entry_enabled, gem_entry_cost, gem_entry_slots, gem_entry_used
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,
        $19,$20,$21,0,'upcoming',$22,$23,$24,0
      ) RETURNING *`,
      [
        title, category, cfg.matchType, cfg.teamSize, entryFee, winPrize,
        prizes?.first || 0, prizes?.second || 0, prizes?.third || 0, prizes?.fourth || 0,
        prizes ? JSON.stringify(prizes) : null,
        perKill, prizePool || winPrize || 0, mapName, device, image,
        startTime || null, expiresAt,
        totalPlayers || cfg.defaultTotal, roomId || "", roomPassword || "",
        !!gemEntryEnabled, Number(gemEntryCost) || 0, Number(gemEntrySlots) || 0,
      ]
    );

    const match = rows[0];
    try { await sendMatchNotification(toMatchJson(match), category); } catch {}

    res.status(201).json({ success: true, message: "Match created", data: toMatchJson(match) });
  } catch (err) {
    console.error("Create match error:", err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

// ── Get All Matches ───────────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  const client = await pool.connect();
  try {
    const { rows: matches } = await client.query(
      `SELECT * FROM matches ORDER BY created_at DESC`
    );

    // প্রতিটা match এর জন্য joined participants আলাদা করে টেনে আনা (Mongoose populate এর সমতুল্য)
    const matchIds = matches.map((m) => m.id);
    let participantsByMatch = {};
    if (matchIds.length > 0) {
      const { rows: participants } = await client.query(
        `SELECT mp.*, u.name, u.phone
         FROM match_participants mp
         JOIN users u ON u.id = mp.user_id
         WHERE mp.match_id = ANY($1)`,
        [matchIds]
      );
      for (const p of participants) {
        if (!participantsByMatch[p.match_id]) participantsByMatch[p.match_id] = [];
        participantsByMatch[p.match_id].push({
          userId: { _id: p.user_id, name: p.name, phone: p.phone },
          inGameName: p.in_game_name,
          gameName: p.game_name,
          slotNumber: p.slot_number,
          team: p.team,
          joinedWithGem: p.joined_with_gem,
        });
      }
    }

    const data = matches.map((m) => ({
      ...toMatchJson(m),
      joinedUsers: participantsByMatch[m.id] || [],
    }));

    res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

// ── Get Completed Matches ─────────────────────────────────────────────────────
router.get("/completed", async (req, res) => {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `SELECT * FROM matches WHERE status = 'completed'
       ORDER BY completed_at DESC LIMIT 30`
    );
    res.json({ success: true, data: rows.map(toMatchJson) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

// ── My Matches ────────────────────────────────────────────────────────────────
router.get("/my-matches", async (req, res) => {
  const client = await pool.connect();
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ success: false, message: "userId required" });

    const { rows } = await client.query(
      `SELECT m.* FROM matches m
       JOIN match_participants mp ON mp.match_id = m.id
       WHERE mp.user_id = $1
       ORDER BY m.created_at DESC`,
      [userId]
    );
    res.json({ success: true, data: rows.map(toMatchJson) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

// ── Get Single Match ──────────────────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(`SELECT * FROM matches WHERE id = $1`, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: "Match not found" });
    res.json({ success: true, data: toMatchJson(rows[0]) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

// ── Update Room ───────────────────────────────────────────────────────────────
router.put("/update-room/:id", protect, adminOnly, async (req, res) => {
  const client = await pool.connect();
  try {
    const { roomId, roomPassword } = req.body;
    const { rows } = await client.query(
      `UPDATE matches SET room_id = $1, room_password = $2, status = 'live', is_room_open = true
       WHERE id = $3 RETURNING *`,
      [roomId, roomPassword, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: "Match not found" });
    res.json({ success: true, message: "Room updated", data: toMatchJson(rows[0]) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

// ── Join Match ────────────────────────────────────────────────────────────────
router.put("/join/:id", protect, async (req, res) => {
  const client = await pool.connect();
  try {
    const { inGameName, team = "A", useGem = false } = req.body;
    const userId = req.user.id; // ✅ token থেকে (body থেকে নয়, নিরাপত্তার জন্য)

    await client.query("BEGIN");

    const { rows: matchRows } = await client.query(
      `SELECT * FROM matches WHERE id = $1 FOR UPDATE`,
      [req.params.id]
    );
    const match = matchRows[0];
    if (!match) {
      await client.query("ROLLBACK");
      return res.status(404).json({ success: false, message: "Match not found" });
    }

    const { rows: alreadyRows } = await client.query(
      `SELECT id FROM match_participants WHERE match_id = $1 AND user_id = $2`,
      [match.id, userId]
    );
    if (alreadyRows.length > 0) {
      await client.query("ROLLBACK");
      return res.json({ success: false, message: "আপনি ইতোমধ্যে join করেছেন" });
    }

    if (match.joined_players >= match.total_players) {
      await client.query("ROLLBACK");
      return res.json({ success: false, message: "Match is full" });
    }

    if (match.match_type === "team" && match.team_size > 1) {
      const { rows: teamRows } = await client.query(
        `SELECT COUNT(*) FROM match_participants WHERE match_id = $1 AND team = $2`,
        [match.id, team]
      );
      if (Number(teamRows[0].count) >= match.team_size) {
        await client.query("ROLLBACK");
        return res.json({ success: false, message: `Team ${team} full!` });
      }
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

    const wantsGem = useGem === true || useGem === "true";
    let paidWithGem = false;

    if (wantsGem) {
      if (!match.gem_entry_enabled) {
        await client.query("ROLLBACK");
        return res.json({ success: false, message: "এই match এ Gem Entry চালু নেই" });
      }
      if (match.gem_entry_used >= match.gem_entry_slots) {
        await client.query("ROLLBACK");
        return res.json({ success: false, message: "Gem Entry এর সব স্লট পূর্ণ হয়ে গেছে" });
      }
      if ((user.gems_balance ?? user.referral_points ?? 0) < match.gem_entry_cost) {
        await client.query("ROLLBACK");
        return res.json({ success: false, message: `পর্যাপ্ত Gem নেই। প্রয়োজন ${match.gem_entry_cost} Gem` });
      }

      await client.query(
        `UPDATE users SET referral_points = referral_points - $1 WHERE id = $2`,
        [match.gem_entry_cost, userId]
      );
      await client.query(
        `UPDATE matches SET gem_entry_used = gem_entry_used + 1 WHERE id = $1`,
        [match.id]
      );
      paidWithGem = true;
    } else {
      if (Number(user.balance) < Number(match.entry_fee)) {
        await client.query("ROLLBACK");
        return res.json({ success: false, message: "পর্যাপ্ত balance নেই" });
      }
      await client.query(
        `UPDATE users SET balance = balance - $1 WHERE id = $2`,
        [match.entry_fee, userId]
      );
    }

    const { rows: usedSlotRows } = await client.query(
      `SELECT slot_number FROM match_participants WHERE match_id = $1`,
      [match.id]
    );
    const usedSlots = usedSlotRows.map((r) => r.slot_number);
    let slotNumber = 1;
    while (usedSlots.includes(slotNumber)) slotNumber++;

    await client.query(
      `INSERT INTO match_join_history (user_id, match_id, match_title, entry_fee, paid_with_gem)
       VALUES ($1,$2,$3,$4,$5)`,
      [userId, match.id, match.title, paidWithGem ? 0 : match.entry_fee, paidWithGem]
    );

    await client.query(
      `INSERT INTO match_participants (match_id, user_id, in_game_name, game_name, slot_number, team, joined_with_gem)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [match.id, userId, inGameName || "", inGameName || "", slotNumber,
       match.match_type === "team" ? team : "A", paidWithGem]
    );

    const { rows: updatedMatchRows } = await client.query(
      `UPDATE matches SET joined_players = joined_players + 1 WHERE id = $1 RETURNING *`,
      [match.id]
    );

    // ✅ Referral gem credit — B প্রথমবার match join করলে referrer A কে pending gem credit
    let newGems = user.referral_points || 0;
    if (user.referred_by) {
      const { rows: refRows } = await client.query(
        `SELECT * FROM referral_history
         WHERE referrer_id = $1 AND referred_user_id = $2
         FOR UPDATE`,
        [user.referred_by, userId]
      );
      const refEntry = refRows[0];
      if (refEntry && refEntry.deposited && !refEntry.gem_given && refEntry.gems_pending > 0) {
        await client.query(
          `UPDATE referral_history SET gem_given = true WHERE id = $1`,
          [refEntry.id]
        );
        await client.query(
          `UPDATE users SET referral_points = referral_points + $1 WHERE id = $2`,
          [refEntry.gems_pending, user.referred_by]
        );
      }
    }

    await client.query("COMMIT");

    const { rows: finalUserRows } = await client.query(
      `SELECT balance, referral_points FROM users WHERE id = $1`,
      [userId]
    );

    res.json({
      success: true,
      message: paidWithGem ? "Gem দিয়ে Join সফল!" : "Join সফল!",
      newBalance: finalUserRows[0].balance,
      newGems: finalUserRows[0].referral_points,
      paidWithGem,
      slotNumber,
      data: toMatchJson(updatedMatchRows[0]),
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Join match error:", err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

// ── Start Match (Live) ────────────────────────────────────────────────────────
router.put("/live/:id", protect, adminOnly, async (req, res) => {
  const client = await pool.connect();
  try {
    const { rows: matchRows } = await client.query(`SELECT status FROM matches WHERE id = $1`, [req.params.id]);
    const match = matchRows[0];
    if (!match) return res.status(404).json({ success: false, message: "Match not found" });
    if (match.status === "live") return res.status(400).json({ success: false, message: "Already live" });
    if (match.status === "completed") return res.status(400).json({ success: false, message: "Already completed" });

    const { rows } = await client.query(
      `UPDATE matches SET status = 'live' WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    res.json({ success: true, message: "Match started", match: toMatchJson(rows[0]) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

// ── Delete All ────────────────────────────────────────────────────────────────
router.delete("/clear-all", protect, adminOnly, async (req, res) => {
  const client = await pool.connect();
  try {
    const { rowCount } = await client.query(`DELETE FROM matches`);
    res.json({ success: true, message: `${rowCount} matches deleted` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;