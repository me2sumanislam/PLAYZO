 const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

function generateReferralCode(name) {
  const clean = (name || "USER").replace(/\s+/g, "").toUpperCase().slice(0, 4);
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${clean}${rand}`;
}

// ================= REGISTER =================
router.post("/register", async (req, res) => {
  try {
    const { name, inGameName, email, phone, password, referralCode } = req.body;

    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      return res.json({ success: false, message: "এই ফোন নম্বর দিয়ে আগেই একাউন্ট আছে" });
    }

    if (name && name.trim()) {
      const existingName = await User.findOne({ name: name.trim() });
      if (existingName) {
        return res.json({ success: false, message: "এই নামটি ইতিমধ্যে ব্যবহৃত, অন্য নাম দিন" });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let newReferralCode;
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 15) {
      newReferralCode = generateReferralCode(name);
      const existing = await User.findOne({ referralCode: newReferralCode });
      if (!existing) isUnique = true;
      attempts++;
    }

    let referrer = null;
    if (referralCode && referralCode.trim()) {
      referrer = await User.findOne({ referralCode: referralCode.trim().toUpperCase() });
    }

    const user = await User.create({
      name: name?.trim(),
      inGameName: inGameName?.trim(),
      email: email?.trim(),
      phone,
      password: hashedPassword,
      referralCode: newReferralCode,
      referredBy: referrer ? referrer._id : null,
      referralCount: 0,
      referralPoints: 0,
      referralHistory: [],
    });

    if (referrer) {
      referrer.referralHistory.push({
        userId:     user._id,
        name:       user.name,
        phone:      user.phone,
        deposited:  false,
        pointGiven: false,
        joinedAt:   new Date(),
      });
      referrer.referralCount += 1;
      await referrer.save();
    }

    // ✅ Token generate করো
    const token = jwt.sign(
      { id: user._id, role: user.role, phone: user.phone },
      process.env.JWT_SECRET || "secretkey",
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      message: "রেজিস্ট্রেশন সফল হয়েছে!",
      token, // ✅ token পাঠাও
      user: { // ✅ user পাঠাও
        id:             user._id,
        name:           user.name,
        inGameName:     user.inGameName,
        email:          user.email,
        phone:          user.phone,
        role:           user.role,
        balance:        user.balance,
        referralCode:   user.referralCode,
        referralPoints: user.referralPoints,
        referralCount:  user.referralCount,
      },
    });
  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ success: false, message: "সার্ভার এরর হয়েছে" });
  }
});

// ================= LOGIN =================
router.post("/login", async (req, res) => {
  try {
    const { phone, password, deviceType } = req.body;

    if (deviceType && deviceType !== "mobile") {
      return res.json({ success: false, message: "Only mobile devices allowed 🎮" });
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return res.json({ success: false, message: "ফোন নম্বর বা পাসওয়ার্ড ভুল" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.json({ success: false, message: "ফোন নম্বর বা পাসওয়ার্ড ভুল" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, phone: user.phone },
      process.env.JWT_SECRET || "secretkey",
      { expiresIn: "7d" }
    );

    user.lastLogin = new Date();
    await user.save();

    res.json({
      success: true,
      message: "Login success",
      token,
      user: {
        id:                 user._id,
        name:               user.name,
        inGameName:         user.inGameName,
        email:              user.email,
        phone:              user.phone,
        role:               user.role,
        balance:            user.balance,
        totalMatchesPlayed: user.totalMatchesPlayed,
        totalWins:          user.totalWins,
        referralCode:       user.referralCode,
        referralPoints:     user.referralPoints,
        referralCount:      user.referralCount,
      },
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ success: false, message: "সার্ভার এরর হয়েছে" });
  }
});

module.exports = router;