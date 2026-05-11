 const express = require("express");
 const router = express.Router();
 const bcrypt = require("bcryptjs");
 const jwt = require("jsonwebtoken");
 
 const User = require("../models/User");
 const Deposit = require("../models/Deposit");
 const Withdraw = require("../models/withdraw");
 const Match = require("../models/Match");
 const ActivityLog = require("../models/ActivityLog");
 const PaymentNumber = require("../models/PaymentNumber");
 
 const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";
 const ADMIN_ROLES = ["admin", "super-admin", "finance"];
 
 // ─── AUTH MIDDLEWARE ─────────────────────────────────────────
 const authAdmin = async (req, res, next) => {
   try {
     const token = req.headers.authorization?.split(" ")[1];
     if (!token) return res.status(401).json({ success: false, message: "No token" });
     const decoded = jwt.verify(token, JWT_SECRET);
     const user = await User.findById(decoded.id);
     if (!user || !ADMIN_ROLES.includes(user.role)) {
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
 // STATS
 // ════════════════════════════════════════════════════════════
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
 
 router.put("/deposits/:id/approve", authAdmin, async (req, res) => {
   try {
     const dep = await Deposit.findById(req.params.id).populate("user");
     if (!dep) return res.json({ success: false, message: "Not found" });
     if (dep.status !== "pending") return res.json({ success: false, message: "Already processed" });
 
     dep.status = "approved";
     dep.approvedBy = req.admin.name;
     await dep.save();
 
     await User.findByIdAndUpdate(dep.user._id, {
       $inc: { balance: dep.amount, totalDeposit: dep.amount },
     });
 
     log(req.admin.name, `approved deposit of ৳${dep.amount}`, dep.user.name, "approve");
     res.json({ success: true, message: "Deposit approved" });
   } catch (e) {
     res.status(500).json({ success: false, message: e.message });
   }
 });
 
 router.put("/deposits/:id/reject", authAdmin, async (req, res) => {
   try {
     const dep = await Deposit.findByIdAndUpdate(
       req.params.id,
       { status: "rejected", rejectedBy: req.admin.name },
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
 
 router.put("/withdraws/:id/approve", authAdmin, async (req, res) => {
   try {
     const wit = await Withdraw.findById(req.params.id).populate("user");
     if (!wit) return res.json({ success: false, message: "Not found" });
     if (wit.status !== "pending") return res.json({ success: false, message: "Already processed" });
 
     const user = await User.findById(wit.user._id);
     if (user.balance < wit.amount) return res.json({ success: false, message: "User has insufficient balance" });
 
     wit.status = "approved";
     wit.approvedBy = req.admin.name;
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
 
 router.put("/withdraws/:id/reject", authAdmin, async (req, res) => {
   try {
     const wit = await Withdraw.findByIdAndUpdate(
       req.params.id,
       { status: "rejected", rejectedBy: req.admin.name },
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
 
 router.put("/payment-numbers/:id", authAdmin, async (req, res) => {
   try {
     const updated = await PaymentNumber.findByIdAndUpdate(
       req.params.id,
       { ...req.body },
       { new: true }
     );
     if (!updated) return res.json({ success: false, message: "Not found" });
     log(req.admin.name, `updated payment number ${updated.number}`, updated.method, "create");
     res.json({ success: true, data: updated });
   } catch (e) {
     res.status(500).json({ success: false, message: e.message });
   }
 });
 
 router.delete("/payment-numbers/:id", authAdmin, async (req, res) => {
   try {
     const deleted = await PaymentNumber.findByIdAndDelete(req.params.id);
     if (!deleted) return res.json({ success: false, message: "Not found" });
     log(req.admin.name, `deleted payment number ${deleted.number}`, deleted.method, "reject");
     res.json({ success: true });
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
 
 module.exports = router;
 