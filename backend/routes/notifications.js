 // routes/notifications.js
const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");
const UserNotification = require("../models/userNotification"); // ✅ নতুন
const { protect } = require("../middleware/auth"); // ✅ তোমার existing middleware
const { sendToAll } = require("../utils/sendNotification");

// GET /api/notifications — এই user এর notifications + unread count
router.get("/", protect, async (req, res) => {
  try {
    const { isRead, limit = 20, category } = req.query;

    const filter = { userId: req.user.id };
    if (isRead === "false") filter.isRead = false;
    if (isRead === "true") filter.isRead = true;

    const userNotifs = await UserNotification.find(filter)
      .populate("notificationId") // ✅ actual notification data
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    // category filter (populate এর পরে)
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
      unreadCount, // ✅ শুধু এই user এর badge count
      count: filtered.length,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/notifications/read-all — শুধু এই user এর সব read করো
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

    // 1️⃣ একটাই Notification save
    const notif = await Notification.create({
      title: notifTitle,
      message: notifMessage,
      matchId: match._id,
      category,
      isRead: false,
    });

    // 2️⃣ সব user এর জন্য UserNotification entry
    const User = require("../models/User");
    const users = await User.find({}, "_id");

    const entries = users.map((user) => ({
      notificationId: notif._id,
      userId: user._id,
      isRead: false,
    }));

    await UserNotification.insertMany(entries); // ✅ bulk insert

    // 3️⃣ OneSignal push
    await sendToAll({ title: notifTitle, message: notifMessage, url });

    console.log(`📨 [${category}] Sent to ${users.length} users`);
  } catch (err) {
    console.error("Push notification error:", err.message);
  }
};

module.exports = router;