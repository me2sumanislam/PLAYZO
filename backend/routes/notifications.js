 const express = require("express");
const router = express.Router();
const webpush = require("web-push");
const PushSubscription = require("../models/PushSubscription");
const Notification = require("../models/Notification"); // ← ডাটাবেজ নোটিফিকেশন মডেল ইমপোর্ট করা হলো

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

// ================= SEND NOTIFICATION =================
router.sendMatchNotification = async (match) => {
  try {
    // -------------------------------------------------------------
    // ১. একই সাথে অ্যাপের ভেতরের বেল আইকনের ডাটাবেজে সেভ করুন
    // -------------------------------------------------------------
    try {
      await Notification.create({
        title: "🎮 নতুন Match তৈরি হয়েছে!",
        message: `${match.title} — Entry: ৳${match.entryFee} | Prize: ৳${match.winPrize}`,
        matchId: match._id,
        isRead: false
      });
      console.log("💾 In-App Notification saved to database");
    } catch (dbErr) {
      console.error("Failed to save notification to database:", dbErr.message);
    }

    // -------------------------------------------------------------
    // ২. আপনার এক্সিস্টিং ব্রাউজার/PWA পুশ নোটিফিকেশন লজিক
    // -------------------------------------------------------------
    const subs = await PushSubscription.find({});
    if (subs.length === 0) return;

    const payload = JSON.stringify({
      title: "🎮 নতুন Match তৈরি হয়েছে!",
      body: `${match.title} — Entry: ৳${match.entryFee} | Prize: ৳${match.winPrize}`,
      icon: "/image/icon/icon-192x192.png",
      badge: "/image/icon/icon-72x72.png",
      url: "/app",
    });

    const results = await Promise.allSettled(
      subs.map((s) => webpush.sendNotification(s.subscription, payload))
    );

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

    console.log(`📨 Notification sent to ${subs.length} subscribers`);
  } catch (err) {
    console.error("Push notification error:", err.message);
  }
};

module.exports = router;