 const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { protect } = require("../middleware/auth");

// 💰 GET MY BALANCE (THIS FIXES YOUR ERROR)
router.get("/balance", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id || req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      balance: user.balance,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// 👤 GET USER BY ID (YOUR OLD ROUTE)
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User পাওয়া যায়নি",
      });
    }

    res.json({
      success: true,
      ...user.toObject(),
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

module.exports = router;