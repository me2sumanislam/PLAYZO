 const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");


// ================= REGISTER =================
router.post("/register", async (req, res) => {
  try {
    const { phone, password } = req.body;

    const existingUser = await User.findOne({ phone });

    if (existingUser) {
      return res.json({
        success: false,
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      phone,
      password: hashedPassword,
    });

    res.json({
      success: true,
      message: "User created successfully",
      data: user,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});


// ================= LOGIN =================
router.post("/login", async (req, res) => {
  try {
    const { phone, password, deviceType } = req.body;

    // 🔥 MOBILE ONLY CHECK (basic anti-PC system)
    if (deviceType && deviceType !== "mobile") {
      return res.json({
        success: false,
        message: "Only mobile devices allowed 🎮",
      });
    }

    const user = await User.findOne({ phone });

    if (!user) {
      return res.json({
        success: false,
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.json({
        success: false,
        message: "Wrong password",
      });
    }

    // 🔐 JWT TOKEN
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        phone: user.phone,
      },
      process.env.JWT_SECRET || "secretkey",
      { expiresIn: "7d" }
    );

    // 🔥 update last login (gaming tracking)
    user.lastLogin = new Date();
    await user.save();

    res.json({
      success: true,
      message: "Login success",
      token,
      user: {
        id: user._id,
        phone: user.phone,
        role: user.role,
        balance: user.balance,
        totalMatchesPlayed: user.totalMatchesPlayed,
        totalWins: user.totalWins,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

module.exports = router;