 // routes/referralRoutes.js
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { protect } = require("../middleware/auth");

// ⚠️ IMPORTANT: "/convert" route টা "/:userId" এর আগে থাকতে হবে
// নাহলে Express "convert" কে userId হিসেবে ধরে নেবে

// POST /api/referral/convert
router.post("/convert", protect, async (req, res) => {
  try {
    // ✅ Security fix: body থেকে নয়, auth middleware থেকে userId নাও
    const user = await User.findById(req.user.id || req.user._id);
    if (!user) return res.json({ success: false, message: "User not found" });

    const currentPoints = user.referralPoints || 0;

    // ✅ Minimum 20 points
    if (currentPoints < 20) {
      return res.json({
        success: false,
        message: `কমপক্ষে ২০ পয়েন্ট লাগবে! আপনার আছে ${currentPoints} points`,
      });
    }

    // ✅ 1 point = 1 টাকা — সব points convert হবে
    const taka = currentPoints;
    user.referralPoints = 0;
    user.balance = (user.balance || 0) + taka;
    await user.save();

    res.json({
      success: true,
      message: `✅ ${currentPoints} পয়েন্ট → ৳${taka} balance-এ যোগ হয়েছে!`,
      newBalance: user.balance,
      remainingPoints: 0,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/referral/:userId
router.get("/:userId", protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate(
      "referralHistory.userId",
      "name phone"
    );
    if (!user) return res.json({ success: false, message: "User not found" });

    res.json({
      success: true,
      data: {
        referralCode:    user.referralCode,
        referralPoints:  user.referralPoints  || 0,
        referralCount:   user.referralCount   || 0,
        referralHistory: user.referralHistory || [],
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;