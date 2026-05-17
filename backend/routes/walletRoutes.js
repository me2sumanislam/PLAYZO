 const express = require("express");
const router  = express.Router();
const Deposit = require("../models/Deposit");
const User    = require("../models/User");

const REFERRAL_DEPOSIT_MIN  = 50;   // ৳50 deposit করতে হবে
const POINTS_PER_REFERRAL   = 5;    // প্রতি refer = 5 points
const POINTS_TO_CONVERT     = 100;  // minimum 100 points লাগবে
const TAKA_PER_100_POINTS   = 100;  // 100 points = ৳100

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

      // ✅ Referral point check
      if (deposit.amount >= REFERRAL_DEPOSIT_MIN && user.referredBy) {
        const referrer = await User.findById(user.referredBy);
        if (referrer) {
          // এই user কি আগে point দিয়েছে?
          const refEntry = referrer.referralHistory.find(
            (r) => r.userId.toString() === user._id.toString()
          );
          if (refEntry && !refEntry.pointGiven) {
            refEntry.deposited  = true;
            refEntry.pointGiven = true;
            referrer.referralPoints += POINTS_PER_REFERRAL;
            await referrer.save();
            console.log(`🎯 ${referrer.name} got ${POINTS_PER_REFERRAL} referral points`);
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

// ================= REFERRAL POINTS → BALANCE CONVERT =================
router.post("/referral/convert", async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User পাওয়া যায়নি" });
    }

    if (user.referralPoints < POINTS_TO_CONVERT) {
      return res.json({
        success: false,
        message: `Minimum ${POINTS_TO_CONVERT} points লাগবে। আপনার আছে ${user.referralPoints} points`,
      });
    }

    // ✅ 100 points = ৳100
    const convertablePoints = Math.floor(user.referralPoints / POINTS_TO_CONVERT) * POINTS_TO_CONVERT;
    const taka = (convertablePoints / POINTS_TO_CONVERT) * TAKA_PER_100_POINTS;

    user.referralPoints -= convertablePoints;
    user.balance        += taka;
    await user.save();

    res.json({
      success: true,
      message: `✅ ${convertablePoints} points → ৳${taka} balance এ convert হয়েছে!`,
      newBalance: user.balance,
      remainingPoints: user.referralPoints,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ================= REFERRAL INFO =================
router.get("/referral/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate("referralHistory.userId", "name phone");

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

module.exports = router;