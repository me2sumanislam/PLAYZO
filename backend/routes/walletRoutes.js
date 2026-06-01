 // routes/walletRoutes.js

const express = require("express");
const router  = express.Router();
const Deposit = require("../models/Deposit");
const User    = require("../models/User");

// ── Referral Constants ──────────────────────────────────────────
const REFERRAL_DEPOSIT_MIN = 50;   // B কে ন্যূনতম ৳৫০ deposit করতে হবে
const POINTS_PER_REFERRAL  = 5;    // প্রতি successful refer = 5 points
const MIN_CONVERT_POINTS   = 20;   // convert করতে minimum 20 points লাগবে
// ✅ 1 point = 1 টাকা (সরাসরি)

// ─── USER: Deposit Request Submit ────────────────────────────────
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

// ─── ADMIN: All Deposits ──────────────────────────────────────────
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

// ─── ADMIN: Approve / Reject Deposit ─────────────────────────────
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
      return res.status(404).json({ success: false, message: "Deposit পাওয়া যায়নি" });
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
      // ── User এর balance বাড়াও ──
      const user = await User.findByIdAndUpdate(
        deposit.userId,
        { $inc: { balance: deposit.amount } },
        { new: true }
      );

      // ✅ REFERRAL LOGIC — Step 1: deposit হয়েছে, flag set করো
      // Point এখনই দেওয়া হবে না — B যখন match join করবে তখন দেওয়া হবে
      if (
        deposit.amount >= REFERRAL_DEPOSIT_MIN &&
        user.referredBy
      ) {
        const referrer = await User.findById(user.referredBy);
        if (referrer) {
          const refEntry = referrer.referralHistory.find(
            (r) => r.userId.toString() === user._id.toString()
          );

          // শুধু প্রথমবার deposit flag set করো
          if (refEntry && !refEntry.deposited) {
            refEntry.deposited = true;
            await referrer.save();
            console.log(
              `💰 [Referral] ${user.name} ৳${deposit.amount} deposit করেছে → deposited=true (match entry pending)`
            );
          }
        }
      }

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

// ─── REFERRAL INFO ────────────────────────────────────────────────
router.get("/referral/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate(
      "referralHistory.userId",
      "name phone"
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "User পাওয়া যায়নি" });
    }

    res.json({
      success: true,
      data: {
        referralCode:    user.referralCode,
        referralPoints:  user.referralPoints,
        referralCount:   user.referralCount,
        referralHistory: user.referralHistory,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── REFERRAL POINTS → BALANCE CONVERT ───────────────────────────
router.post("/referral/convert", async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User পাওয়া যায়নি" });
    }

    const currentPoints = user.referralPoints || 0;

    // ✅ Minimum 20 points check
    if (currentPoints < MIN_CONVERT_POINTS) {
      return res.json({
        success: false,
        message: `Minimum ${MIN_CONVERT_POINTS} points লাগবে। আপনার আছে ${currentPoints} points`,
      });
    }

    // ✅ 1 point = 1 টাকা — সব points একসাথে convert
    const taka = currentPoints; // 1:1 ratio

    user.referralPoints = 0;
    user.balance = (user.balance || 0) + taka;
    await user.save();

    console.log(`💸 [Convert] ${user.name}: ${currentPoints} points → ৳${taka}`);

    res.json({
      success: true,
      message: `✅ ${currentPoints} points → ৳${taka} balance এ convert হয়েছে!`,
      newBalance: user.balance,
      remainingPoints: 0,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;