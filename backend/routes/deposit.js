 const express = require("express");
const router = express.Router();
const Deposit = require("../models/Deposit");

// ✅ User — deposit request পাঠাবে
router.post("/deposit", async (req, res) => {
  try {
    const { method, amount, trxId, userId, paymentNumber } = req.body;

    const deposit = await Deposit.create({
      method,
      amount: Number(amount),
      trxId,
      paymentNumber: paymentNumber || null,
      userId: userId || null,
      status: "pending",
    });

    res.json({ success: true, data: deposit });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ Admin — সব deposit দেখবে (filter by status)
router.get("/deposits", async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const data = await Deposit.find(filter)
      .sort({ createdAt: -1 })
      .populate("userId", "name phone email");
    res.json(data);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ Admin — approve / reject করবে
router.patch("/deposit/:id", async (req, res) => {
  try {
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const deposit = await Deposit.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!deposit) {
      return res.status(404).json({ success: false, message: "Deposit not found" });
    }

    res.json({
      success: true,
      message: `Deposit ${status} সফলভাবে!`,
      data: deposit,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;