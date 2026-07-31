 // routes/announcementRoutes.js
const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/auth");
const pool = require("../utils/db");

// GET /api/announcement — public, app খোলার সময় modal দেখানোর জন্য user app এটা ব্যবহার করবে
router.get("/", async (req, res) => {
  // ✅ কোনো browser/proxy/CDN যাতে পুরনো response cache করে না রাখে
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");

  try {
    const { rows } = await pool.query(
      `SELECT * FROM announcements WHERE id = 1 LIMIT 1`
    );
    if (rows.length === 0) {
      return res.json({ success: true, data: null });
    }
    const a = rows[0];
    res.json({
      success: true,
      data: {
        id: a.id,
        title: a.title,
        body: a.body,
        active: a.active,
        updatedAt: a.updated_at,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/announcement — admin only, সবসময় একটাই row (id=1) upsert হয়
router.put("/", protect, adminOnly, async (req, res) => {
  try {
    const { title, body, active } = req.body;
    if (!body || !body.trim()) {
      return res.status(400).json({ success: false, message: "Announcement text দিন" });
    }
    const { rows } = await pool.query(
      `INSERT INTO announcements (id, title, body, active, updated_at)
       VALUES (1, $1, $2, $3, now())
       ON CONFLICT (id) DO UPDATE
         SET title = $1, body = $2, active = $3, updated_at = now()
       RETURNING *`,
      [title || "", body, active !== false]
    );
    const a = rows[0];
    res.json({
      success: true,
      data: {
        id: a.id,
        title: a.title,
        body: a.body,
        active: a.active,
        updatedAt: a.updated_at,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;