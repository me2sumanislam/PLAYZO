 // controllers/resultController.js
// (Postgres/Supabase version — converted from Mongoose)
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const multer = require("multer");
const { Pool } = require("pg");

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
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

const uploadBufferToCloudinary = (buffer, folder = "playzo_results") =>
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

function toSubmissionJson(row) {
  if (!row) return row;
  return {
    _id: row.id,
    id: row.id,
    match: row.match_id,
    submittedBy: row.submitted_by,
    screenshot: { url: row.screenshot_url, publicId: row.screenshot_public_id },
    status: row.status,
    adminNote: row.admin_note,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ===================== UPLOAD SCREENSHOT =====================
exports.uploadScreenshot = [
  upload.single("screenshot"),
  async (req, res) => {
    const client = await pool.connect();
    try {
      const userId = req.user?.id;
      if (!req.file) {
        client.release();
        return res.status(400).json({ success: false, message: "No screenshot file received" });
      }
      if (!userId) {
        client.release();
        return res.status(401).json({ success: false, message: "Login করুন" });
      }

      const { matchId } = req.params;

      const { rows: matchRows } = await client.query(`SELECT * FROM matches WHERE id = $1`, [matchId]);
      const match = matchRows[0];
      if (!match) {
        client.release();
        return res.status(404).json({ success: false, message: "Match পাওয়া যায়নি" });
      }

      // এই user আগে submit করেছে কিনা চেক
      const { rows: existingRows } = await client.query(
        `SELECT * FROM result_submissions WHERE match_id = $1 AND submitted_by = $2`,
        [matchId, userId]
      );
      const existing = existingRows[0] || null;

      // নতুন user হলে 48 limit চেক করো
      if (!existing) {
        const { rows: countRows } = await client.query(
          `SELECT COUNT(*)::int AS count FROM result_submissions WHERE match_id = $1`,
          [matchId]
        );
        if (countRows[0].count >= 48) {
          client.release();
          return res.status(400).json({
            success: false,
            message: "এই ম্যাচে সর্বোচ্চ 48টি screenshot জমা হয়ে গেছে",
          });
        }
      }

      const safeName = (match.title || "match")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "_")
        .replace(/_+/g, "_")
        .slice(0, 50);
      const folder = `playzo_results/${safeName}`;

      const uploadResult = await uploadBufferToCloudinary(req.file.buffer, folder);

      let submission;

      if (existing) {
        // পুরানো image Cloudinary থেকে delete করো
        if (existing.screenshot_public_id) {
          try {
            await cloudinary.uploader.destroy(existing.screenshot_public_id);
          } catch (e) {
            console.warn("⚠️ Old image delete failed:", e.message);
          }
        }

        const { rows } = await client.query(
          `UPDATE result_submissions
           SET screenshot_url = $1, screenshot_public_id = $2, status = 'pending_review',
               admin_note = '', updated_at = now()
           WHERE id = $3
           RETURNING *`,
          [uploadResult.secure_url, uploadResult.public_id, existing.id]
        );
        submission = rows[0];
      } else {
        const { rows } = await client.query(
          `INSERT INTO result_submissions (match_id, submitted_by, screenshot_url, screenshot_public_id, status)
           VALUES ($1,$2,$3,$4,'pending_review')
           RETURNING *`,
          [matchId, userId, uploadResult.secure_url, uploadResult.public_id]
        );
        submission = rows[0];
      }

      return res.status(201).json({
        success: true,
        message: existing
          ? "✅ Screenshot আপডেট হয়েছে! Admin review করবে।"
          : "✅ Screenshot upload সফল হয়েছে! Admin review করবে।",
        data: toSubmissionJson(submission),
      });
    } catch (error) {
      console.error("❌ Upload Error:", error);
      return res.status(500).json({ success: false, name: error.name, message: error.message });
    } finally {
      client.release();
    }
  },
];

// ===================== GET MY RESULT =====================
exports.getMyMatchResult = async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = req.user.id;

    const { rows } = await pool.query(
      `SELECT * FROM result_submissions WHERE match_id = $1 AND submitted_by = $2`,
      [matchId, userId]
    );
    const submission = rows[0];
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "এই ম্যাচের কোনো স্ক্রিনশট জমা দেওয়া হয়নি",
      });
    }

    const { rows: players } = await pool.query(
      `SELECT * FROM result_submission_players WHERE submission_id = $1`,
      [submission.id]
    );

    res.json({
      success: true,
      data: {
        ...toSubmissionJson(submission),
        finalPlayers: players.map((p) => ({
          inGameName: p.in_game_name,
          kills: p.kills,
          prizeAwarded: p.prize_awarded,
          position: p.position,
        })),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ===================== ADMIN: Get Pending Submissions (status-wise) =====================
exports.getPendingSubmissions = async (req, res) => {
  try {
    const { status = "pending_review" } = req.query;

    const { rows } = await pool.query(
      `SELECT rs.*, m.title AS match_title, m.category AS match_category, m.start_time AS match_start_time,
              u.name AS submitter_name, u.phone AS submitter_phone
       FROM result_submissions rs
       LEFT JOIN matches m ON m.id = rs.match_id
       LEFT JOIN users u ON u.id = rs.submitted_by
       WHERE rs.status = $1
       ORDER BY rs.created_at DESC`,
      [status]
    );

    const data = rows.map((r) => ({
      ...toSubmissionJson(r),
      match: { _id: r.match_id, title: r.match_title, category: r.match_category, startTime: r.match_start_time },
      submittedBy: { _id: r.submitted_by, name: r.submitter_name, phone: r.submitter_phone },
    }));

    res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ===================== ADMIN: Get Submissions by Match =====================
exports.getSubmissionsByMatch = async (req, res) => {
  try {
    const { matchId } = req.params;

    const { rows } = await pool.query(
      `SELECT rs.*, u.name AS submitter_name, u.phone AS submitter_phone
       FROM result_submissions rs
       LEFT JOIN users u ON u.id = rs.submitted_by
       WHERE rs.match_id = $1
       ORDER BY rs.created_at DESC`,
      [matchId]
    );

    const data = rows.map((r) => ({
      ...toSubmissionJson(r),
      submittedBy: { _id: r.submitted_by, name: r.submitter_name, phone: r.submitter_phone },
    }));

    res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ===================== ADMIN: Review Submission =====================
exports.reviewSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { action, adminNote = "" } = req.body;

    const { rows } = await pool.query(
      `UPDATE result_submissions
       SET status = $1, admin_note = $2, reviewed_by = $3, reviewed_at = now(), updated_at = now()
       WHERE id = $4
       RETURNING *`,
      [action === "approve" ? "approved" : "rejected", adminNote, req.user.id, submissionId]
    );
    const submission = rows[0];
    if (!submission) {
      return res.status(404).json({ success: false, message: "Submission not found" });
    }

    res.json({
      success: true,
      message: `Submission ${action}d successfully`,
      data: toSubmissionJson(submission),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};