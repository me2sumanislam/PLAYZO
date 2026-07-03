 // routes/walletRoutes.js

const express = require("express");
const router  = express.Router();
const Deposit = require("../models/Deposit");
const User    = require("../models/User");
const { isDuplicateTrx } = require("../utils/referralFraud");

// ── Referral / Gem Constants ────────────────────────────────────
const REFERRAL_DEPOSIT_MIN = 50;   // B কে ন্যূনতম ৳৫০ deposit করতে হবে referral qualify করতে

// ✅ Deposit amount অনুযায়ী কত gem পাবে (tier)
function calcGemTier(amount) {
  if (amount >= 100) return 10;
  if (amount >= REFERRAL_DEPOSIT_MIN) return 5;
  return 0;
}

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

    // ✅ Fraud check: একই trxId আগে অন্য কোনো approved deposit এ ব্যবহার হয়েছে কিনা
    if (await isDuplicateTrx(deposit.trxId, deposit._id)) {
      return res.status(400).json({
        success: false,
        message: "⚠️ এই Transaction ID আগে অন্য একটি deposit এ ব্যবহার হয়েছে — manually verify করুন",
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

      // ✅ REFERRAL GEM LOGIC — Step 1: deposit হয়েছে, gemsPending set করো
      // Gem এখনই credit হবে না — B যখন প্রথমবার match join করবে তখন credit হবে
      const gemTier = calcGemTier(deposit.amount);
      if (gemTier > 0 && user.referredBy) {
        const referrer = await User.findById(user.referredBy);
        if (referrer) {
          const refEntry = referrer.referralHistory.find(
            (r) => r.userId.toString() === user._id.toString()
          );

          // শুধু প্রথমবার deposit flag + gemsPending set করো
          if (refEntry && !refEntry.deposited) {
            refEntry.deposited = true;
            refEntry.depositAmount = deposit.amount;
            refEntry.gemsPending = gemTier;
            await referrer.save();
            console.log(
              `💰 [Referral] ${user.name} ৳${deposit.amount} deposit করেছে → ${gemTier} gem pending (match join এর অপেক্ষায়)`
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
        gems:            user.gems || 0,
        referralCount:   user.referralCount,
        referralHistory: user.referralHistory,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ⚠️ NOTE: "/referral/convert" route ইচ্ছাকৃতভাবে বাদ দেওয়া হয়েছে।
// Gem কখনো taka তে convert করা যাবে না — এটাই নতুন system এর মূল নিয়ম।

module.exports = router;