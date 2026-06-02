 // backend/routes/notificationRoutes.js
// Admin panel থেকে notification পাঠানোর route

const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { sendToAll, sendToUser } = require("../utils/sendNotification");

// Admin middleware
const protectAdmin = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.json({ success: false, message: "No token" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "admin" && decoded.role !== "super-admin") {
      return res.json({ success: false, message: "Admin only" });
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.json({ success: false, message: "Invalid token" });
  }
};

// ─── POST /api/notifications/send-all ───────────────────────────
// সব user কে notification পাঠাবে
router.post("/send-all", protectAdmin, async (req, res) => {
  const { title, message, url } = req.body;
  if (!title || !message) {
    return res.json({ success: false, message: "Title ও message দিন" });
  }
  const result = await sendToAll({ title, message, url });
  res.json(result);
});

// ─── POST /api/notifications/send-user ──────────────────────────
// নির্দিষ্ট user কে notification পাঠাবে
router.post("/send-user", protectAdmin, async (req, res) => {
  const { userId, title, message, url } = req.body;
  if (!userId || !title || !message) {
    return res.json({ success: false, message: "userId, title ও message দিন" });
  }
  const result = await sendToUser({ userId, title, message, url });
  res.json(result);
});

module.exports = router;