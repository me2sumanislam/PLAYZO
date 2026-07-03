 // routes/referralRoutes.js
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { protect } = require("../middleware/auth");

// ⚠️ IMPORTANT: এই router এ আগে "/convert" route ছিল (points → balance)।
// নতুন Gem system এ gem কখনো taka তে convert হয় না, তাই এই route পুরোপুরি সরিয়ে ফেলা হয়েছে।

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
        gems:            user.gems || 0,
        referralCount:   user.referralCount   || 0,
        referralHistory: user.referralHistory || [],
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;