 // backend/routes/resultRoutes.js
console.log("✅ resultRoutes loaded");
const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/auth");

const {
  uploadScreenshot,
  getMyMatchResult,
} = require("../controllers/resultController");

// User: Upload screenshot
router.post("/upload/:matchId", protect, uploadScreenshot);

// User: Get my submitted result
router.get("/my/:matchId", protect, getMyMatchResult);

module.exports = router;