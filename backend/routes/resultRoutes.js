 // routes/resultRoutes.js

const express        = require("express");
const multer         = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary     = require("cloudinary").v2;
const jwt            = require("jsonwebtoken");
const router         = express.Router();

const Match            = require("../models/Match");
const User             = require("../models/User");
const ResultSubmission = require("../models/ResultSubmission");

// ─── Cloudinary config ────────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ─── Cloudinary storage ───────────────────────────────────────────────────────
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:          "playzo-results",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation:  [{ width: 1920, crop: "limit", quality: "auto" }],
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("শুধু image file upload করুন"), false);
  },
});

// ─── Auth middleware ───────────────────────────────────────────────────────────
const protect = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Token নেই" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user?.role !== "admin" && req.user?.role !== "super-admin") {
    return res.status(403).json({ message: "Admin only" });
  }
  next();
};

// ═════════════════════════════════════════════════════════════════════════════
// USER: Screenshot upload
// POST /api/result/upload/:matchId
// field name: "screenshot"
// একজন user একটা match এ শুধু ১টাই upload করতে পারবে
// ═════════════════════════════════════════════════════════════════════════════
router.post("/upload/:matchId", protect, upload.single("screenshot"), async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = req.user.id || req.user._id;

    if (!req.file) {
      return res.status(400).json({ success: false, message: "Screenshot upload করুন" });
    }

    const match = await Match.findById(matchId);
    if (!match) return res.status(404).json({ success: false, message: "Match পাওয়া যায়নি" });

    // এই user কি এই match এ joined?
    const isJoined = (match.joinedUsers || []).some((u) => {
      const uid = u.userId?._id?.toString() || u.userId?.toString();
      return uid === userId.toString();
    });
    if (!isJoined) {
      return res.status(403).json({ success: false, message: "আপনি এই match এ join করেননি" });
    }

    // এই user কি আগেই এই match এ upload করেছে?
    const existing = await ResultSubmission.findOne({
      match:       matchId,
      submittedBy: userId,
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "আপনি এই match এ ইতিমধ্যে screenshot submit করেছেন",
      });
    }

    const screenshotUrl      = req.file.path;
    const screenshotPublicId = req.file.filename;

    const submission = await ResultSubmission.create({
      match:       matchId,
      submittedBy: userId,
      screenshot:  { url: screenshotUrl, publicId: screenshotPublicId },
      status:      "pending_review",
    });

    res.status(201).json({
      success:      true,
      message:      "Screenshot upload সফল! Admin review করবে।",
      submissionId: submission._id,
    });

  } catch (err) {
    // Duplicate key error (extra safety)
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "আপনি এই match এ ইতিমধ্যে screenshot submit করেছেন",
      });
    }
    console.error("Upload error:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// USER: নিজের submission status দেখা
// GET /api/result/my/:matchId
// ═════════════════════════════════════════════════════════════════════════════
router.get("/my/:matchId", protect, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const submission = await ResultSubmission.findOne({
      match:       req.params.matchId,
      submittedBy: userId,
    }).select("status screenshot adminNote createdAt");

    if (!submission) {
      return res.status(404).json({ success: false, message: "এই match এ কোনো screenshot submit হয়নি" });
    }
    res.json({ success: true, data: submission });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// ADMIN: একটা match এর সব submissions দেখা
// GET /api/result/admin/match/:matchId
// সর্বোচ্চ 48 জন user এর 48টা screenshot
// ═════════════════════════════════════════════════════════════════════════════
router.get("/admin/match/:matchId", protect, adminOnly, async (req, res) => {
  try {
    const submissions = await ResultSubmission.find({ match: req.params.matchId })
      .populate("submittedBy", "name phone")
      .sort({ createdAt: -1 })
      .limit(48); // max 48 players

    res.json({ success: true, count: submissions.length, data: submissions });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// ADMIN: সব pending submissions (সব match এর)
// GET /api/result/admin/submissions?status=pending_review
// ═════════════════════════════════════════════════════════════════════════════
router.get("/admin/submissions", protect, adminOnly, async (req, res) => {
  try {
    const { status = "pending_review", matchId } = req.query;

    const filter = {};
    if (status !== "all") filter.status = status;
    if (matchId) filter.match = matchId;

    const submissions = await ResultSubmission.find(filter)
      .populate("match", "title category entryFee winPrize perKill prizes")
      .populate("submittedBy", "name phone")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: submissions.length, data: submissions });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// ADMIN: Submission reject (fake screenshot)
// PUT /api/result/admin/reject/:submissionId
// ═════════════════════════════════════════════════════════════════════════════
router.put("/admin/reject/:submissionId", protect, adminOnly, async (req, res) => {
  try {
    const { adminNote = "" } = req.body;
    const submission = await ResultSubmission.findById(req.params.submissionId);
    if (!submission) return res.status(404).json({ success: false, message: "Submission পাওয়া যায়নি" });

    submission.status     = "rejected";
    submission.adminNote  = adminNote;
    submission.reviewedBy = req.user.id || req.user._id;
    submission.reviewedAt = new Date();
    await submission.save();

    res.json({ success: true, message: "Submission reject করা হয়েছে" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;