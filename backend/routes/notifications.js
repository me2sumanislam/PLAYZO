 // routes/notifications.js
const express = require("express");
const router = express.Router();
const webpush = require("web-push");
const PushSubscription = require("../models/PushSubscription");
const Notification = require("../models/Notification");

webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// ================= SUBSCRIBE =================
router.post("/subscribe", async (req, res) => {
  try {
    const { subscription, userId } = req.body;
    if (!subscription?.endpoint) {
      return res.status(400).json({ success: false, message: "Invalid subscription" });
    }
    await PushSubscription.findOneAndUpdate(
      { endpoint: subscription.endpoint },
      { subscription, userId: userId || null, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    res.json({ success: true, message: "Subscribed!" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ================= GET NOTIFICATIONS =================
router.get("/", async (req, res) => {
  try {
    const { isRead, limit = 20, category } = req.query;

    const filter = {};
    if (isRead === "false") filter.isRead = false;
    if (isRead === "true")  filter.isRead = true;
    if (category)           filter.category = category;

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

// ================= MARK ALL AS READ =================
router.patch("/read-all", async (req, res) => {
  try {
    await Notification.updateMany({ isRead: false }, { isRead: true });
    res.json({ success: true, message: "All marked as read" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ================================================================
// ✅ INTERNAL HELPER
// Free Fire:  sendMatchNotification(match, "freefire")
// Ludo:       sendMatchNotification(match, "ludo")
// ================================================================
router.sendMatchNotification = async (match, category = "general") => {
  try {
    const isLudo    = category === "ludo";
    const emoji     = isLudo ? "🎲" : "🎮";
    const gameLabel = isLudo ? "Ludo Match" : "Free Fire Match";
    const url       = isLudo
      ? `/app?tab=ludo`
      : `/app?tab=results&matchId=${match._id}`;

    const notifTitle   = `${emoji} নতুন ${gameLabel} তৈরি হয়েছে!`;
    const notifMessage = `${match.title} — Entry: ৳${match.entryFee} | Prize: ৳${match.winPrize}`;

    // ১. DB তে save করো
    const unreadBefore = await Notification.countDocuments({ isRead: false });

    await Notification.create({
      title:    notifTitle,
      message:  notifMessage,
      matchId:  match._id,
      category: category,
      isRead:   false,
    });

    const newUnreadCount = unreadBefore + 1;

    // ২. Push notification পাঠাও
    const subs = await PushSubscription.find({});
    if (subs.length === 0) return;

    const payload = JSON.stringify({
      title:       notifTitle,
      body:        notifMessage,
      icon:        "/image/icon/icon-192x192.png",
      badge:       "/image/icon/icon-72x72.png",
      tag:         `match-${category}`,
      matchId:     match._id.toString(),
      category:    category,
      url:         url,
      unreadCount: newUnreadCount,
    });

    const results = await Promise.allSettled(
      subs.map((s) => webpush.sendNotification(s.subscription, payload))
    );

    // মেয়াদ শেষ subscription মুছো
    const expired = [];
    results.forEach((r, i) => {
      if (r.status === "rejected") {
        const code = r.reason?.statusCode;
        if (code === 404 || code === 410) expired.push(subs[i]._id);
      }
    });

    if (expired.length > 0) {
      await PushSubscription.deleteMany({ _id: { $in: expired } });
      console.log(`🗑️ ${expired.length} expired subscription(s) removed`);
    }

    console.log(`📨 [${category}] Notification sent to ${subs.length} subscribers`);
  } catch (err) {
    console.error("Push notification error:", err.message);
  }
};

module.exports = router;