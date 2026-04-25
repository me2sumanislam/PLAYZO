 const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ================= ADMIN LOGIN =================
router.post("/login", async (req, res) => {
  try {
    const { phone, password } = req.body;

    // 🔥 FIND USER
    const user = await User.findOne({ phone });

    if (!user) {
      return res.json({
        success: false,
        message: "User not found",
      });
    }

    // 🔥 CHECK ROLE
    if (user.role !== "admin") {
      return res.json({
        success: false,
        message: "Not an admin account",
      });
    }

    // 🔥 PASSWORD CHECK
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.json({
        success: false,
        message: "Wrong password",
      });
    }

    // 🔐 TOKEN GENERATE
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // ✅ RESPONSE
    res.json({
      success: true,
      message: "Admin login success 🚀",
      token,
      user: {
        id: user._id,
        phone: user.phone,
        role: user.role,
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