

const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { protect } = require("../middleware/auth");

// GET balance
router.get("/balance", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id || req.user._id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, balance: user.balance });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET my profile
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id || req.user._id).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// UPDATE profile (name, email) — unique name check
router.put("/me", protect, async (req, res) => {
  try {
    const { name, email } = req.body;
    const userId = req.user.id || req.user._id;

    if (name && name.trim()) {
      const existing = await User.findOne({
        name: name.trim(),
        _id: { $ne: userId },
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: "এই নামটি ইতিমধ্যে ব্যবহৃত হচ্ছে, অন্য নাম দিন।",
        });
      }
    }

    const updated = await User.findByIdAndUpdate(
      userId,
      { name: name?.trim(), email: email?.trim() },
      { new: true }
    ).select("-password");

    res.json({ success: true, user: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// CHANGE password
router.put("/change-password", protect, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id || req.user._id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "পুরনো পাসওয়ার্ড সঠিক নয়" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ success: true, message: "পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET user by id
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User পাওয়া যায়নি" });
    res.json({ success: true, ...user.toObject() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ UPDATE game name (Free Fire in-game name)
router.put("/game-name", protect, async (req, res) => {
  try {
    const { inGameName } = req.body;
    if (!inGameName || !inGameName.trim()) {
      return res.status(400).json({ success: false, message: "Game name দিন" });
    }
    const user = await User.findByIdAndUpdate(
      req.user.id || req.user._id,
      { inGameName: inGameName.trim() },
      { new: true }
    ).select("inGameName name phone balance");

    res.json({ success: true, message: "Game name সেভ হয়েছে!", user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


module.exports = router;