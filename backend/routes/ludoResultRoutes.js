 // ================================================================
// ludoResultRoutes.js  —  Ludo Image-Based Result System (No Kills)
// ================================================================
const express     = require("express");
const router      = express.Router();
const multer      = require("multer");
const cloudinary  = require("cloudinary").v2;
const streamifier = require("streamifier");
const { Pool }    = require("pg");
const { protect } = require("../middleware/auth");

const pool = require("../utils/db");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) =>
    file.mimetype.startsWith("image/") ? cb(null, true) : cb(new Error("শুধু image"), false),
});

const uploadBufferToCloudinary = (buffer, folder = "playzo-ludo-results") =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type:  "image",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        transformation:  [{ width: 1920, crop: "limit", quality: "auto" }],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });

// ✅ auth.js এর নতুন protect middleware ব্যবহার করা হচ্ছে (Supabase session verify করে)
const adminOnly = (req, res, next) => {
  if (!["admin", "super-admin"].includes(req.user?.role))
    return res.status(403).json({ success: false, message: "Admin only" });
  next();
};

// ════════════════════════════════════════════════════════════════
// USER: Screenshot Upload
// ════════════════════════════════════════════════════════════════
router.post("/upload/:matchId", protect, upload.single("screenshot"), async (req, res) => {
  const client = await pool.connect();
  try {
    const { matchId } = req.params;
    const userId = req.user.id;

    if (!req.file)
      return res.status(400).json({ success: false, message: "Screenshot upload করুন" });

    const { rows: matchRows } = await client.query(
      `SELECT * FROM ludo_tournaments WHERE id = $1`,
      [matchId]
    );
    const match = matchRows[0];
    if (!match)
      return res.status(404).json({ success: false, message: "Match পাওয়া যায়নি" });
    if (match.status === "completed")
      return res.status(400).json({ success: false, message: "Match শেষ হয়ে গেছে" });

    const { rows: joinedRows } = await client.query(
      `SELECT id FROM ludo_participants WHERE tournament_id = $1 AND user_id = $2`,
      [matchId, userId]
    );
    if (joinedRows.length === 0)
      return res.status(403).json({ success: false, message: "আপনি এই match এ join করেননি" });

    const { rows: existingRows } = await client.query(
      `SELECT id FROM ludo_result_submissions WHERE match_id = $1 AND submitted_by = $2`,
      [matchId, userId]
    );
    if (existingRows.length > 0)
      return res.status(400).json({ success: false, message: "ইতিমধ্যে screenshot submit করেছেন" });

    const safeName = (match.title || "ludo-match")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_")
      .replace(/_+/g, "_")
      .slice(0, 50);
    const folder = `playzo-ludo-results/${safeName}`;

    const uploadResult = await uploadBufferToCloudinary(req.file.buffer, folder);

    const { rows: subRows } = await client.query(
      `INSERT INTO ludo_result_submissions
        (match_id, submitted_by, screenshot_url, screenshot_public_id, status)
       VALUES ($1,$2,$3,$4,'pending_review')
       RETURNING id`,
      [matchId, userId, uploadResult.secure_url, uploadResult.public_id]
    );

    res.status(201).json({
      success:      true,
      message:      "✅ Screenshot submit সফল! Admin review করবে।",
      submissionId: subRows[0].id,
    });
  } catch (err) {
    if (err.code === "23505") // unique_violation (match_id, submitted_by)
      return res.status(400).json({ success: false, message: "ইতিমধ্যে screenshot submit করেছেন" });
    console.error("Ludo screenshot upload error:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  } finally {
    client.release();
  }
});

// ════════════════════════════════════════════════════════════════
// USER: নিজের submission status
// ════════════════════════════════════════════════════════════════
router.get("/my/:matchId", protect, async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = req.user.id;
    const { rows } = await client.query(
      `SELECT status, screenshot_url, admin_note, created_at
       FROM ludo_result_submissions
       WHERE match_id = $1 AND submitted_by = $2`,
      [req.params.matchId, userId]
    );

    if (rows.length === 0)
      return res.status(404).json({ success: false, message: "কোনো screenshot submit হয়নি" });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  } finally {
    client.release();
  }
});

// ════════════════════════════════════════════════════════════════
// ADMIN: একটা match এর সব screenshots দেখা
// ════════════════════════════════════════════════════════════════
router.get("/admin/match/:matchId", protect, adminOnly, async (req, res) => {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `SELECT rs.*, u.name AS submitter_name, u.phone AS submitter_phone
       FROM ludo_result_submissions rs
       JOIN users u ON u.id = rs.submitted_by
       WHERE rs.match_id = $1
       ORDER BY rs.created_at DESC`,
      [req.params.matchId]
    );
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  } finally {
    client.release();
  }
});

// ════════════════════════════════════════════════════════════════
// ADMIN: Result Submit + Prize Distribute
// ════════════════════════════════════════════════════════════════
router.post("/admin/submit/:matchId", protect, adminOnly, async (req, res) => {
  const client = await pool.connect();
  try {
    const { results, winningTeam } = req.body;
    const matchId = req.params.matchId;

    const { rows: matchRows } = await client.query(
      `SELECT * FROM ludo_tournaments WHERE id = $1`,
      [matchId]
    );
    const match = matchRows[0];

    if (!match)
      return res.status(404).json({ success: false, message: "Match পাওয়া যায়নি" });
    if (match.status === "completed")
      return res.status(400).json({ success: false, message: "Result ইতিমধ্যে submit হয়েছে" });
    if (!Array.isArray(results) || results.length === 0)
      return res.status(400).json({ success: false, message: "Results দিন" });

    if (match.mode === "1v1") {
      const winner = results.find(r => r.rank === 1);
      if (!winner)
        return res.status(400).json({ success: false, message: "1v1 এ rank 1 (winner) দিন" });
      if (results.length !== 2)
        return res.status(400).json({ success: false, message: "1v1 এ 2 জনের result দিন" });
    }

    if (match.mode === "2v2") {
      if (!winningTeam)
        return res.status(400).json({ success: false, message: "Winning Team (A বা B) দিন" });
      const winnerCount = results.filter(r => r.team === winningTeam).length;
      if (winnerCount !== 2)
        return res.status(400).json({ success: false, message: `Team ${winningTeam} এ 2 জন player assign করুন` });
    }

    await client.query("BEGIN");

    // ludo_tournaments আপডেট
    await client.query(
      `UPDATE ludo_tournaments
       SET status = 'completed', winning_team = $1
       WHERE id = $2`,
      [match.mode === "2v2" ? winningTeam : match.winning_team, matchId]
    );

    let totalDistributed = 0;
    for (const r of results) {
      // ludo_results এ প্রতিটা player এর ফলাফল সেভ
      await client.query(
        `INSERT INTO ludo_results (tournament_id, user_id, rank, prize, kills)
         VALUES ($1,$2,$3,$4,0)`,
        [matchId, r.userId || null, r.rank || null, r.prize || 0]
      );

      if (r.userId && r.prize > 0) {
        totalDistributed += r.prize;

        // ✅ atomic balance update (adjust_user_balance RPC ব্যবহার করা হলো)
        await client.query(`SELECT adjust_user_balance($1, $2)`, [r.userId, r.prize]);

        const desc =
          match.mode === "1v1"     ? `${match.title} — Winner Prize`                       :
          match.mode === "2v2"     ? `${match.title} — Team ${r.team} Winner (৳${r.prize})` :
          /* 4player */              `${match.title} — Rank #${r.rank} Prize`;

        // ⚠️ transactions.match_id শুধু matches টেবিলের সাথে link, তাই এখানে null রেখে
        // match_title দিয়ে বোঝানো হচ্ছে এটা কোন ludo match থেকে এসেছে
        await client.query(
          `INSERT INTO transactions (user_id, type, amount, match_id, match_title)
           VALUES ($1,'match_prize',$2,NULL,$3)`,
          [r.userId, r.prize, desc]
        );
      }
    }

    // submissions published করা
    await client.query(
      `UPDATE ludo_result_submissions
       SET status = 'published', reviewed_by = $1, reviewed_at = now()
       WHERE match_id = $2 AND status = 'pending_review'`,
      [req.user.id, matchId]
    );

    await client.query("COMMIT");

    res.json({
      success:          true,
      message:          `✅ Result submit ও ৳${totalDistributed} prize distribute হয়েছে!`,
      totalDistributed,
      mode:             match.mode,
      ...(match.mode === "2v2" ? { winningTeam } : {}),
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Ludo result error:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  } finally {
    client.release();
  }
});

// ════════════════════════════════════════════════════════════════
// ADMIN: Submission reject
// ════════════════════════════════════════════════════════════════
router.put("/admin/reject/:submissionId", protect, adminOnly, async (req, res) => {
  const client = await pool.connect();
  try {
    const { adminNote = "" } = req.body;
    const { rows } = await client.query(
      `UPDATE ludo_result_submissions
       SET status = 'rejected', admin_note = $1, reviewed_by = $2, reviewed_at = now()
       WHERE id = $3
       RETURNING id`,
      [adminNote, req.user.id, req.params.submissionId]
    );
    if (rows.length === 0)
      return res.status(404).json({ success: false, message: "Submission পাওয়া যায়নি" });
    res.json({ success: true, message: "Submission reject করা হয়েছে" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  } finally {
    client.release();
  }
});

module.exports = router;