 // controllers/resultController.js
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const ResultSubmission = require("../models/ResultSubmission");
const Match = require("../models/Match");
const multer = require("multer");

// Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Memory storage — Render-এর ephemeral disk এড়িয়ে সরাসরি buffer থেকে Cloudinary-তে আপলোড
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

// Buffer কে Cloudinary-তে stream হিসেবে পাঠানোর helper
const uploadBufferToCloudinary = (buffer) =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "playzo_results", resource_type: "image" },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
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
          message: "No screenshot file received",
        });
      }

      if (!req.user?.id) {
        return res.status(401).json({
          success: false,
          message: "Login করুন",
        });
      }

      const { matchId } = req.params;

      const match = await Match.findById(matchId);
      if (!match) {
        return res.status(404).json({
          success: false,
          message: "Match পাওয়া যায়নি",
        });
      }

      // ইতিমধ্যে submit করা থাকলে (unique index আছে schema-তে)
      const existing = await ResultSubmission.findOne({
        match: matchId,
        submittedBy: req.user.id,
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: "আপনি ইতোমধ্যে এই ম্যাচের জন্য screenshot জমা দিয়েছেন",
        });
      }

      // Upload to Cloudinary (buffer থেকে সরাসরি, disk touch করা হয় না)
      const uploadResult = await uploadBufferToCloudinary(req.file.buffer);

      console.log("✅ Cloudinary Upload Successful:", uploadResult.secure_url);

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
        message: "✅ Screenshot upload সফল হয়েছে! Admin review করবে।",
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
        message: "এই ম্যাচের কোনো স্ক্রিনশট জমা দেওয়া হয়নি",
      });
    }

    res.json({ success: true, data: submission });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ===================== ADMIN: Get Pending Submissions (status-wise) =====================
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

// ===================== ADMIN: Get Submissions by Match (AdminPanel.jsx এর জন্য) =====================
exports.getSubmissionsByMatch = async (req, res) => {
  try {
    const { matchId } = req.params;

    const submissions = await ResultSubmission.find({ match: matchId })
      .populate("submittedBy", "name phone")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: submissions });
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

    const submission = await ResultSubmission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found",
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

 