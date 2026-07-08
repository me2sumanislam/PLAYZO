 // backend/routes/resultRoutes.js
// (Postgres/Supabase version — converted from Mongoose)
const express = require("express");
const router  = express.Router();
const { protect, adminOnly } = require("../middleware/auth");

const {
  uploadScreenshot,
  getMyMatchResult,
  getPendingSubmissions,
  getSubmissionsByMatch,
  reviewSubmission,
} = require("../controllers/resultController");

// ── User Routes ───────────────────────────────────────────────────────────────
// POST /api/result/upload/:matchId  — screenshot upload
router.post("/upload/:matchId", protect, uploadScreenshot);

// GET  /api/result/my/:matchId      — আমার result দেখো
router.get("/my/:matchId", protect, getMyMatchResult);

// ── Admin Routes ──────────────────────────────────────────────────────────────
// GET  /api/result/pending          — pending submissions
router.get("/pending", protect, adminOnly, getPendingSubmissions);

// GET  /api/result/match/:matchId   — একটা match এর সব submissions
router.get("/match/:matchId", protect, adminOnly, getSubmissionsByMatch);

// PUT  /api/result/review/:submissionId — approve/reject
router.put("/review/:submissionId", protect, adminOnly, reviewSubmission);

module.exports = router;