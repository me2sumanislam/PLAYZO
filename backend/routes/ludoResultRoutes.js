 // ================================================================
// ludoResultRoutes.js  —  Ludo Image-Based Result System (No Kills)
// ================================================================
// server.js এ add করুন:
// app.use("/api/ludo-result", require("./routes/ludoResultRoutes"));
// ================================================================

const express     = require("express");
const router      = express.Router();
const multer      = require("multer");
const cloudinary  = require("cloudinary").v2;
const streamifier = require("streamifier");
const jwt         = require("jsonwebtoken");

const LudoTournament       = require("../models/LudoTournament");
const LudoResultSubmission = require("../models/LudoResultSubmission");
const User                 = require("../models/User");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Memory storage — multer-storage-cloudinary প্যাকেজের version conflict এড়াতে
// resultController.js এর মতো একই proven pattern ব্যবহার করা হলো (buffer → stream → Cloudinary)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
  fileFilter: (req, file, cb) =>
    file.mimetype.startsWith("image/") ? cb(null, true) : cb(new Error("শুধু image"), false),
});

// Buffer কে Cloudinary-তে stream হিসেবে আপলোড করার helper
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

const protect = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ success: false, message: "Token নেই" });
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ success: false, message: "Invalid token" });
  }
};

const adminOnly = (req, res, next) => {
  if (!["admin", "super-admin"].includes(req.user?.role))
    return res.status(403).json({ success: false, message: "Admin only" });
  next();
};

// ════════════════════════════════════════════════════════════════
// USER: Screenshot Upload
// POST /api/ludo-result/upload/:matchId   field: "screenshot"
// ════════════════════════════════════════════════════════════════
router.post("/upload/:matchId", protect, upload.single("screenshot"), async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = req.user.id || req.user._id;

    if (!req.file)
      return res.status(400).json({ success: false, message: "Screenshot upload করুন" });

    const match = await LudoTournament.findById(matchId);
    if (!match)
      return res.status(404).json({ success: false, message: "Match পাওয়া যায়নি" });
    if (match.status === "completed")
      return res.status(400).json({ success: false, message: "Match শেষ হয়ে গেছে" });

    const isJoined = (match.joinedUsers || []).some(
      (u) => (u.userId?._id || u.userId)?.toString() === userId.toString()
    );
    if (!isJoined)
      return res.status(403).json({ success: false, message: "আপনি এই match এ join করেননি" });

    const existing = await LudoResultSubmission.findOne({ match: matchId, submittedBy: userId });
    if (existing)
      return res.status(400).json({ success: false, message: "ইতিমধ্যে screenshot submit করেছেন" });

    // Match title থেকে safe folder name বানাও (resultController.js এর মতোই)
    const safeName = (match.title || "ludo-match")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_")
      .replace(/_+/g, "_")
      .slice(0, 50);
    const folder = `playzo-ludo-results/${safeName}`;

    const uploadResult = await uploadBufferToCloudinary(req.file.buffer, folder);

    const submission = await LudoResultSubmission.create({
      match:       matchId,
      submittedBy: userId,
      screenshot:  { url: uploadResult.secure_url, publicId: uploadResult.public_id },
      status:      "pending_review",
    });

    res.status(201).json({
      success:      true,
      message:      "✅ Screenshot submit সফল! Admin review করবে।",
      submissionId: submission._id,
    });
  } catch (err) {
    if (err.code === 11000)
      return res.status(400).json({ success: false, message: "ইতিমধ্যে screenshot submit করেছেন" });
    console.error("Ludo screenshot upload error:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

// ════════════════════════════════════════════════════════════════
// USER: নিজের submission status
// GET /api/ludo-result/my/:matchId
// ════════════════════════════════════════════════════════════════
router.get("/my/:matchId", protect, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const submission = await LudoResultSubmission.findOne({
      match: req.params.matchId, submittedBy: userId,
    }).select("status screenshot adminNote createdAt");

    if (!submission)
      return res.status(404).json({ success: false, message: "কোনো screenshot submit হয়নি" });
    res.json({ success: true, data: submission });
  } catch {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ════════════════════════════════════════════════════════════════
// ADMIN: একটা match এর সব screenshots দেখা
// GET /api/ludo-result/admin/match/:matchId
// ════════════════════════════════════════════════════════════════
router.get("/admin/match/:matchId", protect, adminOnly, async (req, res) => {
  try {
    const submissions = await LudoResultSubmission.find({ match: req.params.matchId })
      .populate("submittedBy", "name phone")
      .sort({ createdAt: -1 });
    res.json({ success: true, count: submissions.length, data: submissions });
  } catch {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ════════════════════════════════════════════════════════════════
// ADMIN: Result Submit + Prize Distribute (Image দেখে)
// POST /api/ludo-result/admin/submit/:matchId
//
// Body for 1v1:
//   { results: [{userId, inGameName, rank, prize}] }
//   → rank 1 = winner, prize = winPrize
//
// Body for 2v2:
//   { results: [{userId, inGameName, rank, prize, team}], winningTeam: "A" }
//   → winning team এর 2 জন prize = winPrize/2 each
//
// Body for 4player:
//   { results: [{userId, inGameName, rank, prize}] }
//   → rank 1=first prize, rank 2=second prize, etc.
// ════════════════════════════════════════════════════════════════
router.post("/admin/submit/:matchId", protect, adminOnly, async (req, res) => {
  try {
    const { results, winningTeam } = req.body;
    const match = await LudoTournament.findById(req.params.matchId);

    if (!match)
      return res.status(404).json({ success: false, message: "Match পাওয়া যায়নি" });
    if (match.status === "completed")
      return res.status(400).json({ success: false, message: "Result ইতিমধ্যে submit হয়েছে" });
    if (!Array.isArray(results) || results.length === 0)
      return res.status(400).json({ success: false, message: "Results দিন" });

    // Prize validation by mode
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

    // Save to match
    match.results    = results;
    match.status     = "completed";
    match.completedAt = new Date();
    if (match.mode === "2v2" && winningTeam) match.winningTeam = winningTeam;
    await match.save();

    // Distribute prizes
    let totalDistributed = 0;
    for (const r of results) {
      if (r.userId && r.prize > 0) {
        totalDistributed += r.prize;
        const desc =
          match.mode === "1v1"     ? `${match.title} — Winner Prize`                       :
          match.mode === "2v2"     ? `${match.title} — Team ${r.team} Winner (৳${r.prize})` :
          /* 4player */              `${match.title} — Rank #${r.rank} Prize`;

        await User.findByIdAndUpdate(r.userId, {
          $inc: { balance: r.prize },
          $push: {
            transactions: {
              type:        "match_prize",
              amount:      r.prize,
              matchId:     match._id,
              description: desc,
            },
          },
        });
      }
    }

    // Mark submissions as published
    await LudoResultSubmission.updateMany(
      { match: match._id, status: "pending_review" },
      { status: "published", reviewedBy: req.user.id || req.user._id, reviewedAt: new Date() }
    );

    res.json({
      success:          true,
      message:          `✅ Result submit ও ৳${totalDistributed} prize distribute হয়েছে!`,
      totalDistributed,
      mode:             match.mode,
      ...(match.mode === "2v2" ? { winningTeam } : {}),
    });

  } catch (err) {
    console.error("Ludo result error:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

// ════════════════════════════════════════════════════════════════
// ADMIN: Submission reject
// PUT /api/ludo-result/admin/reject/:submissionId
// ════════════════════════════════════════════════════════════════
router.put("/admin/reject/:submissionId", protect, adminOnly, async (req, res) => {
  try {
    const { adminNote = "" } = req.body;
    const sub = await LudoResultSubmission.findById(req.params.submissionId);
    if (!sub) return res.status(404).json({ success: false, message: "Submission পাওয়া যায়নি" });
    sub.status    = "rejected";
    sub.adminNote = adminNote;
    sub.reviewedBy = req.user.id || req.user._id;
    sub.reviewedAt = new Date();
    await sub.save();
    res.json({ success: true, message: "Submission reject করা হয়েছে" });
  } catch {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;