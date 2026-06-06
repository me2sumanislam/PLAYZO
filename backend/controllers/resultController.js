 // controllers/resultController.js
const cloudinary = require("cloudinary").v2;
const ResultSubmission = require("../models/ResultSubmission");
const Match = require("../models/Match");
const User = require("../models/User");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ===================== UPLOAD SCREENSHOT (Fixed) =====================
exports.uploadScreenshot = async (req, res) => {
  try {
    console.log("📸 Upload Request Received");
    console.log("File:", req.file ? "✅ Received" : "❌ No File");
    console.log("User ID:", req.user ? req.user.id : "❌ No User");

    if (!req.file) {
      return res.status(400).json({ success: false, message: "Screenshot upload করুন" });
    }

    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: "Login করুন" });
    }

    const { matchId } = req.params;

    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ success: false, message: "Match পাওয়া যায়নি" });
    }

    if (match.status === "completed") {
      return res.status(400).json({ success: false, message: "Match শেষ হয়ে গেছে" });
    }

    // Cloudinary-এ আপলোড
    const uploadResult = await cloudinary.uploader.upload(req.file.path, {
      folder: "playzo_results",
      resource_type: "image",
    });

    console.log("✅ Cloudinary Upload Successful:", uploadResult.secure_url);

    // Database এ সেভ
    const submission = await ResultSubmission.create({
      match: matchId,
      submittedBy: req.user.id,
      screenshot: {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
      },
      status: "pending_review",
    });

    res.status(201).json({
      success: true,
      message: "✅ Screenshot upload সফল! Admin review করবে।",
      data: submission,
    });

  } catch (error) {
    console.error("❌ Upload Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Something went wrong!",
      error: error.message,
    });
  }
};

// ===================== ADMIN: Pending Submissions =====================
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

// ===================== ADMIN: Review Submission =====================
exports.reviewSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { action, finalPlayers, adminNote = "" } = req.body;

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({ message: "action হবে approve অথবা reject" });
    }

    const submission = await ResultSubmission.findById(submissionId);
    if (!submission) return res.status(404).json({ message: "Submission পাওয়া যায়নি" });

    submission.status = action === "approve" ? "approved" : "rejected";
    submission.adminNote = adminNote;
    submission.reviewedBy = req.user.id;
    submission.reviewedAt = new Date();

    if (action === "approve" && finalPlayers?.length > 0) {
      submission.finalPlayers = finalPlayers;
    }

    await submission.save();

    res.json({ success: true, message: `Submission ${action}d`, data: submission });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// ===================== ADMIN: Publish Result =====================
exports.publishResult = async (req, res) => {
  try {
    const { submissionId } = req.params;

    const submission = await ResultSubmission.findById(submissionId).populate("match");
    if (!submission) return res.status(404).json({ message: "Submission পাওয়া যায়নি" });
    if (submission.status !== "approved") {
      return res.status(400).json({ message: "আগে approve করুন" });
    }

    const match = submission.match;

    const sorted = [...submission.finalPlayers].sort((a, b) => b.kills - a.kills);

    for (let i = 0; i < sorted.length; i++) {
      const player = sorted[i];
      if (!player.matchedUserId) continue;

      let prize = 0;
      if (i === 0) prize = match.winPrize || 0;

      if (prize > 0) {
        await User.findByIdAndUpdate(player.matchedUserId, {
          $inc: { balance: prize },
          $push: {
            transactions: {
              type: "match_prize",
              amount: prize,
              matchId: match._id,
              description: `${match.title} - Prize (${player.kills} kills)`,
            },
          },
        });
        sorted[i].prizeAwarded = prize;
      }
    }

    submission.finalPlayers = sorted;
    submission.status = "published";
    match.status = "completed";
    match.completedAt = new Date();
    match.results = sorted.map((p, i) => ({
      inGameName: p.inGameName,
      kills: p.kills,
      rank: i + 1,
      prize: p.prizeAwarded || 0,
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

// ===================== USER: Get My Result =====================
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