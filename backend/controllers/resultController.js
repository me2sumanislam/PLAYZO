 // controllers/resultController.js
// npm install cloudinary multer-storage-cloudinary tesseract.js

const cloudinary       = require("cloudinary").v2;
const { createWorker } = require("tesseract.js");
const ResultSubmission = require("../models/ResultSubmission");
const Match            = require("../models/Match");
const User             = require("../models/User");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: OCR দিয়ে screenshot parse করে players বের করা
// Free Fire result screen এ সাধারণত এই format থাকে:
//   PlayerName   12   #3    (name, kills, rank)
// ─────────────────────────────────────────────────────────────────────────────
async function parseScreenshotWithOCR(imageUrl, joinedGameNames = []) {
  const worker = await createWorker("eng");

  try {
    const { data } = await worker.recognize(imageUrl);
    const rawText  = data.text || "";

    // নামের list lowercase করে রাখি fast lookup এর জন্য
    const nameMap = {};
    for (const name of joinedGameNames) {
      nameMap[name.toLowerCase().trim()] = name;
    }

    const players = [];
    const lines   = rawText.split("\n").map((l) => l.trim()).filter(Boolean);

    for (const line of lines) {
      // Pattern: anything that has a number (kills) in it
      // Free Fire result: "PlayerName 5 #2" or "#2 PlayerName 5"
      const killMatch = line.match(/(\d+)\s*(?:kill|kills)?/i);
      const rankMatch = line.match(/#\s*(\d+)/i);
      if (!killMatch) continue;

      const kills = parseInt(killMatch[1], 10);
      const rank  = rankMatch ? parseInt(rankMatch[1], 10) : 0;

      // kills number এবং rank টা সরিয়ে বাকিটা নাম
      const nameRaw = line
        .replace(/#\s*\d+/gi, "")
        .replace(/\d+\s*kills?/gi, "")
        .replace(/\b\d{1,3}\b/g, "")  // standalone short numbers
        .replace(/[^a-zA-Z0-9_\s\-\.]/g, "")
        .trim();

      if (!nameRaw || nameRaw.length < 2) continue;
      if (kills > 99) continue; // OCR garbage filter

      // Joined player list এর সাথে fuzzy match
      const lower   = nameRaw.toLowerCase();
      let isMatched = false;
      let matchedUserId = null;
      let finalName  = nameRaw;

      for (const [key, original] of Object.entries(nameMap)) {
        // exact বা partial match
        if (key === lower || key.includes(lower) || lower.includes(key)) {
          isMatched  = true;
          finalName  = original;
          // userId পরে admin panel থেকে match করবে যদি দরকার হয়
          break;
        }
      }

      players.push({ inGameName: finalName, kills, rank, isMatched, matchedUserId });
    }

    // rank দিয়ে sort, না থাকলে kills দিয়ে
    players.sort((a, b) => {
      if (a.rank && b.rank) return a.rank - b.rank;
      return b.kills - a.kills;
    });

    return { rawText, players };
  } finally {
    await worker.terminate();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// USER: Screenshot upload + OCR trigger
// POST /api/result/upload/:matchId
// multipart/form-data — field: "screenshot"
// ─────────────────────────────────────────────────────────────────────────────
exports.uploadScreenshot = async (req, res) => {
  try {
    const { matchId } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: "Screenshot upload করুন" });
    }

    // Match খুঁজে participants নামের list বের করি
    const match = await Match.findById(matchId).populate("participants.user", "gameName");
    if (!match) return res.status(404).json({ message: "Match পাওয়া যায়নি" });

    if (match.status === "completed") {
      return res.status(400).json({ message: "Match শেষ হয়ে গেছে" });
    }

    // ইতিমধ্যে submission আছে কিনা check
    const existing = await ResultSubmission.findOne({ match: matchId });
    if (existing) {
      return res.status(400).json({ message: "এই match এর result ইতিমধ্যে submit হয়েছে" });
    }

    // Cloudinary URL (multer-storage-cloudinary already upload করে দেয়)
    const screenshotUrl      = req.file.path;
    const screenshotPublicId = req.file.filename;

    // Joined players এর game name list
    const joinedGameNames = match.participants
      .map((p) => p.gameName || p.user?.gameName || "")
      .filter(Boolean);

    // DB তে processing status দিয়ে save করি আগে — user কে response দিই
    const submission = await ResultSubmission.create({
      match:       matchId,
      submittedBy: req.user.id,
      screenshot:  { url: screenshotUrl, publicId: screenshotPublicId },
      status:      "processing",
    });

    // OCR background এ চালাই (response দেওয়ার পরে)
    res.status(201).json({
      success: true,
      message: "Screenshot upload সফল! OCR processing শুরু হয়েছে...",
      submissionId: submission._id,
    });

    // Background OCR
    try {
      const { rawText, players } = await parseScreenshotWithOCR(screenshotUrl, joinedGameNames);
      await ResultSubmission.findByIdAndUpdate(submission._id, {
        ocrRawText:  rawText,
        ocrPlayers:  players,
        finalPlayers: players,  // admin এটাই edit করবে
        status:      "pending_review",
      });
    } catch (ocrErr) {
      console.error("OCR Error:", ocrErr.message);
      await ResultSubmission.findByIdAndUpdate(submission._id, {
        ocrRawText: "OCR failed",
        status:     "pending_review", // তবুও admin review এ পাঠাই
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: সব pending submissions দেখা
// GET /api/admin/result/submissions?status=pending_review
// ─────────────────────────────────────────────────────────────────────────────
exports.getPendingSubmissions = async (req, res) => {
  try {
    const { status = "pending_review" } = req.query;
    const submissions = await ResultSubmission.find({ status })
      .populate("match", "title category entryFee winPrize")
      .populate("submittedBy", "name phone")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: submissions });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: একটা submission এর OCR result edit করে approve/reject
// PUT /api/admin/result/review/:submissionId
// body: { action: "approve"|"reject", finalPlayers: [...], adminNote: "" }
// ─────────────────────────────────────────────────────────────────────────────
exports.reviewSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { action, finalPlayers, adminNote = "" } = req.body;

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({ message: "action হবে approve অথবা reject" });
    }

    const submission = await ResultSubmission.findById(submissionId);
    if (!submission) return res.status(404).json({ message: "Submission পাওয়া যায়নি" });

    submission.status      = action === "approve" ? "approved" : "rejected";
    submission.adminNote   = adminNote;
    submission.reviewedBy  = req.user.id;
    submission.reviewedAt  = new Date();
    if (action === "approve" && finalPlayers?.length > 0) {
      submission.finalPlayers = finalPlayers;
    }
    await submission.save();

    res.json({ success: true, message: `Submission ${action}d`, data: submission });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: Approved submission publish করা + prize distribute
// POST /api/admin/result/publish/:submissionId
// ─────────────────────────────────────────────────────────────────────────────
exports.publishResult = async (req, res) => {
  try {
    const { submissionId } = req.params;

    const submission = await ResultSubmission.findById(submissionId)
      .populate("match");
    if (!submission) return res.status(404).json({ message: "Submission পাওয়া যায়নি" });
    if (submission.status !== "approved") {
      return res.status(400).json({ message: "আগে approve করুন" });
    }

    const match = submission.match;

    // Kill count অনুযায়ী prize distribute logic
    // match এ winPrize কীভাবে distribute হবে সেটা আপনার match model অনুযায়ী customize করুন
    // এখানে simple: top killer সব prize পাবে (আপনি পরিবর্তন করতে পারবেন)
    const sorted = [...submission.finalPlayers].sort((a, b) => b.kills - a.kills);

    for (let i = 0; i < sorted.length; i++) {
      const player = sorted[i];
      if (!player.matchedUserId) continue;

      // Prize distribution — rank অনুযায়ী customize করুন
      let prize = 0;
      if (i === 0) prize = match.winPrize || 0;
      // আরো rank এ prize দিতে চাইলে এখানে add করুন

      if (prize > 0) {
        await User.findByIdAndUpdate(player.matchedUserId, {
          $inc: { balance: prize },
          $push: {
            transactions: {
              type:        "match_prize",
              amount:      prize,
              matchId:     match._id,
              description: `${match.title} - Prize (${player.kills} kills)`,
            },
          },
        });
        sorted[i].prizeAwarded = prize;
      }
    }

    submission.finalPlayers = sorted;
    submission.status       = "published";
    match.status            = "completed";
    match.completedAt       = new Date();
    match.results           = sorted.map((p, i) => ({
      inGameName: p.inGameName,
      kills:      p.kills,
      rank:       i + 1,
      prize:      p.prizeAwarded || 0,
    }));

    await submission.save();
    await match.save();

    res.json({
      success: true,
      message: "Result publish সফল! Prize distribute হয়েছে।",
      results: match.results,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// USER: নিজের match result দেখা
// GET /api/result/my/:matchId
// ─────────────────────────────────────────────────────────────────────────────
exports.getMyMatchResult = async (req, res) => {
  try {
    const { matchId } = req.params;
    const submission = await ResultSubmission.findOne({ match: matchId })
      .select("status finalPlayers ocrPlayers screenshot adminNote createdAt");

    if (!submission) {
      return res.status(404).json({ message: "এই match এর result এখনো submit হয়নি" });
    }

    res.json({ success: true, data: submission });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};