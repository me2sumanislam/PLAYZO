 const express = require("express");
const router = express.Router();
const { Pool } = require("pg");
const supabaseAdmin = require("../utils/supabaseAdmin");
const supabase = require("../utils/supabaseClient");
const { protect } = require("../middleware/auth");

const pool = require("../utils/db");

function placeholderEmail(phone) {
  return `${phone}@placeholder.playzo`;
}

// GET balance
router.get("/balance", protect, async (req, res) => {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(`SELECT balance FROM users WHERE id = $1`, [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, balance: rows[0].balance });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

// GET my profile
router.get("/me", protect, async (req, res) => {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `SELECT id, name, in_game_name, email, phone, role, balance,
              total_matches_played, total_wins, referral_code,
              referral_points, referral_count, created_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, user: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

// UPDATE profile (name, email) — unique name check
router.put("/me", protect, async (req, res) => {
  const client = await pool.connect();
  try {
    const { name, email } = req.body;
    const userId = req.user.id;

    if (name && name.trim()) {
      const { rows: existingRows } = await client.query(
        `SELECT id FROM users WHERE name = $1 AND id <> $2`,
        [name.trim(), userId]
      );
      if (existingRows.length > 0) {
        return res.status(400).json({
          success: false,
          message: "এই নামটি ইতিমধ্যে ব্যবহৃত হচ্ছে, অন্য নাম দিন।",
        });
      }
    }

    const { rows } = await client.query(
      `UPDATE users SET name = $1, email = $2 WHERE id = $3
       RETURNING id, name, in_game_name, email, phone, role, balance`,
      [name?.trim(), email?.trim(), userId]
    );

    res.json({ success: true, user: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

// CHANGE password
// ⚠️ এখন users.password এ আর আসল hash নেই (Supabase Auth সামলায়),
// তাই পুরনো পাসওয়ার্ড ভেরিফাই করা হয় signInWithPassword দিয়ে (re-auth),
// তারপর supabaseAdmin দিয়ে নতুন পাসওয়ার্ড সেট করা হয়।
router.put("/change-password", protect, async (req, res) => {
  const client = await pool.connect();
  try {
    const { oldPassword, newPassword } = req.body;

    const { rows } = await client.query(
      `SELECT auth_user_id, phone FROM users WHERE id = $1`,
      [req.user.id]
    );
    const user = rows[0];
    if (!user || !user.auth_user_id) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // পুরনো পাসওয়ার্ড সঠিক কিনা যাচাই করা (re-auth)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: placeholderEmail(user.phone),
      password: oldPassword,
    });
    if (signInError) {
      return res.status(400).json({ success: false, message: "পুরনো পাসওয়ার্ড সঠিক নয়" });
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.auth_user_id,
      { password: newPassword }
    );
    if (updateError) {
      console.error("Change password error:", updateError);
      return res.status(500).json({ success: false, message: "পাসওয়ার্ড পরিবর্তন করতে সমস্যা হয়েছে" });
    }

    res.json({ success: true, message: "পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

// GET user by id (public)
router.get("/:id", async (req, res) => {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `SELECT id, name, in_game_name, email, phone, role, balance,
              total_matches_played, total_wins, referral_code, referral_count
       FROM users WHERE id = $1`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: "User পাওয়া যায়নি" });
    res.json({ success: true, ...rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

// ✅ UPDATE game name
router.put("/game-name", protect, async (req, res) => {
  const client = await pool.connect();
  try {
    const { inGameName } = req.body;
    if (!inGameName || !inGameName.trim()) {
      return res.status(400).json({ success: false, message: "Game name দিন" });
    }
    const { rows } = await client.query(
      `UPDATE users SET in_game_name = $1 WHERE id = $2
       RETURNING in_game_name, name, phone, balance`,
      [inGameName.trim(), req.user.id]
    );

    res.json({ success: true, message: "Game name সেভ হয়েছে!", user: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;