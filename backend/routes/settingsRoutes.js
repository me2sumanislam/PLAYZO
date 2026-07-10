 // routes/settingsRoutes.js
const express = require("express");
const router  = express.Router();
const { Pool } = require("pg");
const { protect, adminOnly } = require("../middleware/auth");

const pool = new Pool({ connectionString: process.env.SUPABASE_DB_URL });

// GET সব settings — public (user app + admin panel দুটোই ব্যবহার করবে)
router.get("/", async (req, res) => {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(`SELECT key, value FROM app_settings`);
    const settings = {};
    rows.forEach((r) => { settings[r.key] = r.value; });
    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

// PUT single setting update — admin only
router.put("/:key", protect, adminOnly, async (req, res) => {
  const client = await pool.connect();
  try {
    const { key }   = req.params;
    const { value } = req.body;
    if (typeof value !== "boolean")
      return res.status(400).json({ success: false, message: "value boolean হতে হবে" });

    const { rows } = await client.query(
      `INSERT INTO app_settings (key, value, updated_at)
       VALUES ($1, $2, now())
       ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = now()
       RETURNING *`,
      [key, value]
    );
    res.json({ success: true, message: "Setting updated", data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;