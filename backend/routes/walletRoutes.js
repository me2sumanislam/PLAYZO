 // routes/walletRoutes.js
const express = require("express");
const router  = express.Router();
const Deposit             = require("../models/Deposit");
const User                = require("../models/User");
const PointConvertRequest = require("../models/PointConvertRequest");

const REFERRAL_DEPOSIT_MIN = 50;   // ৳50+ deposit করলে point পাবে
const POINTS_PER_REFERRAL  = 5;    // প্রতি refer = 5 points
const POINTS_TO_CONVERT    = 100;  // minimum 100 points লাগবে convert করতে
const TAKA_PER_100_POINTS  = 100;  // 100 points = ৳100

// ===================== DEPOSIT =====================
router.post("/deposit", async (req, res) => {
  try {
    const { method, amount, trxId, userId, paymentNumber } = req.body;
    if (!method || !amount || !trxId) {
      return res.status(400).json({ success: false, message: "method, amount এবং trxId দিন" });
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

// ===================== DEPOSIT APPROVE / REJECT =====================
router.patch("/deposit/:id", async (req, res) => {
  try {
    const { status } = req.body;
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "status হবে 'approved' অথবা 'rejected'" });
    }

    const deposit = await Deposit.findById(req.params.id);
    if (!deposit) return res.status(404).json({ success: false, message: "Deposit পাওয়া যায়নি" });
    if (deposit.status !== "pending") {
      return res.status(400).json({ success: false, message: "এই request আগেই process হয়ে গেছে" });
    }

    deposit.status = status;
    await deposit.save();

    if (status === "approved" && deposit.userId) {
      const user = await User.findByIdAndUpdate(
        deposit.userId,
        { $inc: { balance: deposit.amount } },
        { new: true }
      );

      // ✅ Referral point check — B ৳50+ deposit করলে A কে 5 points দাও
      if (deposit.amount >= REFERRAL_DEPOSIT_MIN && user.referredBy) {
        const referrer = await User.findById(user.referredBy);
        if (referrer) {
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

    res.json({ success: true, message: status === "approved" ? "✅ Approved!" : "❌ Rejected", deposit });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ===================== POINT CONVERT — REQUEST তৈরি করো =====================
// আগে সরাসরি balance এ যোগ হতো, এখন admin approval লাগবে
router.post("/referral/convert", async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User পাওয়া যায়নি" });

    if ((user.referralPoints || 0) < POINTS_TO_CONVERT) {
      return res.json({
        success: false,
        message: `কমপক্ষে ${POINTS_TO_CONVERT} points লাগবে। আপনার আছে ${user.referralPoints || 0} points`,
      });
    }

    // ইতোমধ্যে pending request আছে কিনা দেখো
    const existing = await PointConvertRequest.findOne({ userId, status: "pending" });
    if (existing) {
      return res.json({
        success: false,
        message: "আপনার একটি request ইতোমধ্যে pending আছে। Admin approve করার পরে আবার try করুন।",
      });
    }

    // কতো points convert হবে
    const convertablePoints = Math.floor(user.referralPoints / POINTS_TO_CONVERT) * POINTS_TO_CONVERT;
    const taka = (convertablePoints / POINTS_TO_CONVERT) * TAKA_PER_100_POINTS;

    // Points lock করো (balance এ যাবে না এখনই)
    user.referralPoints -= convertablePoints;
    await user.save();

    // Request তৈরি করো
    await PointConvertRequest.create({ userId, points: convertablePoints, taka, status: "pending" });

    res.json({
      success: true,
      message: `✅ ${convertablePoints} points এর জন্য ৳${taka} convert request পাঠানো হয়েছে! Admin approve করলে balance এ যোগ হবে।`,
      remainingPoints: user.referralPoints,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ===================== ADMIN — সব point convert request দেখো =====================
router.get("/referral/convert-requests", async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status && status !== "all" ? { status } : {};
    const requests = await PointConvertRequest.find(filter)
      .sort({ createdAt: -1 })
      .populate("userId", "name phone balance referralPoints");
    res.json({ success: true, requests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ===================== ADMIN — APPROVE point convert request =====================
router.patch("/referral/convert-requests/:id/approve", async (req, res) => {
  try {
    const request = await PointConvertRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: "Request পাওয়া যায়নি" });
    if (request.status !== "pending") {
      return res.status(400).json({ success: false, message: "এই request আগেই process হয়ে গেছে" });
    }

    // Balance যোগ করো
    const user = await User.findByIdAndUpdate(
      request.userId,
      { $inc: { balance: request.taka } },
      { new: true }
    );

    request.status = "approved";
    await request.save();

    res.json({
      success: true,
      message: `✅ ${request.points} points → ৳${request.taka} balance এ যোগ হয়েছে`,
      newBalance: user.balance,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ===================== ADMIN — REJECT point convert request =====================
router.patch("/referral/convert-requests/:id/reject", async (req, res) => {
  try {
    const { adminNote } = req.body;
    const request = await PointConvertRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: "Request পাওয়া যায়নি" });
    if (request.status !== "pending") {
      return res.status(400).json({ success: false, message: "এই request আগেই process হয়ে গেছে" });
    }

    // Points ফেরত দাও
    await User.findByIdAndUpdate(request.userId, { $inc: { referralPoints: request.points } });

    request.status    = "rejected";
    request.adminNote = adminNote || "";
    await request.save();

    res.json({ success: true, message: `❌ Rejected। ${request.points} points ফেরত দেওয়া হয়েছে।` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ===================== REFERRAL INFO =====================
router.get("/referral/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate("referralHistory.userId", "name phone");
    if (!user) return res.status(404).json({ success: false, message: "User পাওয়া যায়নি" });

    // pending request আছে কিনা
    const pendingRequest = await PointConvertRequest.findOne({ userId: req.params.userId, status: "pending" });

    res.json({
      success: true,
      data: {
        referralCode:    user.referralCode,
        referralPoints:  user.referralPoints,
        referralCount:   user.referralCount,
        referralHistory: user.referralHistory,
        hasPendingRequest: !!pendingRequest,  // frontend কে জানাও
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;