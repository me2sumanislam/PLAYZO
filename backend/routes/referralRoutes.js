 // routes/referralRoutes.js
// (Postgres/Supabase version — converted from Mongoose)
//
// ⚠️ IMPORTANT: এই router এ আগে "/convert" route ছিল (points → balance)।
// নতুন Gem system এ gem কখনো taka তে convert হয় না, তাই এই route পুরোপুরি সরানো হয়েছে।

const express = require("express");
const router = express.Router();
const { Pool } = require("pg");
const { protect } = require("../middleware/auth");

const pool = new Pool({ connectionString: process.env.SUPABASE_DB_URL });

// GET /api/referral/:userId
router.get("/:userId", protect, async (req, res) => {
  try {
    const { rows: userRows } = await pool.query(
      `SELECT referral_code, referral_points, referral_count
       FROM users WHERE id = $1`,
      [req.params.userId]
    );
    const user = userRows[0];
    if (!user) return res.json({ success: false, message: "User not found" });

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
        referralCount: user.referral_count || 0,
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

module.exports = router;