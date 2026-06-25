 // backend/routes/resultRoutes.js

const express = require("express");
const router  = express.Router();
const jwt     = require("jsonwebtoken");

const {
  uploadScreenshot,
  getMyMatchResult,
  getPendingSubmissions,
  getSubmissionsByMatch,
  reviewSubmission,
} = require("../controllers/resultController");

// ✅ Inline protect middleware — matchRoutes.js এর মতো একই pattern
const protect = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ success: false, message: "No token" });
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

const protectAdmin = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ success: false, message: "No token" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "admin" && decoded.role !== "super-admin")
      return res.status(403).json({ success: false, message: "Admin only" });
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

// ── User Routes ───────────────────────────────────────────────────────────────
// POST /api/result/upload/:matchId  — screenshot upload
router.post("/upload/:matchId", protect, uploadScreenshot);

// GET  /api/result/my/:matchId      — আমার result দেখো
router.get("/my/:matchId", protect, getMyMatchResult);

// ── Admin Routes ──────────────────────────────────────────────────────────────
// GET  /api/result/pending          — pending submissions
router.get("/pending", protectAdmin, getPendingSubmissions);

// GET  /api/result/match/:matchId   — একটা match এর সব submissions
router.get("/match/:matchId", protectAdmin, getSubmissionsByMatch);

// PUT  /api/result/review/:submissionId — approve/reject
router.put("/review/:submissionId", protectAdmin, reviewSubmission);

module.exports = router;