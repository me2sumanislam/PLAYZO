 // routes/notifications.js
const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");
const UserNotification = require("../models/userNotification");
const { protect } = require("../middleware/auth");
const { sendToAll } = require("../utils/sendNotification");

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/notifications
// এই user এর notifications + unread count
// ─────────────────────────────────────────────────────────────────────────────
router.get("/", protect, async (req, res) => {
  try {
    const { isRead, limit = 20, category } = req.query;

    const filter = { userId: req.user.id };
    if (isRead === "false") filter.isRead = false;
    if (isRead === "true") filter.isRead = true;

    const userNotifs = await UserNotification.find(filter)
      .populate("notificationId")
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    // populate এর পরে category filter
    const filtered = category
      ? userNotifs.filter((n) => n.notificationId?.category === category)
      : userNotifs;

    const unreadCount = await UserNotification.countDocuments({
      userId: req.user.id,
      isRead: false,
    });

    res.json({
      success: true,
      notifications: filtered,
      unreadCount,
      count: filtered.length,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/notifications/read-all
// এই user এর সব notification read করো
// ─────────────────────────────────────────────────────────────────────────────
router.patch("/read-all", protect, async (req, res) => {
  try {
    await UserNotification.updateMany(
      { userId: req.user.id, isRead: false },
      { isRead: true }
    );
    res.json({ success: true, message: "All marked as read" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/notifications/read/:id
// একটা নির্দিষ্ট notification read করো
// ─────────────────────────────────────────────────────────────────────────────
router.patch("/read/:id", protect, async (req, res) => {
  try {
    await UserNotification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { isRead: true }
    );
    res.json({ success: true, message: "Marked as read" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/notifications/clear
// এই user এর সব notification মুছো
// ─────────────────────────────────────────────────────────────────────────────
router.delete("/clear", protect, async (req, res) => {
  try {
    await UserNotification.deleteMany({ userId: req.user.id });
    res.json({ success: true, message: "All notifications cleared" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Internal helper — match create হলে matchRoutes থেকে call করা হয়
// router.sendMatchNotification(match, category)
// ─────────────────────────────────────────────────────────────────────────────
router.sendMatchNotification = async (match, category = "general") => {
  try {
    const isLudo = category === "ludo";
    const emoji = isLudo ? "🎲" : "🎮";
    const gameLabel = isLudo ? "Ludo Match" : "Free Fire Match";
    const url = isLudo
      ? `/app?tab=ludo`
      : `/app?tab=results&matchId=${match._id}`;

    const notifTitle = `${emoji} নতুন ${gameLabel} তৈরি হয়েছে!`;
    const notifMessage = `${match.title} — Entry: ৳${match.entryFee} | Prize: ৳${match.winPrize}`;

    // 1️⃣ একটাই Notification document save করো
    const notif = await Notification.create({
      title: notifTitle,
      message: notifMessage,
      matchId: match._id,
      category,
    });

    // 2️⃣ সব active user এর জন্য UserNotification entry
    const User = require("../models/User");
    const users = await User.find({}, "_id");

    const entries = users.map((user) => ({
      notificationId: notif._id,
      userId: user._id,
      isRead: false,
    }));

    await UserNotification.insertMany(entries);

    // 3️⃣ OneSignal push — সবার phone এ notification যাবে
    await sendToAll({
      title: notifTitle,
      message: notifMessage,
      url,
      matchId: match._id,
      category,
    });

    console.log(`📨 [${category}] Match notification sent to ${users.length} users`);
    return { success: true, count: users.length };
  } catch (err) {
    console.error("❌ sendMatchNotification error:", err.message);
    return { success: false, message: err.message };
  }
};

module.exports = router;