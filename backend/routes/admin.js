 // ============================================================
// routes/admin.js  — Express Router
// ============================================================
// npm install express mongoose bcryptjs jsonwebtoken
// ============================================================

const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Admin = require("../models/Admin");
const User = require("../models/User");
const Deposit = require("../models/Deposit");
const Withdraw = require("../models/Withdraw");
const Match = require("../models/Match");
const ActivityLog = require("../models/ActivityLog");

const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

// ─── AUTH MIDDLEWARE ─────────────────────────────────────────
const authAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ success: false, message: "No token" });
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = await Admin.findById(decoded.id);
    if (!req.admin) return res.status(401).json({ success: false, message: "Admin not found" });
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

// POST /api/admin/login
router.post("/login", async (req, res) => {
  try {
    const { phone, password } = req.body;
    const admin = await Admin.findOne({ phone });
    if (!admin) return res.json({ success: false, message: "Admin not found" });
    const ok = await bcrypt.compare(password, admin.password);
    if (!ok) return res.json({ success: false, message: "Wrong password" });
    const token = jwt.sign({ id: admin._id }, JWT_SECRET, { expiresIn: "7d" });
    log(admin.name, "logged in", "", "login");
    res.json({ success: true, token, admin: { name: admin.name, role: admin.role, _id: admin._id } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ════════════════════════════════════════════════════════════
// STATS (Dashboard + Money overview)
// ════════════════════════════════════════════════════════════

// GET /api/admin/stats
router.get("/stats", authAdmin, async (req, res) => {
  try {
    const [
      totalDeposit,
      totalWithdraw,
      pendingDepositAmount,
      pendingWithdrawAmount,
      pendingDeposit,
      pendingWithdraw,
      totalUsers,
      totalMatches,
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
        pendingDeposit,
        pendingWithdraw,
        totalUsers,
        totalMatches,
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ════════════════════════════════════════════════════════════
// DEPOSITS
// ════════════════════════════════════════════════════════════

// GET /api/admin/deposits?status=pending&limit=50
router.get("/deposits", authAdmin, async (req, res) => {
  try {
    const { status, limit = 50 } = req.query;
    const query = status && status !== "all" ? { status } : {};
    const data = await Deposit.find(query)
      .populate("user", "name phone")
      .sort({ createdAt: -1 })
      .limit(Number(limit));
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// PUT /api/admin/deposits/:id/approve
router.put("/deposits/:id/approve", authAdmin, async (req, res) => {
  try {
    const dep = await Deposit.findById(req.params.id).populate("user");
    if (!dep) return res.json({ success: false, message: "Not found" });
    if (dep.status !== "pending") return res.json({ success: false, message: "Already processed" });

    dep.status = "approved";
    dep.approvedBy = req.admin.name;
    dep.updatedAt = new Date();
    await dep.save();

    // Add balance to user
    await User.findByIdAndUpdate(dep.user._id, {
      $inc: { balance: dep.amount, totalDeposit: dep.amount },
    });

    log(req.admin.name, `approved deposit of ৳${dep.amount}`, dep.user.name, "approve");
    res.json({ success: true, message: "Deposit approved" });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// PUT /api/admin/deposits/:id/reject
router.put("/deposits/:id/reject", authAdmin, async (req, res) => {
  try {
    const dep = await Deposit.findByIdAndUpdate(
      req.params.id,
      { status: "rejected", rejectedBy: req.admin.name, updatedAt: new Date() },
      { new: true }
    ).populate("user");
    log(req.admin.name, `rejected deposit of ৳${dep.amount}`, dep.user.name, "reject");
    res.json({ success: true, message: "Deposit rejected" });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ════════════════════════════════════════════════════════════
// WITHDRAWALS
// ════════════════════════════════════════════════════════════

// GET /api/admin/withdraws?status=pending&limit=50
router.get("/withdraws", authAdmin, async (req, res) => {
  try {
    const { status, limit = 50 } = req.query;
    const query = status && status !== "all" ? { status } : {};
    const data = await Withdraw.find(query)
      .populate("user", "name phone")
      .sort({ createdAt: -1 })
      .limit(Number(limit));
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// PUT /api/admin/withdraws/:id/approve
router.put("/withdraws/:id/approve", authAdmin, async (req, res) => {
  try {
    const wit = await Withdraw.findById(req.params.id).populate("user");
    if (!wit) return res.json({ success: false, message: "Not found" });
    if (wit.status !== "pending") return res.json({ success: false, message: "Already processed" });

    // Check user balance
    const user = await User.findById(wit.user._id);
    if (user.balance < wit.amount) return res.json({ success: false, message: "User has insufficient balance" });

    wit.status = "approved";
    wit.approvedBy = req.admin.name;
    wit.updatedAt = new Date();
    await wit.save();

    await User.findByIdAndUpdate(wit.user._id, {
      $inc: { balance: -wit.amount, totalWithdraw: wit.amount },
    });

    log(req.admin.name, `approved withdraw of ৳${wit.amount}`, wit.user.name, "approve");
    res.json({ success: true, message: "Withdraw approved & balance deducted" });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// PUT /api/admin/withdraws/:id/reject
router.put("/withdraws/:id/reject", authAdmin, async (req, res) => {
  try {
    const wit = await Withdraw.findByIdAndUpdate(
      req.params.id,
      { status: "rejected", rejectedBy: req.admin.name, updatedAt: new Date() },
      { new: true }
    ).populate("user");
    log(req.admin.name, `rejected withdraw of ৳${wit.amount}`, wit.user.name, "reject");
    res.json({ success: true, message: "Withdraw rejected" });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ════════════════════════════════════════════════════════════
// USERS
// ════════════════════════════════════════════════════════════

// GET /api/admin/users
router.get("/users", authAdmin, async (req, res) => {
  try {
    const data = await User.find({}, "name phone balance totalDeposit totalWithdraw banned").sort({ createdAt: -1 });
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// PUT /api/admin/users/:id/ban
router.put("/users/:id/ban", authAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { banned: true }, { new: true });
    log(req.admin.name, "banned user", user.name, "ban");
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// PUT /api/admin/users/:id/unban
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

// PUT /api/admin/matches/:id/result
router.put("/matches/:id/result", authAdmin, async (req, res) => {
  try {
    const { winner } = req.body; // user _id or name
    const match = await Match.findById(req.params.id);
    if (!match) return res.json({ success: false, message: "Match not found" });

    // Find winner user
    const user = await User.findOne({ $or: [{ _id: winner }, { name: winner }] });
    if (!user) return res.json({ success: false, message: "Winner user not found" });

    match.status = "ended";
    match.winner = user._id;
    await match.save();

    // Give prize
    await User.findByIdAndUpdate(user._id, { $inc: { balance: match.winPrize } });

    log(req.admin.name, `set match result, winner: ${user.name}, prize ৳${match.winPrize}`, match.title, "create");
    res.json({ success: true, message: `Prize ৳${match.winPrize} sent to ${user.name}` });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ════════════════════════════════════════════════════════════
// ACTIVITY LOG
// ════════════════════════════════════════════════════════════

// GET /api/admin/logs
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

// GET /api/admin/admins
router.get("/admins", authAdmin, async (req, res) => {
  try {
    const data = await Admin.find({}, "name phone role createdAt").sort({ createdAt: -1 });
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST /api/admin/admins/create
router.post("/admins/create", authAdmin, async (req, res) => {
  try {
    if (req.admin.role !== "super-admin") return res.json({ success: false, message: "Only super admin can create admins" });
    const { name, phone, password, role } = req.body;
    const exists = await Admin.findOne({ phone });
    if (exists) return res.json({ success: false, message: "Phone already registered" });
    const hash = await bcrypt.hash(password, 10);
    const admin = await Admin.create({ name, phone, password: hash, role });
    log(req.admin.name, `created new admin: ${name}`, phone, "create");
    res.json({ success: true, admin: { name: admin.name, phone: admin.phone, role: admin.role } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
