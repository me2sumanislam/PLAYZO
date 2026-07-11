 const express = require("express");
const router = express.Router();
const { Pool } = require("pg");
const supabase = require("../utils/supabaseClient");

const pool = require("../utils/db");
const ADMIN_ROLES = ["admin", "super-admin", "finance"];

function placeholderEmail(phone) {
  return `${phone}@placeholder.playzo`;
}

// ================= LOGIN =================
router.post("/login", async (req, res) => {
  const client = await pool.connect();
  try {
    const { phone, password } = req.body;

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: placeholderEmail(phone),
      password,
    });

    if (signInError) {
      return res.json({ success: false, message: "Wrong password or user not found" });
    }

    const { rows } = await client.query(
      `SELECT * FROM users WHERE auth_user_id = $1`,
      [signInData.user.id]
    );
    const user = rows[0];

    if (!user || !ADMIN_ROLES.includes(user.role)) {
      return res.json({ success: false, message: "Not an admin account" });
    }

    res.json({
      success: true,
      token: signInData.session.access_token,
      refreshToken: signInData.session.refresh_token, // ✅ নতুন
      expiresAt: signInData.session.expires_at,        // ✅ নতুন (unix timestamp, seconds)
      admin: {
        name: user.name,
        phone: user.phone,
        role: user.role,
        _id: user.id,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

// ================= REFRESH TOKEN ================= ✅ নতুন
router.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ success: false, message: "refreshToken missing" });
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data.session) {
      return res.status(401).json({ success: false, message: "Session expired, please login again" });
    }

    res.json({
      success: true,
      token: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;