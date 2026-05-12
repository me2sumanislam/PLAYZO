 // routes/deposit.js
const express = require("express");
const router = express.Router();
const Deposit = require("../models/Deposit");
const User = require("../models/User");   // ← এটা import করো

// POST /deposit (আগেরটা ঠিক আছে)

// GET /deposits (আগেরটা ঠিক আছে)

// PATCH /deposit/:id
router.patch("/deposit/:id", async (req, res) => {
  try {
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const deposit = await Deposit.findById(req.params.id).populate("userId");

    if (!deposit) {
      return res.status(404).json({ success: false, message: "Deposit not found" });
    }

    if (deposit.status !== "pending") {
      return res.status(400).json({ success: false, message: "Already processed" });
    }

    // ==================== APPROVE লজিক ====================
    if (status === "approved") {
      if (!deposit.userId) {
        return res.status(400).json({ success: false, message: "User not found in deposit" });
      }

      // User এর ব্যালেন্স আপডেট
      await User.findByIdAndUpdate(
        deposit.userId._id || deposit.userId,
        { $inc: { balance: deposit.amount } }
      );

      // Deposit এর status আপডেট
      deposit.status = "approved";
      await deposit.save();

      return res.json({
        success: true,
        message: "Deposit approved and balance updated successfully!",
        data: deposit
      });
    } 
    // ==================== REJECT লজিক ====================
    else {
      deposit.status = "rejected";
      await deposit.save();

      return res.json({
        success: true,
        message: "Deposit rejected",
        data: deposit
      });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;