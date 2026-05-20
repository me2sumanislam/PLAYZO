 const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { protect } = require("../middleware/auth");

// GET /api/referral/:userId
router.get("/:userId", protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.json({ success: false, message: "User not found" });

    res.json({
      success: true,
      data: {
        referralCode: user.referralCode,
        referralPoints: user.referralPoints || 0,
        referralCount: user.referrals?.length || 0,
        referralHistory: user.referrals || [],
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/referral/convert
router.post("/convert", protect, async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.json({ success: false, message: "User not found" });

    if ((user.referralPoints || 0) < 100) {
      return res.json({ success: false, message: "কমপক্ষে ১০০ পয়েন্ট লাগবে!" });
    }

    const convertAmount = Math.floor(user.referralPoints / 100) * 100;
    user.referralPoints -= convertAmount;
    user.balance = (user.balance || 0) + convertAmount;
    await user.save();

    res.json({
      success: true,
      message: `✅ ${convertAmount} পয়েন্ট → ৳${convertAmount} balance-এ যোগ হয়েছে!`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;