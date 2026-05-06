 const express = require("express");
const router  = express.Router();
const Deposit = require("../models/Deposit");
const User    = require("../models/User");

router.post("/deposit", async (req, res) => {
  try {
    const { method, amount, trxId, userId, paymentNumber } = req.body;

    if (!method || !amount || !trxId) {
      return res.status(400).json({
        success: false,
        message: "method, amount এবং trxId দিন",
      });
    }

    const deposit = await Deposit.create({
      method,
      amount: Number(amount),
      trxId,
      paymentNumber: paymentNumber || null,
      userId: userId || null,
      status: "pending",
    });

    res.json({ success: true, deposit });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/deposits", async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status && status !== "all" ? { status } : {};
    const deposits = await Deposit.find(filter)
      .sort({ createdAt: -1 })
      .populate("userId", "name phone");
    res.json(deposits);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch("/deposit/:id", async (req, res) => {
  try {
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "status হবে 'approved' অথবা 'rejected'",
      });
    }

    const deposit = await Deposit.findById(req.params.id);
    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: "Deposit পাওয়া যায়নি",
      });
    }

    if (deposit.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "এই request আগেই process হয়ে গেছে",
      });
    }

    deposit.status = status;
    await deposit.save();

    if (status === "approved" && deposit.userId) {
      const user = await User.findByIdAndUpdate(
        deposit.userId,
        { $inc: { balance: deposit.amount } },
        { new: true }
      );

      return res.json({
        success: true,
        message: `✅ Approved! ৳${deposit.amount} user এর balance এ যোগ হয়েছে`,
        deposit,
        newBalance: user?.balance,
      });
    }

    res.json({
      success: true,
      message: status === "approved" ? "✅ Approved!" : "❌ Rejected",
      deposit,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;