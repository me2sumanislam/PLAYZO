 // ============================================================
// routes/admin.js  — Express Router
// ============================================================

const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const Deposit = require("../models/Deposit");
const Withdraw = require("../models/Withdraw");
const Match = require("../models/Match");
const ActivityLog = require("../models/ActivityLog");
const PaymentNumber = require("../models/PaymentNumber");

const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

// ─── AUTH MIDDLEWARE ─────────────────────────────────────────
const authAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ success: false, message: "No token" });
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user || user.role !== "admin") {
      return res.status(401).json({ success: false, message: "Admin not found" });
    }
    req.admin = user;
    next();
  } catch {
    res.status(401).json({ success: false, message: "Invalid token" });
  }
};

// ─── LOG HELPER ──────────────────────────────────────────────
const log = (adminName, action, target, type) =>
  ActivityLog.create({ adminName, action, target, type }).catch(() => {});

// ════════════════════════════════════════════════════════════
// AUTH
// ════════════════════════════════════════════════════════════

router.post("/login", async (req, res) => {
  try {
    const { phone, password } = req.body;
    const user = await User.findOne({ phone });
    if (!user) return res.json({ success: false, message: "Admin not found" });
    if (user.role !== "admin") return res.json({ success: false, message: "Not an admin" });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.json({ success: false, message: "Wrong password" });
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ success: true, token, admin: { name: user.name, role: user.role, _id: user._id } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ════════════════════════════════════════════════════════════
// STATS
// ════════════════════════════════════════════════════════════

router.get("/stats", authAdmin, async (req, res) => {
  try {
    const [
      totalDeposit, totalWithdraw,
      pendingDepositAmount, pendingWithdrawAmount,
      pendingDeposit, pendingWithdraw,
      totalUsers, totalMatches,
    ] = await Promise.all([
      Deposit.aggregate([{ $match: { status: "approved" } }, { $group: { _id: null, sum: { $sum: "$amount" } } }]),
      Withdraw.aggregate([{ $match: { status: "approved" } }, { $group: { _id: null, sum: { $sum: "$amount" } } }]),
      Deposit.aggregate([{ $match: { status: "pending" } }, { $group: { _id: null, sum: { $sum: "$amount" } } }]),
      Withdraw.aggregate([{ $match: { status: "pending" } }, { $group: { _id: null, sum: { $sum: "$amount" } } }]),
      Deposit.countDocuments({ status: "pending" }),
      Withdraw.countDocuments({ status: "pending" }),
      User.countDocuments(),
      Match.countDocuments(),
    ]);
    res.json({
      success: true,
      data: {
        totalDeposit: totalDeposit[0]?.sum || 0,
        totalWithdraw: totalWithdraw[0]?.sum || 0,
        pendingDepositAmount: pendingDepositAmount[0]?.sum || 0,
        pendingWithdrawAmount: pendingWithdrawAmount[0]?.sum || 0,
        pendingDeposit, pendingWithdraw, totalUsers, totalMatches,
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ════════════════════════════════════════════════════════════
// DEPOSITS
// ════════════════════════════════════════════════════════════

router.get("/deposits", authAdmin, async (req, res) => {
  try {
    const { status, limit = 50 } = req.query;
    const query = status && status !== "all" ? { status } : {};
    const data = await Deposit.find(query)
      .populate("userId", "name phone")
      .sort({ createdAt: -1 })
      .limit(Number(limit));
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.put("/deposits/:id/approve", authAdmin, async (req, res) => {
  try {
    const dep = await Deposit.findById(req.params.id).populate("userId");
    if (!dep) return res.json({ success: false, message: "Not found" });
    if (dep.status !== "pending") return res.json({ success: false, message: "Already processed" });
    dep.status = "approved";
    dep.approvedBy = req.admin.name;
    dep.updatedAt = new Date();
    await dep.save();
    await User.findByIdAndUpdate(dep.userId._id, {
      $inc: { balance: dep.amount, totalDeposit: dep.amount },
    });
    log(req.admin.name, `approved deposit of ৳${dep.amount}`, dep.userId?.name, "approve");
    res.json({ success: true, message: "Deposit approved" });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.put("/deposits/:id/reject", authAdmin, async (req, res) => {
  try {
    const dep = await Deposit.findByIdAndUpdate(
      req.params.id,
      { status: "rejected", rejectedBy: req.admin.name, updatedAt: new Date() },
      { new: true }
    ).populate("userId");
    log(req.admin.name, `rejected deposit of ৳${dep.amount}`, dep.userId?.name, "reject");
    res.json({ success: true, message: "Deposit rejected" });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ════════════════════════════════════════════════════════════
// WITHDRAWALS
// ════════════════════════════════════════════════════════════

router.get("/withdraws", authAdmin, async (req, res) => {
  try {
    const { status, limit = 50 } = req.query;
    const query = status && status !== "all" ? { status } : {};
    const data = await Withdraw.find(query)
      .populate("userId", "name phone")
      .sort({ createdAt: -1 })
      .limit(Number(limit));
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.put("/withdraws/:id/approve", authAdmin, async (req, res) => {
  try {
    const wit = await Withdraw.findById(req.params.id).populate("userId");
    if (!wit) return res.json({ success: false, message: "Not found" });
    if (wit.status !== "pending") return res.json({ success: false, message: "Already processed" });
    const user = await User.findById(wit.userId._id);
    if (user.balance < wit.amount) return res.json({ success: false, message: "Insufficient balance" });
    wit.status = "approved";
    wit.approvedBy = req.admin.name;
    wit.updatedAt = new Date();
    await wit.save();
    await User.findByIdAndUpdate(wit.userId._id, {
      $inc: { balance: -wit.amount, totalWithdraw: wit.amount },
    });
    log(req.admin.name, `approved withdraw of ৳${wit.amount}`, wit.userId?.name, "approve");
    res.json({ success: true, message: "Withdraw approved" });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.put("/withdraws/:id/reject", authAdmin, async (req, res) => {
  try {
    const wit = await Withdraw.findByIdAndUpdate(
      req.params.id,
      { status: "rejected", rejectedBy: req.admin.name, updatedAt: new Date() },
      { new: true }
    ).populate("userId");
    log(req.admin.name, `rejected withdraw of ৳${wit.amount}`, wit.userId?.name, "reject");
    res.json({ success: true, message: "Withdraw rejected" });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ════════════════════════════════════════════════════════════
// USERS
// ════════════════════════════════════════════════════════════

router.get("/users", authAdmin, async (req, res) => {
  try {
    const data = await User.find({}, "name phone balance totalDeposit totalWithdraw banned").sort({ createdAt: -1 });
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.put("/users/:id/ban", authAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { banned: true }, { new: true });
    log(req.admin.name, "banned user", user.name, "ban");
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.put("/users/:id/unban", authAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { banned: false }, { new: true });
    log(req.admin.name, "unbanned user", user.name, "ban");
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ════════════════════════════════════════════════════════════
// MATCH RESULT
// ════════════════════════════════════════════════════════════

router.put("/matches/:id/result", authAdmin, async (req, res) => {
  try {
    const { winner } = req.body;
    const match = await Match.findById(req.params.id);
    if (!match) return res.json({ success: false, message: "Match not found" });
    const user = await User.findOne({ $or: [{ _id: winner }, { name: winner }] });
    if (!user) return res.json({ success: false, message: "Winner not found" });
    match.status = "ended";
    match.winner = user._id;
    await match.save();
    await User.findByIdAndUpdate(user._id, { $inc: { balance: match.winPrize } });
    log(req.admin.name, `set winner: ${user.name}, prize ৳${match.winPrize}`, match.title, "create");
    res.json({ success: true, message: `Prize ৳${match.winPrize} sent to ${user.name}` });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ════════════════════════════════════════════════════════════
// ACTIVITY LOG
// ════════════════════════════════════════════════════════════

router.get("/logs", authAdmin, async (req, res) => {
  try {
    const data = await ActivityLog.find().sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ════════════════════════════════════════════════════════════
// ADMIN MANAGEMENT
// ════════════════════════════════════════════════════════════

router.get("/admins", authAdmin, async (req, res) => {
  try {
    const data = await User.find({ role: "admin" }, "name phone role createdAt").sort({ createdAt: -1 });
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.post("/admins/create", authAdmin, async (req, res) => {
  try {
    const { name, phone, password } = req.body;
    const exists = await User.findOne({ phone });
    if (exists) return res.json({ success: false, message: "Phone already registered" });
    const hash = await bcrypt.hash(password, 10);
    const admin = await User.create({ name, phone, password: hash, role: "admin" });
    log(req.admin.name, `created admin: ${name}`, phone, "create");
    res.json({ success: true, admin: { name: admin.name, phone: admin.phone, role: admin.role } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ════════════════════════════════════════════════════════════
// PAYMENT NUMBERS
// ════════════════════════════════════════════════════════════

router.get("/payment-numbers", authAdmin, async (req, res) => {
  try {
    const data = await PaymentNumber.find().sort({ createdAt: -1 });
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.post("/payment-numbers", authAdmin, async (req, res) => {
  try {
    const { method, number, limit, active } = req.body;
    if (!method || !number) return res.json({ success: false, message: "method ও number দিন" });
    const entry = await PaymentNumber.create({ method, number, limit: limit || null, active: active !== false });
    log(req.admin.name, `added payment number ${number}`, method, "create");
    res.json({ success: true, data: entry });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.patch("/payment-numbers/:id", authAdmin, async (req, res) => {
  try {
    const updated = await PaymentNumber.findByIdAndUpdate(req.params.id, req.body, { new: true });
    log(req.admin.name, `updated payment number ${updated.number}`, updated.method, "create");
    res.json({ success: true, data: updated });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.delete("/payment-numbers/:id", authAdmin, async (req, res) => {
  try {
    const deleted = await PaymentNumber.findByIdAndDelete(req.params.id);
    log(req.admin.name, `deleted payment number ${deleted.number}`, deleted.method, "reject");
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;