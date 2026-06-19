 // controllers/resultController.js
const cloudinary = require("cloudinary").v2;
const ResultSubmission = require("../models/ResultSubmission");
const Match = require("../models/Match");
const User = require("../models/User");
const multer = require("multer");
const path = require("path");

// Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer Setup for Screenshot Upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/screenshots/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

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

// ===================== UPLOAD SCREENSHOT =====================
exports.uploadScreenshot = [
  upload.single("screenshot"),
  async (req, res) => {
    try {
      console.log("📸 Upload Request Received for match:", req.params.matchId);

      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          message: "No screenshot file received" 
        });
      }

      if (!req.user?.id) {
        return res.status(401).json({ 
          success: false, 
          message: "Login করুন" 
        });
      }

      const { matchId } = req.params;

      const match = await Match.findById(matchId);
      if (!match) {
        return res.status(404).json({ 
          success: false, 
          message: "Match পাওয়া যায়নি" 
        });
      }

      // Upload to Cloudinary
      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: "playzo_results",
        resource_type: "image",
      });

      console.log("✅ Cloudinary Upload Successful:", uploadResult.secure_url);

      // Save to Database
      const submission = await ResultSubmission.create({
        match: matchId,
        submittedBy: req.user.id,
        screenshot: {
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id,
        },
        status: "pending_review",
        submittedAt: new Date(),
      });

      res.status(201).json({
        success: true,
        message: "✅ Screenshot upload সফল হয়েছে! Admin review করবে।",
        data: submission,
      });

    } catch (error) {
      console.error("❌ Upload Error:", error.message);
      res.status(500).json({
        success: false,
        message: "Upload failed. আবার চেষ্টা করুন।",
        error: error.message,
      });
    }
  },
];

// ===================== GET MY RESULT =====================
exports.getMyMatchResult = async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = req.user.id;

    const submission = await ResultSubmission.findOne({
      match: matchId,
      submittedBy: userId,
    }).select("status finalPlayers screenshot adminNote createdAt reviewedAt");

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "এই ম্যাচের কোনো স্ক্রিনশট জমা দেওয়া হয়নি",
      });
    }

    res.json({ success: true, data: submission });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ===================== ADMIN: Get Pending Submissions =====================
exports.getPendingSubmissions = async (req, res) => {
  try {
    const { status = "pending_review" } = req.query;

    const submissions = await ResultSubmission.find({ status })
      .populate("match", "title category startTime")
      .populate("submittedBy", "name phone")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: submissions });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ===================== ADMIN: Review Submission =====================
exports.reviewSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { action, adminNote = "" } = req.body;

    const submission = await ResultSubmission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({ 
        success: false, 
        message: "Submission not found" 
      });
    }

    submission.status = action === "approve" ? "approved" : "rejected";
    submission.adminNote = adminNote;
    submission.reviewedBy = req.user.id;
    submission.reviewedAt = new Date();

    await submission.save();

    res.json({
      success: true,
      message: `Submission ${action}d successfully`,
      data: submission,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  uploadScreenshot,
  getMyMatchResult,
  getPendingSubmissions,
  reviewSubmission,
};