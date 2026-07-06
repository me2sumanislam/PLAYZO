 // routes/admin.js
// (Postgres/Supabase version — converted from Mongoose)
//
// আগের admin.js Mongoose models (User, Deposit, Withdraw, Match, ActivityLog,
// PaymentNumber) ব্যবহার করত। এখন সরাসরি `pg` দিয়ে Supabase Postgres এর সাথে
// কথা বলা হচ্ছে। schema-এর column নাম snake_case (users, deposits, withdraws,
// matches, match_participants, transactions, activity_logs, payment_numbers)।
//
// ⚠️ চালানোর আগে sql/2026-07-06-admin-migration.sql মাইগ্রেশনটা রান করুন —
// matches.results, users.register_ip/device_id/is_suspicious/suspicious_reason,
// transactions.note কলামগুলো এই ফাইলে দরকার।

const express  = require("express");
const router   = express.Router();
const bcrypt   = require("bcryptjs");
const jwt      = require("jsonwebtoken");
const { Pool } = require("pg");

// NOTE: utils/referralFraud.js নিজের একটা Pool বানায় (একই connectionString দিয়ে)।
// প্রোডাকশনে ভালো হয় একটা শেয়ার্ড db.js থেকে pool export করে সব জায়গায় reuse
// করা (কানেকশন লিমিট বাঁচাতে) — কিন্তু existing pattern এর সাথে সামঞ্জস্য রাখতে
// এখানেও নিজের pool বানানো হলো।
const pool = new Pool({ connectionString: process.env.SUPABASE_DB_URL });

// ✅ Gem Referral System — fraud detection helpers (Postgres ভার্সন)
const {
  isDuplicateTrx,
  findSameDeviceReferrals,
  isOverDailyGemCap,
} = require("../utils/referralFraud");

// ✅ Deposit amount অনুযায়ী কত gem পাবে
function calcGemTier(amount) {
  if (amount >= 100) return 10;
  if (amount >= 50) return 5;
  return 0;
}

const JWT_SECRET  = process.env.JWT_SECRET || "your_secret_key";
const ADMIN_ROLES = ["admin", "super-admin", "finance"];

// ─── Prize Logic Config ───────────────────────────────────────────────────────
// matchLogic:
//   "solo_kill"  → BR Solo: position prize + kill × perKill
//   "solo_pos"   → CS Solo / LW Solo: winner 1 জন → 100% prizePool
//   "team_only"  → BR Duo/Squad, CS Duo/Squad/6vs6, LW Duo:
//                  kill prize নেই, winner team সমান ভাগ

const CATEGORY_CONFIG = {
  br_solo:     { matchType: "solo", teamSize: 1, logic: "solo_kill",  killPrize: true  },
  br_duo:      { matchType: "team", teamSize: 2, logic: "team_only",  killPrize: false },
  br_squad:    { matchType: "team", teamSize: 4, logic: "team_only",  killPrize: false },
  cs_solo:     { matchType: "solo", teamSize: 1, logic: "solo_pos",   killPrize: false },
  cs_duo:      { matchType: "team", teamSize: 2, logic: "team_only",  killPrize: false },
  cs_squad:    { matchType: "team", teamSize: 4, logic: "team_only",  killPrize: false },
  cs_6vs6:     { matchType: "team", teamSize: 6, logic: "team_only",  killPrize: false },
  lw_solo:     { matchType: "solo", teamSize: 1, logic: "solo_pos",   killPrize: false },
  lw_duo:      { matchType: "team", teamSize: 2, logic: "team_only",  killPrize: false },
  // backward compat
  br_match:    { matchType: "solo", teamSize: 1, logic: "solo_kill",  killPrize: true  },
  br_survival: { matchType: "solo", teamSize: 1, logic: "solo_kill",  killPrize: true  },
  clash_squad: { matchType: "team", teamSize: 4, logic: "team_only",  killPrize: false },
  cs_2vs2:     { matchType: "team", teamSize: 2, logic: "team_only",  killPrize: false },
  lone_wolf:   { matchType: "solo", teamSize: 1, logic: "solo_pos",   killPrize: false },
  training:    { matchType: "solo", teamSize: 1, logic: "solo_kill",  killPrize: true  },
  free_match:  { matchType: "solo", teamSize: 1, logic: "solo_kill",  killPrize: true  },
};

// ✅ BR Solo default placement prizes
const BR_SOLO_DEFAULT_PRIZES = {
  first:  60,
  second: 40,
  third:  30,
  fourth: 20,
};

const authAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ success: false, message: "No token" });
    const decoded = jwt.verify(token, JWT_SECRET);

    const { rows } = await pool.query(
      `SELECT id, name, role FROM users WHERE id = $1`,
      [decoded.id]
    );
    const user = rows[0];
    if (!user || !ADMIN_ROLES.includes(user.role))
      return res.status(401).json({ success: false, message: "Admin not found" });

    req.admin = user;
    next();
  } catch {
    res.status(401).json({ success: false, message: "Invalid token" });
  }
};

const log = (adminName, action, target, type) =>
  pool
    .query(
      `INSERT INTO activity_logs (admin_name, action, target, type) VALUES ($1, $2, $3, $4)`,
      [adminName, action, target, type]
    )
    .catch(() => {});

// ── STATS ─────────────────────────────────────────────────────────────────────
router.get("/stats", authAdmin, async (req, res) => {
  try {
    const [
      totalDepositRes, totalWithdrawRes,
      pendingDepositAmountRes, pendingWithdrawAmountRes,
      pendingDepositCountRes, pendingWithdrawCountRes,
      totalUsersRes, totalMatchesRes,
    ] = await Promise.all([
      pool.query(`SELECT COALESCE(SUM(amount), 0) AS sum FROM deposits WHERE status = 'approved'`),
      pool.query(`SELECT COALESCE(SUM(amount), 0) AS sum FROM withdraws WHERE status = 'approved'`),
      pool.query(`SELECT COALESCE(SUM(amount), 0) AS sum FROM deposits WHERE status = 'pending'`),
      pool.query(`SELECT COALESCE(SUM(amount), 0) AS sum FROM withdraws WHERE status = 'pending'`),
      pool.query(`SELECT COUNT(*)::int AS count FROM deposits WHERE status = 'pending'`),
      pool.query(`SELECT COUNT(*)::int AS count FROM withdraws WHERE status = 'pending'`),
      pool.query(`SELECT COUNT(*)::int AS count FROM users`),
      pool.query(`SELECT COUNT(*)::int AS count FROM matches`),
    ]);

    res.json({
      success: true,
      data: {
        totalDeposit:          Number(totalDepositRes.rows[0].sum),
        totalWithdraw:         Number(totalWithdrawRes.rows[0].sum),
        pendingDepositAmount:  Number(pendingDepositAmountRes.rows[0].sum),
        pendingWithdrawAmount: Number(pendingWithdrawAmountRes.rows[0].sum),
        pendingDeposit:        pendingDepositCountRes.rows[0].count,
        pendingWithdraw:       pendingWithdrawCountRes.rows[0].count,
        totalUsers:            totalUsersRes.rows[0].count,
        totalMatches:          totalMatchesRes.rows[0].count,
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── DEPOSITS ──────────────────────────────────────────────────────────────────
router.get("/deposits", authAdmin, async (req, res) => {
  try {
    const { status, limit = 50 } = req.query;
    const params = [];
    let where = "";
    if (status && status !== "all") {
      params.push(status);
      where = `WHERE d.status = $${params.length}`;
    }
    params.push(Number(limit));

    const { rows } = await pool.query(
      `SELECT d.*, u.name AS user_name, u.phone AS user_phone
       FROM deposits d
       LEFT JOIN users u ON u.id = d.user_id
       ${where}
       ORDER BY d.created_at DESC
       LIMIT $${params.length}`,
      params
    );

    const mapped = rows.map((d) => ({
      ...d,
      user: { name: d.user_name, phone: d.user_phone },
    }));
    res.json({ success: true, data: mapped });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.put("/deposits/:id/approve", authAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows: depRows } = await client.query(
      `SELECT * FROM deposits WHERE id = $1 FOR UPDATE`,
      [req.params.id]
    );
    const dep = depRows[0];
    if (!dep) {
      await client.query("ROLLBACK");
      return res.json({ success: false, message: "Not found" });
    }
    if (dep.status !== "pending") {
      await client.query("ROLLBACK");
      return res.json({ success: false, message: "Already processed" });
    }

    // ✅ Fraud check: একই trxId আগে অন্য কোনো approved deposit এ ব্যবহার হয়েছে কিনা
    if (await isDuplicateTrx(dep.trx_id, dep.id, client)) {
      await client.query("ROLLBACK");
      return res.json({
        success: false,
        message: "⚠️ এই Transaction ID আগে অন্য একটি deposit এ ব্যবহার হয়েছে — reject করে user কে জানান",
      });
    }

    await client.query(
      `UPDATE deposits SET status = 'approved', approved_by = $1, updated_at = now() WHERE id = $2`,
      [req.admin.name, dep.id]
    );

    const { rows: userRows } = await client.query(
      `UPDATE users
       SET balance = balance + $1, total_deposit = total_deposit + $1, updated_at = now()
       WHERE id = $2
       RETURNING *`,
      [dep.amount, dep.user_id]
    );
    const depositedUser = userRows[0];

    // ✅ REFERRAL GEM LOGIC — deposit approve হলে gems_pending সেট হবে,
    // আসল gem credit হবে user যখন প্রথমবার match join করবে তখন (matchRoutes.js এ)
    const gemTier = calcGemTier(dep.amount);
    if (gemTier > 0 && depositedUser?.referred_by) {
      const { rows: refRows } = await client.query(
        `SELECT * FROM referral_history
         WHERE referrer_id = $1 AND referred_user_id = $2 AND deposited = false
         LIMIT 1`,
        [depositedUser.referred_by, depositedUser.id]
      );
      const refEntry = refRows[0];

      if (refEntry) {
        // ✅ Daily gem cap check — spam/fake referral আটকাতে (শুধু log করি, block করি না)
        if (await isOverDailyGemCap(depositedUser.referred_by, client)) {
          console.warn(
            `⚠️ [Gem Cap] referrer ${depositedUser.referred_by} আজকের daily gem cap ছুঁয়ে ফেলেছে — admin রিভিউ করুন`
          );
        }
        await client.query(
          `UPDATE referral_history
           SET deposited = true, deposit_amount = $1, gems_pending = $2
           WHERE id = $3`,
          [dep.amount, gemTier, refEntry.id]
        );
      }
    }

    await client.query("COMMIT");

    const { rows: nameRows } = await pool.query(`SELECT name FROM users WHERE id = $1`, [dep.user_id]);
    log(req.admin.name, `approved deposit of ৳${dep.amount}`, nameRows[0]?.name || "user", "approve");

    res.json({ success: true, message: "Deposit approved" });
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    res.status(500).json({ success: false, message: e.message });
  } finally {
    client.release();
  }
});

router.put("/deposits/:id/reject", authAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE deposits SET status = 'rejected', rejected_by = $1, updated_at = now()
       WHERE id = $2 RETURNING *`,
      [req.admin.name, req.params.id]
    );
    const dep = rows[0];
    if (!dep) return res.json({ success: false, message: "Not found" });

    const { rows: userRows } = await pool.query(`SELECT name FROM users WHERE id = $1`, [dep.user_id]);
    log(req.admin.name, `rejected deposit of ৳${dep.amount}`, userRows[0]?.name || "user", "reject");

    res.json({ success: true, message: "Deposit rejected" });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── WITHDRAWALS ───────────────────────────────────────────────────────────────
router.get("/withdraws", authAdmin, async (req, res) => {
  try {
    const { status, limit = 50 } = req.query;
    const params = [];
    let where = "";
    if (status && status !== "all") {
      params.push(status);
      where = `WHERE w.status = $${params.length}`;
    }
    params.push(Number(limit));

    const { rows } = await pool.query(
      `SELECT w.*, u.name AS user_name, u.phone AS user_phone
       FROM withdraws w
       LEFT JOIN users u ON u.id = w.user_id
       ${where}
       ORDER BY w.created_at DESC
       LIMIT $${params.length}`,
      params
    );

    const mapped = rows.map((w) => ({
      ...w,
      user: { name: w.user_name, phone: w.user_phone },
    }));
    res.json({ success: true, data: mapped });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.put("/withdraws/:id/approve", authAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows: witRows } = await client.query(
      `SELECT * FROM withdraws WHERE id = $1 FOR UPDATE`,
      [req.params.id]
    );
    const wit = witRows[0];
    if (!wit) {
      await client.query("ROLLBACK");
      return res.json({ success: false, message: "Not found" });
    }
    if (wit.status !== "pending") {
      await client.query("ROLLBACK");
      return res.json({ success: false, message: "Already processed" });
    }

    const { rows: userRows } = await client.query(
      `SELECT * FROM users WHERE id = $1 FOR UPDATE`,
      [wit.user_id]
    );
    const user = userRows[0];
    if (!user || Number(user.balance) < Number(wit.amount)) {
      await client.query("ROLLBACK");
      return res.json({ success: false, message: "Insufficient balance" });
    }

    await client.query(
      `UPDATE withdraws SET status = 'approved', approved_by = $1, updated_at = now() WHERE id = $2`,
      [req.admin.name, wit.id]
    );
    await client.query(
      `UPDATE users SET balance = balance - $1, total_withdraw = total_withdraw + $1, updated_at = now()
       WHERE id = $2`,
      [wit.amount, wit.user_id]
    );

    await client.query("COMMIT");

    log(req.admin.name, `approved withdraw of ৳${wit.amount}`, user.name, "approve");
    res.json({ success: true, message: "Withdraw approved & balance deducted" });
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    res.status(500).json({ success: false, message: e.message });
  } finally {
    client.release();
  }
});

router.put("/withdraws/:id/reject", authAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE withdraws SET status = 'rejected', rejected_by = $1, updated_at = now()
       WHERE id = $2 RETURNING *`,
      [req.admin.name, req.params.id]
    );
    const wit = rows[0];
    if (!wit) return res.json({ success: false, message: "Not found" });

    const { rows: userRows } = await pool.query(`SELECT name FROM users WHERE id = $1`, [wit.user_id]);
    log(req.admin.name, `rejected withdraw of ৳${wit.amount}`, userRows[0]?.name || "user", "reject");

    res.json({ success: true, message: "Withdraw rejected" });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── USERS ─────────────────────────────────────────────────────────────────────
router.get("/users", authAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, phone, balance, total_deposit, total_withdraw, is_blocked
       FROM users
       ORDER BY created_at DESC`
    );
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.put("/users/:id/ban", authAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE users SET is_blocked = true, updated_at = now() WHERE id = $1 RETURNING name`,
      [req.params.id]
    );
    if (!rows[0]) return res.json({ success: false, message: "Not found" });
    log(req.admin.name, "banned user", rows[0].name, "ban");
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.put("/users/:id/unban", authAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE users SET is_blocked = false, updated_at = now() WHERE id = $1 RETURNING name`,
      [req.params.id]
    );
    if (!rows[0]) return res.json({ success: false, message: "Not found" });
    log(req.admin.name, "unbanned user", rows[0].name, "ban");
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── PAYMENT NUMBERS ───────────────────────────────────────────────────────────
// NOTE: "limit" Postgres এ reserved keyword, তাই সবসময় quoted "limit" ব্যবহার করা হয়েছে।
router.get("/payment-numbers", authAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, method, number, "limit", active, created_at, updated_at
       FROM payment_numbers
       ORDER BY created_at DESC`
    );
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.post("/payment-numbers", authAdmin, async (req, res) => {
  try {
    const { method, number, limit, active } = req.body;
    if (!method || !number) return res.json({ success: false, message: "method ও number দিন" });

    const { rows } = await pool.query(
      `INSERT INTO payment_numbers (method, number, "limit", active)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [method, number, limit ?? null, active !== false]
    );
    log(req.admin.name, `added payment number ${number}`, method, "create");
    res.json({ success: true, data: rows[0] });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.put("/payment-numbers/:id", authAdmin, async (req, res) => {
  try {
    const allowed = ["method", "number", "limit", "active"];
    const fields = Object.keys(req.body).filter((k) => allowed.includes(k));
    if (fields.length === 0) return res.json({ success: false, message: "কোনো ফিল্ড দেওয়া হয়নি" });

    const setClauses = fields.map((f, i) => `"${f}" = $${i + 1}`);
    const values = fields.map((f) => req.body[f]);
    values.push(req.params.id);

    const { rows } = await pool.query(
      `UPDATE payment_numbers SET ${setClauses.join(", ")}, updated_at = now()
       WHERE id = $${values.length}
       RETURNING *`,
      values
    );
    if (!rows[0]) return res.json({ success: false, message: "Not found" });
    res.json({ success: true, data: rows[0] });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.delete("/payment-numbers/:id", authAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `DELETE FROM payment_numbers WHERE id = $1 RETURNING id`,
      [req.params.id]
    );
    if (!rows[0]) return res.json({ success: false, message: "Not found" });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── ACTIVITY LOG ──────────────────────────────────────────────────────────────
router.get("/logs", authAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 100`
    );
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── ADMIN MANAGEMENT ──────────────────────────────────────────────────────────
router.get("/admins", authAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, phone, role, created_at
       FROM users
       WHERE role = ANY($1)
       ORDER BY created_at DESC`,
      [ADMIN_ROLES]
    );
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.post("/admins/create", authAdmin, async (req, res) => {
  try {
    if (req.admin.role !== "super-admin")
      return res.json({ success: false, message: "Only super admin can create admins" });

    const { name, phone, password, role } = req.body;

    const { rows: existing } = await pool.query(`SELECT id FROM users WHERE phone = $1`, [phone]);
    if (existing[0]) return res.json({ success: false, message: "Phone already registered" });

    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (name, phone, password, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, phone, role`,
      [name, phone, hash, role]
    );

    log(req.admin.name, `created new admin ${name}`, phone, "create");
    res.json({ success: true, admin: rows[0] });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── COMPLETED MATCHES ─────────────────────────────────────────────────────────
router.get("/completed-matches", authAdmin, async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM matches WHERE status = 'completed' AND completed_at < now() - interval '30 days'`
    );
    const { rows } = await pool.query(
      `SELECT * FROM matches WHERE status = 'completed' ORDER BY completed_at DESC LIMIT 100`
    );
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── RESULT SUBMISSION / PRIZE DISTRIBUTION ────────────────────────────────────
router.put("/matches/:id/result", authAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { results, winnerUserIds, totalPrize } = req.body;

    const { rows: matchRows } = await client.query(
      `SELECT * FROM matches WHERE id = $1 FOR UPDATE`,
      [req.params.id]
    );
    const match = matchRows[0];
    if (!match) {
      await client.query("ROLLBACK");
      return res.json({ success: false, message: "Match not found" });
    }

    const cfg = CATEGORY_CONFIG[match.category] || CATEGORY_CONFIG.br_solo;

    // ══════════════════════════════════════════════════════════════════════
    // BR SOLO — Position Prize + Kill Prize
    // ══════════════════════════════════════════════════════════════════════
    if (cfg.logic === "solo_kill") {
      if (!results || results.length === 0) {
        await client.query("ROLLBACK");
        return res.json({ success: false, message: "results array required" });
      }

      const prizes = match.prizes || {};
      const p1 = prizes.first  || BR_SOLO_DEFAULT_PRIZES.first;
      const p2 = prizes.second || BR_SOLO_DEFAULT_PRIZES.second;
      const p3 = prizes.third  || BR_SOLO_DEFAULT_PRIZES.third;
      const p4 = prizes.fourth || BR_SOLO_DEFAULT_PRIZES.fourth;
      const kp = Number(match.per_kill) || 0;

      const finalResults = results.map((p) => {
        const pos         = Number(p.position) || 0;
        const kills       = Number(p.kills)    || 0;
        const killEarning = kills * kp;

        let placementPrize = 0;
        if      (pos === 1) placementPrize = p1;
        else if (pos === 2) placementPrize = p2;
        else if (pos === 3) placementPrize = p3;
        else if (pos === 4) placementPrize = p4;
        // ৫ম-৪৮তম: placement prize = 0, শুধু kill prize

        const prize = Math.floor(placementPrize + killEarning);

        return {
          userId:     p.userId,
          inGameName: p.inGameName || "",
          position:   pos,
          kills,
          killPrize:  Math.floor(killEarning),
          posPrize:   Math.floor(placementPrize),
          prize,
          rank:       pos,
        };
      });

      const totalDistributed = finalResults.reduce((s, p) => s + p.prize, 0);
      const prizePool        = Number(match.prize_pool) || Number(match.win_prize) || 0;
      const totalKillPrize   = finalResults.reduce((s, p) => s + p.killPrize, 0);
      const redAlert         = prizePool > 0 && totalDistributed > prizePool;

      if (redAlert) {
        console.warn(`🔴 RED ALERT: "${match.title}" — distributed ৳${totalDistributed} > pool ৳${prizePool}`);
      }

      await client.query(
        `UPDATE matches
         SET results = $1, status = 'completed', completed_at = now(),
             delete_at = now() + interval '30 days', updated_at = now()
         WHERE id = $2`,
        [JSON.stringify(finalResults), match.id]
      );

      for (const player of finalResults) {
        if (player.userId && player.prize > 0) {
          await client.query(
            `UPDATE users SET balance = balance + $1, updated_at = now() WHERE id = $2`,
            [player.prize, player.userId]
          );
          await client.query(
            `INSERT INTO transactions (user_id, type, amount, match_id, match_title, note)
             VALUES ($1, 'match_prize', $2, $3, $4, $5)`,
            [
              player.userId, player.prize, match.id, match.title,
              `Placement: ৳${player.posPrize} + Kills(${player.kills}×৳${kp}): ৳${player.killPrize}`,
            ]
          );
        }
      }

      await client.query("COMMIT");

      log(
        req.admin.name,
        `BR Solo Result — ${finalResults.length} players — ৳${totalDistributed} distributed${redAlert ? " 🔴 RED ALERT" : ""}`,
        match.title,
        "create"
      );

      return res.json({
        success:          true,
        message:          `✅ Result submitted! ৳${totalDistributed} distributed to ${finalResults.filter((p) => p.prize > 0).length} players.`,
        totalDistributed,
        totalKillPrize,
        redAlert,
        data: { ...match, results: finalResults, status: "completed" },
      });
    }

    // ══════════════════════════════════════════════════════════════════════
    // CS SOLO / LW SOLO — Winner 1 জন, 100% Prize Pool
    // ══════════════════════════════════════════════════════════════════════
    if (cfg.logic === "solo_pos") {
      if (!results || results.length === 0) {
        await client.query("ROLLBACK");
        return res.json({ success: false, message: "results array required" });
      }

      const prizes      = match.prizes || {};
      const winnerPrize = Number(match.prize_pool) || Number(match.win_prize) || Number(prizes.first) || 0;

      const finalResults = results.map((p) => {
        const pos      = Number(p.position) || 0;
        const isWinner = pos === 1;
        return {
          userId:     p.userId,
          inGameName: p.inGameName || "",
          position:   pos,
          kills:      0,
          killPrize:  0,
          posPrize:   isWinner ? winnerPrize : 0,
          prize:      isWinner ? Math.floor(winnerPrize) : 0,
          rank:       pos,
        };
      });

      const totalDistributed = finalResults.reduce((s, p) => s + p.prize, 0);

      await client.query(
        `UPDATE matches
         SET results = $1, status = 'completed', completed_at = now(),
             delete_at = now() + interval '30 days', updated_at = now()
         WHERE id = $2`,
        [JSON.stringify(finalResults), match.id]
      );

      for (const player of finalResults) {
        if (player.userId && player.prize > 0) {
          await client.query(
            `UPDATE users SET balance = balance + $1, updated_at = now() WHERE id = $2`,
            [player.prize, player.userId]
          );
          await client.query(
            `INSERT INTO transactions (user_id, type, amount, match_id, match_title)
             VALUES ($1, 'match_prize', $2, $3, $4)`,
            [player.userId, player.prize, match.id, match.title]
          );
        }
      }

      await client.query("COMMIT");

      log(req.admin.name, `Solo Result — ৳${totalDistributed} to winner`, match.title, "create");

      return res.json({
        success:          true,
        message:          `✅ Winner কে ৳${totalDistributed} prize দেওয়া হয়েছে।`,
        totalDistributed,
        data: { ...match, results: finalResults, status: "completed" },
      });
    }

    // ══════════════════════════════════════════════════════════════════════
    // TEAM ONLY — BR Duo/Squad, CS Duo/Squad/6vs6, LW Duo
    // Winner team সমান ভাগে prize পাবে, kill prize নেই
    // ══════════════════════════════════════════════════════════════════════
    if (cfg.logic === "team_only") {
      if (!winnerUserIds || winnerUserIds.length === 0) {
        await client.query("ROLLBACK");
        return res.json({ success: false, message: "কমপক্ষে ১ জন winner select করুন" });
      }

      const prize = Number(totalPrize) || 0;
      if (prize <= 0) {
        await client.query("ROLLBACK");
        return res.json({ success: false, message: "Prize amount দিন" });
      }

      // match.joinedUsers (Mongo subdocument array) এর বদলে এখন এটা আলাদা
      // match_participants টেবিল থেকে আসছে।
      const { rows: participants } = await client.query(
        `SELECT user_id, in_game_name, game_name FROM match_participants WHERE match_id = $1`,
        [match.id]
      );

      const winnerSet = new Set(winnerUserIds.map((id) => String(id)));
      const prizeEach = Math.floor(prize / winnerSet.size);

      const finalResults = participants.map((u) => {
        const uid      = String(u.user_id);
        const isWinner = winnerSet.has(uid);
        return {
          userId:     u.user_id,
          inGameName: u.in_game_name || u.game_name || "",
          position:   isWinner ? 1 : 0,
          kills:      0,
          killPrize:  0,
          posPrize:   isWinner ? prizeEach : 0,
          prize:      isWinner ? prizeEach : 0,
          rank:       isWinner ? 1 : 0,
        };
      });

      const totalDistributed = prizeEach * winnerSet.size;

      await client.query(
        `UPDATE matches
         SET results = $1, status = 'completed', completed_at = now(),
             delete_at = now() + interval '30 days', updated_at = now()
         WHERE id = $2`,
        [JSON.stringify(finalResults), match.id]
      );

      for (const player of finalResults) {
        if (player.prize > 0 && player.userId) {
          await client.query(
            `UPDATE users SET balance = balance + $1, updated_at = now() WHERE id = $2`,
            [player.prize, player.userId]
          );
          await client.query(
            `INSERT INTO transactions (user_id, type, amount, match_id, match_title)
             VALUES ($1, 'match_prize', $2, $3, $4)`,
            [player.userId, player.prize, match.id, match.title]
          );
        }
      }

      await client.query("COMMIT");

      log(
        req.admin.name,
        `Team Result — ${winnerSet.size} জন × ৳${prizeEach} = ৳${totalDistributed}`,
        match.title,
        "create"
      );

      return res.json({
        success:          true,
        message:          `✅ ${winnerSet.size} জন winner — প্রতিজন ৳${prizeEach} — মোট ৳${totalDistributed} distributed.`,
        totalDistributed,
        prizeEach,
        data: { ...match, results: finalResults, status: "completed" },
      });
    }

    await client.query("ROLLBACK");
    return res.json({ success: false, message: "Unknown match logic" });
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Result error:", e);
    res.status(500).json({ success: false, message: e.message });
  } finally {
    client.release();
  }
});

// ─── ADMIN: Referral Fraud Alerts ─────────────────────────────────
// একই IP/device থেকে referrer এর একাধিক referred user থাকলে flag করে দেখায়।
// এটা কাউকে ব্লক করে না, শুধু admin কে manual review এর জন্য তালিকা দেয়।
router.get("/referral-fraud-alerts", authAdmin, async (req, res) => {
  try {
    const { rows: referrers } = await pool.query(
      `SELECT id, name, phone, referral_count FROM users WHERE referral_count > 0`
    );

    const alerts = [];
    for (const ref of referrers) {
      const groups = await findSameDeviceReferrals(ref.id);
      if (groups.length > 0) {
        alerts.push({
          referrerId:       ref.id,
          referrerName:     ref.name,
          referrerPhone:    ref.phone,
          suspiciousGroups: groups,
        });
      }
    }

    // Sequential/pattern phone number দিয়ে খোলা account গুলোও আলাদা করে দেখান
    const { rows: suspiciousPhoneUsers } = await pool.query(
      `SELECT u.id, u.name, u.phone, u.register_ip, u.suspicious_reason, u.created_at,
              r.name AS referred_by_name, r.phone AS referred_by_phone
       FROM users u
       LEFT JOIN users r ON r.id = u.referred_by
       WHERE u.is_suspicious = true`
    );

    res.json({ success: true, data: { deviceAlerts: alerts, phonePatternAlerts: suspiciousPhoneUsers } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;