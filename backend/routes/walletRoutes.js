 // routes/walletRoutes.js
// (Postgres/Supabase version — converted from Mongoose)
//
// ⚠️ নিরাপত্তা ফিক্স: আগের ভার্সনে কোনো auth middleware ছিল না — যে কেউ
// (login ছাড়াই) deposit approve/reject করতে পারত বা অন্য কারো referral info
// দেখতে পারত। এখন protect/adminOnly যোগ করা হয়েছে।

const express = require("express");
const router  = express.Router();
const { Pool } = require("pg");
const { protect, adminOnly } = require("../middleware/auth");
const { isDuplicateTrx } = require("../utils/referralFraud");

const pool = new Pool({ connectionString: process.env.SUPABASE_DB_URL });

// ── Referral / Gem Constants ────────────────────────────────────
const REFERRAL_DEPOSIT_MIN = 50; // B কে ন্যূনতম ৳৫০ deposit করতে হবে referral qualify করতে

function calcGemTier(amount) {
  if (amount >= 100) return 10;
  if (amount >= REFERRAL_DEPOSIT_MIN) return 5;
  return 0;
}

function toDepositJson(row) {
  if (!row) return row;
  return {
    _id: row.id,
    id: row.id,
    method: row.method,
    amount: row.amount,
    trxId: row.trx_id,
    paymentNumber: row.payment_number,
    userId: row.user_id,
    status: row.status,
    approvedBy: row.approved_by,
    rejectedBy: row.rejected_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ─── USER: Deposit Request Submit ────────────────────────────────
router.post("/deposit", protect, async (req, res) => {
  try {
    const { method, amount, trxId, paymentNumber } = req.body;
    const userId = req.user.id; // ✅ token থেকে (body থেকে নয়, নিরাপত্তার জন্য)

    if (!method || !amount || !trxId) {
      return res.status(400).json({
        success: false,
        message: "method, amount এবং trxId দিন",
      });
    }

    const { rows } = await pool.query(
      `INSERT INTO deposits (method, amount, trx_id, payment_number, user_id, status)
       VALUES ($1,$2,$3,$4,$5,'pending')
       RETURNING *`,
      [method, Number(amount), trxId, paymentNumber || null, userId]
    );

    res.json({ success: true, deposit: toDepositJson(rows[0]) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── ADMIN: All Deposits ──────────────────────────────────────────
router.get("/deposits", protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.query;
    const params = [];
    let where = "";
    if (status && status !== "all") {
      params.push(status);
      where = `WHERE d.status = $${params.length}`;
    }

    const { rows } = await pool.query(
      `SELECT d.*, u.name AS user_name, u.phone AS user_phone
       FROM deposits d
       LEFT JOIN users u ON u.id = d.user_id
       ${where}
       ORDER BY d.created_at DESC`,
      params
    );

    const mapped = rows.map((d) => ({
      ...toDepositJson(d),
      userId: d.user_id ? { _id: d.user_id, name: d.user_name, phone: d.user_phone } : null,
    }));

    res.json(mapped);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── ADMIN: Approve / Reject Deposit ─────────────────────────────
router.patch("/deposit/:id", protect, adminOnly, async (req, res) => {
  const client = await pool.connect();
  try {
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      client.release();
      return res.status(400).json({
        success: false,
        message: "status হবে 'approved' অথবা 'rejected'",
      });
    }

    await client.query("BEGIN");

    const { rows: depRows } = await client.query(
      `SELECT * FROM deposits WHERE id = $1 FOR UPDATE`,
      [req.params.id]
    );
    const deposit = depRows[0];
    if (!deposit) {
      await client.query("ROLLBACK");
      return res.status(404).json({ success: false, message: "Deposit পাওয়া যায়নি" });
    }
    if (deposit.status !== "pending") {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "এই request আগেই process হয়ে গেছে",
      });
    }

    // ✅ Fraud check: একই trxId আগে অন্য কোনো approved deposit এ ব্যবহার হয়েছে কিনা
    if (status === "approved" && (await isDuplicateTrx(deposit.trx_id, deposit.id, client))) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "⚠️ এই Transaction ID আগে অন্য একটি deposit এ ব্যবহার হয়েছে — manually verify করুন",
      });
    }

    const { rows: updatedDepRows } = await client.query(
      `UPDATE deposits SET status = $1, updated_at = now() WHERE id = $2 RETURNING *`,
      [status, deposit.id]
    );
    const updatedDeposit = updatedDepRows[0];

    if (status === "approved" && deposit.user_id) {
      // ── User এর balance বাড়াও ──
      const { rows: userRows } = await client.query(
        `UPDATE users SET balance = balance + $1, total_deposit = total_deposit + $1
         WHERE id = $2 RETURNING *`,
        [deposit.amount, deposit.user_id]
      );
      const user = userRows[0];

      // ✅ REFERRAL GEM LOGIC — Step 1: deposit হয়েছে, gems_pending set করো
      // Gem এখনই credit হবে না — user যখন প্রথমবার match join করবে তখন credit হবে
      const gemTier = calcGemTier(deposit.amount);
      if (gemTier > 0 && user.referred_by) {
        const { rows: refRows } = await client.query(
          `SELECT * FROM referral_history
           WHERE referrer_id = $1 AND referred_user_id = $2 AND deposited = false
           LIMIT 1`,
          [user.referred_by, user.id]
        );
        const refEntry = refRows[0];

        if (refEntry) {
          await client.query(
            `UPDATE referral_history
             SET deposited = true, deposit_amount = $1, gems_pending = $2
             WHERE id = $3`,
            [deposit.amount, gemTier, refEntry.id]
          );
          console.log(
            `💰 [Referral] ${user.name} ৳${deposit.amount} deposit করেছে → ${gemTier} gem pending (match join এর অপেক্ষায়)`
          );
        }
      }

      await client.query("COMMIT");

      return res.json({
        success: true,
        message: `✅ Approved! ৳${deposit.amount} user এর balance এ যোগ হয়েছে`,
        deposit: toDepositJson(updatedDeposit),
        newBalance: user?.balance,
      });
    }

    await client.query("COMMIT");

    res.json({
      success: true,
      message: status === "approved" ? "✅ Approved!" : "❌ Rejected",
      deposit: toDepositJson(updatedDeposit),
    });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

// ─── REFERRAL INFO ────────────────────────────────────────────────
router.get("/referral/:userId", protect, async (req, res) => {
  try {
    const { rows: userRows } = await pool.query(
      `SELECT id, referral_code, referral_points, referral_count
       FROM users WHERE id = $1`,
      [req.params.userId]
    );
    const user = userRows[0];
    if (!user) {
      return res.status(404).json({ success: false, message: "User পাওয়া যায়নি" });
    }

    const { rows: history } = await pool.query(
      `SELECT rh.*, u.name AS referred_name, u.phone AS referred_phone
       FROM referral_history rh
       LEFT JOIN users u ON u.id = rh.referred_user_id
       WHERE rh.referrer_id = $1
       ORDER BY rh.joined_at DESC`,
      [req.params.userId]
    );

    res.json({
      success: true,
      data: {
        referralCode: user.referral_code,
        gems: user.referral_points || 0,
        referralCount: user.referral_count,
        referralHistory: history.map((h) => ({
          userId: { _id: h.referred_user_id, name: h.referred_name, phone: h.referred_phone },
          name: h.name,
          phone: h.phone,
          deposited: h.deposited,
          depositAmount: h.deposit_amount,
          gemsPending: h.gems_pending,
          gemGiven: h.gem_given,
          joinedAt: h.joined_at,
        })),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ⚠️ NOTE: "/referral/convert" route ইচ্ছাকৃতভাবে বাদ দেওয়া হয়েছে।
// Gem কখনো taka তে convert করা যাবে না — এটাই system এর মূল নিয়ম।

module.exports = router;