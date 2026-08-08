 // routes/homeHighlightsRoutes.js
// হোমপেজের "চলমান টুর্নামেন্ট" সেকশনে দেখানো হবে এমন কার্ড:
//   - notice        → admin এর নোটিশ
//   - announcement   → ঘোষণা
//   - top_player     → সেরা প্লেয়ারের ছবি + kills/matches
// admin panel থেকে এই তিন ধরনের কার্ডই এখান থেকে manage হবে।

const express = require("express");
const router = express.Router();
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const multer = require("multer");

const { protect, adminOnly } = require("../middleware/auth");
const pool = require("../utils/db");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"), false);
  },
});

const uploadBufferToCloudinary = (buffer, folder = "playzo_home_highlights") =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });

function toJson(row) {
  if (!row) return row;
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    imageUrl: row.image_url,
    kills: row.kills,
    matches: row.matches,
    badgeText: row.badge_text,
    displayOrder: row.display_order,
    active: row.active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ═══════════════════════════════════════════════════════
// GET /api/home-highlights — public, শুধু active কার্ড, homepage এর জন্য
// ═══════════════════════════════════════════════════════
router.get("/", async (req, res) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate");
  try {
    const { rows } = await pool.query(
      `SELECT * FROM home_highlights
       WHERE active = true
       ORDER BY display_order ASC, created_at DESC`
    );
    res.json({ success: true, data: rows.map(toJson) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ═══════════════════════════════════════════════════════
// GET /api/home-highlights/all — admin only, active+inactive সব, manage page এর জন্য
// ═══════════════════════════════════════════════════════
router.get("/all", protect, adminOnly, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM home_highlights ORDER BY display_order ASC, created_at DESC`
    );
    res.json({ success: true, data: rows.map(toJson) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ═══════════════════════════════════════════════════════
// POST /api/home-highlights — admin only, নতুন কার্ড তৈরি
// FormData: type, title, body, kills, matches, badgeText, displayOrder, active, image(file, ঐচ্ছিক)
// ═══════════════════════════════════════════════════════
router.post("/", protect, adminOnly, upload.single("image"), async (req, res) => {
  try {
    const { type, title, body, kills, matches, badgeText, displayOrder, active } = req.body;

    if (!["notice", "announcement", "top_player"].includes(type)) {
      return res.status(400).json({ success: false, message: "সঠিক type দিন (notice/announcement/top_player)" });
    }

    let imageUrl = null;
    let imagePublicId = null;
    if (req.file) {
      const uploadResult = await uploadBufferToCloudinary(req.file.buffer);
      imageUrl = uploadResult.secure_url;
      imagePublicId = uploadResult.public_id;
    }

    const { rows } = await pool.query(
      `INSERT INTO home_highlights
        (type, title, body, image_url, image_public_id, kills, matches, badge_text, display_order, active, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, now())
       RETURNING *`,
      [
        type,
        title || "",
        body || "",
        imageUrl,
        imagePublicId,
        kills ? Number(kills) : null,
        matches ? Number(matches) : null,
        badgeText || null,
        displayOrder ? Number(displayOrder) : 0,
        active !== "false" && active !== false,
      ]
    );

    res.status(201).json({ success: true, message: "কার্ড তৈরি হয়েছে", data: toJson(rows[0]) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ═══════════════════════════════════════════════════════
// PUT /api/home-highlights/:id — admin only, কার্ড আপডেট (নতুন ছবি দিলে পুরনোটা cloudinary থেকে মুছে দেয়)
// ═══════════════════════════════════════════════════════
router.put("/:id", protect, adminOnly, upload.single("image"), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, body, kills, matches, badgeText, displayOrder, active } = req.body;

    const { rows: existingRows } = await pool.query(`SELECT * FROM home_highlights WHERE id = $1`, [id]);
    const existing = existingRows[0];
    if (!existing) {
      return res.status(404).json({ success: false, message: "কার্ড পাওয়া যায়নি" });
    }

    let imageUrl = existing.image_url;
    let imagePublicId = existing.image_public_id;

    if (req.file) {
      const uploadResult = await uploadBufferToCloudinary(req.file.buffer);
      if (existing.image_public_id) {
        try { await cloudinary.uploader.destroy(existing.image_public_id); } catch (e) {}
      }
      imageUrl = uploadResult.secure_url;
      imagePublicId = uploadResult.public_id;
    }

    const { rows } = await pool.query(
      `UPDATE home_highlights SET
         title = $1, body = $2, image_url = $3, image_public_id = $4,
         kills = $5, matches = $6, badge_text = $7, display_order = $8,
         active = $9, updated_at = now()
       WHERE id = $10
       RETURNING *`,
      [
        title ?? existing.title,
        body ?? existing.body,
        imageUrl,
        imagePublicId,
        kills !== undefined ? (kills ? Number(kills) : null) : existing.kills,
        matches !== undefined ? (matches ? Number(matches) : null) : existing.matches,
        badgeText ?? existing.badge_text,
        displayOrder !== undefined ? Number(displayOrder) : existing.display_order,
        active !== undefined ? (active !== "false" && active !== false) : existing.active,
        id,
      ]
    );

    res.json({ success: true, message: "আপডেট হয়েছে", data: toJson(rows[0]) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ═══════════════════════════════════════════════════════
// PUT /api/home-highlights/reorder — admin only, একসাথে অনেক কার্ডের order বদলানো
// body: { order: [{ id, displayOrder }, ...] }
// ═══════════════════════════════════════════════════════
router.put("/reorder/bulk", protect, adminOnly, async (req, res) => {
  const client = await pool.connect();
  try {
    const { order } = req.body;
    if (!Array.isArray(order)) {
      return res.status(400).json({ success: false, message: "order array দিন" });
    }
    await client.query("BEGIN");
    for (const item of order) {
      await client.query(
        `UPDATE home_highlights SET display_order = $1, updated_at = now() WHERE id = $2`,
        [item.displayOrder, item.id]
      );
    }
    await client.query("COMMIT");
    res.json({ success: true, message: "ক্রম আপডেট হয়েছে" });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

// ═══════════════════════════════════════════════════════
// DELETE /api/home-highlights/:id — admin only
// ═══════════════════════════════════════════════════════
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(`SELECT * FROM home_highlights WHERE id = $1`, [id]);
    const existing = rows[0];
    if (!existing) {
      return res.status(404).json({ success: false, message: "কার্ড পাওয়া যায়নি" });
    }
    if (existing.image_public_id) {
      try { await cloudinary.uploader.destroy(existing.image_public_id); } catch (e) {}
    }
    await pool.query(`DELETE FROM home_highlights WHERE id = $1`, [id]);
    res.json({ success: true, message: "মুছে ফেলা হয়েছে" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;