 // routes/resultRoutes.js  ← নতুন ফাইল, routes/ folder এ রাখুন
// npm install cloudinary multer multer-storage-cloudinary tesseract.js

const express        = require("express");
const multer         = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary     = require("cloudinary").v2;
const jwt            = require("jsonwebtoken");
const { createWorker } = require("tesseract.js");
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

// ─── Auth middleware (আপনার existing JWT logic এর মতোই) ──────────────────────
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

// ─── OCR helper ───────────────────────────────────────────────────────────────
async function runOCR(imageUrl, joinedGameNames = []) {
  const worker = await createWorker("eng");
  try {
    const { data } = await worker.recognize(imageUrl);
    const rawText  = data.text || "";

    // joined name গুলো lowercase map এ রাখি
    const nameMap = {};
    for (const n of joinedGameNames) {
      if (n) nameMap[n.toLowerCase().trim()] = n;
    }

    const players = [];
    const lines   = rawText.split("\n").map((l) => l.trim()).filter(Boolean);

    for (const line of lines) {
      const killMatch = line.match(/\b(\d{1,2})\b/g); // 0–99 range kills
      const rankMatch = line.match(/#\s*(\d+)/i);
      if (!killMatch) continue;

      const kills = parseInt(killMatch[killMatch.length - 1], 10);
      const rank  = rankMatch ? parseInt(rankMatch[1], 10) : 0;

      const nameRaw = line
        .replace(/#\s*\d+/gi, "")
        .replace(/\b\d{1,2}\b/g, "")
        .replace(/[^a-zA-Z0-9_.\- ]/g, "")
        .trim();

      if (!nameRaw || nameRaw.length < 2 || kills > 60) continue;

      const lower = nameRaw.toLowerCase();
      let isMatched = false;
      let finalName = nameRaw;

      for (const [key, original] of Object.entries(nameMap)) {
        if (key === lower || key.includes(lower) || lower.includes(key)) {
          isMatched = true;
          finalName = original;
          break;
        }
      }

      players.push({ inGameName: finalName, kills, rank, isMatched, matchedUserId: null });
    }

    players.sort((a, b) => b.kills - a.kills);
    return { rawText, players };
  } finally {
    await worker.terminate();
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// USER: Screenshot upload
// POST /api/result/upload/:matchId
// field name: "screenshot"
// ═════════════════════════════════════════════════════════════════════════════
router.post("/upload/:matchId", protect, upload.single("screenshot"), async (req, res) => {
  try {
    const { matchId } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: "Screenshot upload করুন" });
    }

    const match = await Match.findById(matchId);
    if (!match) return res.status(404).json({ message: "Match পাওয়া যায়নি" });

    // ইতিমধ্যে আছে কিনা
    const existing = await ResultSubmission.findOne({ match: matchId });
    if (existing) {
      return res.status(400).json({ message: "এই match এর screenshot ইতিমধ্যে submit হয়েছে" });
    }

    const screenshotUrl      = req.file.path;
    const screenshotPublicId = req.file.filename;

    // Joined players এর inGameName list
    const joinedGameNames = (match.joinedUsers || [])
      .map((u) => u.inGameName)
      .filter(Boolean);

    // Submission তৈরি করে user কে সাথে সাথে response দিই
    const submission = await ResultSubmission.create({
      match:       matchId,
      submittedBy: req.user.id || req.user._id,
      screenshot:  { url: screenshotUrl, publicId: screenshotPublicId },
      status:      "processing",
    });

    res.status(201).json({
      success:      true,
      message:      "Screenshot upload সফল! OCR processing শুরু হয়েছে...",
      submissionId: submission._id,
    });

    // Background এ OCR চালাই
    try {
      const { rawText, players } = await runOCR(screenshotUrl, joinedGameNames);
      await ResultSubmission.findByIdAndUpdate(submission._id, {
        ocrRawText:   rawText,
        ocrPlayers:   players,
        finalPlayers: players,
        status:       "pending_review",
      });
    } catch (ocrErr) {
      console.error("OCR Error:", ocrErr.message);
      await ResultSubmission.findByIdAndUpdate(submission._id, {
        ocrRawText: "OCR failed — admin manually review করুন",
        status:     "pending_review",
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// USER: নিজের match এর result status দেখা
// GET /api/result/my/:matchId
// ═════════════════════════════════════════════════════════════════════════════
router.get("/my/:matchId", protect, async (req, res) => {
  try {
    const submission = await ResultSubmission.findOne({ match: req.params.matchId })
      .select("status finalPlayers screenshot adminNote createdAt");

    if (!submission) {
      return res.status(404).json({ message: "এই match এর result এখনো submit হয়নি" });
    }
    res.json({ success: true, data: submission });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// ADMIN: pending submissions list
// GET /api/result/admin/submissions?status=pending_review
// ═════════════════════════════════════════════════════════════════════════════
router.get("/admin/submissions", protect, adminOnly, async (req, res) => {
  try {
    const { status = "pending_review" } = req.query;
    const submissions = await ResultSubmission.find({ status })
      .populate("match", "title category entryFee winPrize perKill prizes")
      .populate("submittedBy", "name phone")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: submissions });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// ADMIN: OCR result review — approve / reject
// PUT /api/result/admin/review/:submissionId
// body: { action: "approve"|"reject", finalPlayers: [...], adminNote: "" }
// ═════════════════════════════════════════════════════════════════════════════
router.put("/admin/review/:submissionId", protect, adminOnly, async (req, res) => {
  try {
    const { action, finalPlayers, adminNote = "" } = req.body;

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({ message: "action হবে approve অথবা reject" });
    }

    const submission = await ResultSubmission.findById(req.params.submissionId);
    if (!submission) return res.status(404).json({ message: "Submission পাওয়া যায়নি" });

    submission.status     = action === "approve" ? "approved" : "rejected";
    submission.adminNote  = adminNote;
    submission.reviewedBy = req.user.id || req.user._id;
    submission.reviewedAt = new Date();

    if (action === "approve" && Array.isArray(finalPlayers) && finalPlayers.length > 0) {
      submission.finalPlayers = finalPlayers;
    }
    await submission.save();

    res.json({ success: true, message: `${action === "approve" ? "Approved" : "Rejected"} successfully` });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// ADMIN: Result publish + prize distribute
// POST /api/result/admin/publish/:submissionId
// ═════════════════════════════════════════════════════════════════════════════
router.post("/admin/publish/:submissionId", protect, adminOnly, async (req, res) => {
  try {
    const submission = await ResultSubmission.findById(req.params.submissionId)
      .populate("match");

    if (!submission) return res.status(404).json({ message: "Submission পাওয়া যায়নি" });
    if (submission.status !== "approved") {
      return res.status(400).json({ message: "আগে approve করুন" });
    }

    const match  = submission.match;
    const sorted = [...submission.finalPlayers].sort((a, b) => b.kills - a.kills);

    // Prize distribution (আপনার existing prize logic এর মতো)
    for (let i = 0; i < sorted.length; i++) {
      const player = sorted[i];
      if (!player.matchedUserId) continue;

      let prize = (player.kills || 0) * (match.perKill || 0);
      if (i === 0) prize += match.prizes?.first  || match.winPrize || 0;
      else if (i === 1) prize += match.prizes?.second || 0;
      else if (i === 2) prize += match.prizes?.third  || 0;
      else if (i === 3) prize += match.prizes?.fourth || 0;

      prize = Math.floor(prize);
      sorted[i].prizeAwarded = prize;

      if (prize > 0) {
        await User.findByIdAndUpdate(player.matchedUserId, {
          $inc: { balance: prize },
          $push: {
            transactions: {
              type:        "match_prize",
              amount:      prize,
              matchId:     match._id,
              matchTitle:  match.title,
              description: `${match.title} - ${player.kills} kills`,
              date:        new Date(),
            },
          },
        });
      }
    }

    submission.finalPlayers = sorted;
    submission.status       = "published";

    match.results = sorted.map((p, i) => ({
      inGameName: p.inGameName,
      kills:      p.kills,
      position:   i + 1,
      prize:      p.prizeAwarded || 0,
    }));
    match.status            = "completed";
    match.completedAt       = new Date();
    match.resultSubmissionId = submission._id;
    // auto-delete 24 ঘণ্টা পরে
    match.deleteAt          = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await submission.save();
    await match.save();

    res.json({
      success: true,
      message: "Result publish সফল! Prize distribute হয়েছে।",
      results: match.results,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;