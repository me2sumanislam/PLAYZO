 // routes/notifications.js
const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");
const { sendToAll, sendToUser } = require("../utils/sendNotification");

// GET /api/notifications
router.get("/", async (req, res) => {
  try {
    const { isRead, limit = 20, category } = req.query;

    const filter = {};
    if (isRead === "false") filter.isRead = false;
    if (isRead === "true") filter.isRead = true;
    if (category) filter.category = category;

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    const unreadCount = await Notification.countDocuments({ isRead: false });

    res.json({
      success: true,
      notifications,
      unreadCount,
      count: notifications.length,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/notifications/read-all
router.patch("/read-all", async (req, res) => {
  try {
    await Notification.updateMany({ isRead: false }, { isRead: true });
    res.json({ success: true, message: "All marked as read" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Internal helper — match create হলে call করো
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

    // DB তে save
    await Notification.create({
      title: notifTitle,
      message: notifMessage,
      matchId: match._id,
      category: category,
      isRead: false,
    });

    // OneSignal দিয়ে push পাঠাও
    await sendToAll({
      title: notifTitle,
      message: notifMessage,
      url,
    });

    console.log(`📨 [${category}] OneSignal notification sent`);
  } catch (err) {
    console.error("Push notification error:", err.message);
  }
};

module.exports = router;