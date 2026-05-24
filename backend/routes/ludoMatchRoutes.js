 const express = require("express");
 const router = express.Router();
 const LudoMatch = require("../models/LudoMatch");
 const User = require("../models/User");
 const jwt = require("jsonwebtoken");
 
 // ================= ADMIN MIDDLEWARE =================
 const protectAdmin = (req, res, next) => {
   try {
     const authHeader = req.headers.authorization;
     if (!authHeader) return res.json({ success: false, message: "No token found" });
     const token = authHeader.split(" ")[1];
     const decoded = jwt.verify(token, process.env.JWT_SECRET);
     if (decoded.role !== "admin" && decoded.role !== "super-admin") {
       return res.json({ success: false, message: "Admin only access" });
     }
     req.user = decoded;
     next();
   } catch (err) {
     return res.json({ success: false, message: "Invalid token: " + err.message });
   }
 };
 
 // ================= CREATE LUDO MATCH =================
 router.post("/create", protectAdmin, async (req, res) => {
   try {
     const { startTime, ...rest } = req.body;
     const expiresAt = startTime
       ? new Date(new Date(startTime).getTime() + 20 * 60 * 1000)
       : new Date(Date.now() + 20 * 60 * 1000);
 
     const match = await LudoMatch.create({
       ...rest,
       startTime,
       expiresAt,
       joinedPlayers: 0,
       status: "upcoming",
     });
 
     res.status(201).json({ success: true, message: "Ludo match created", data: match });
   } catch (err) {
     res.status(500).json({ success: false, message: err.message });
   }
 });
 
 // ================= GET ALL LUDO MATCHES =================
 router.get("/", async (req, res) => {
   try {
     const matches = await LudoMatch.find().sort({ createdAt: -1 });
     res.json({ success: true, data: matches });
   } catch (err) {
     res.status(500).json({ success: false, message: err.message });
   }
 });
 
 // ================= GET MY LUDO MATCHES =================
 router.get("/my-matches", async (req, res) => {
   try {
     const { userId } = req.query;
     if (!userId) return res.status(400).json({ success: false, message: "userId required" });
     const matches = await LudoMatch.find({ "joinedUsers.userId": userId }).sort({ createdAt: -1 });
     res.json({ success: true, data: matches });
   } catch (err) {
     res.status(500).json({ success: false, message: err.message });
   }
 });
 
 // ================= GET SINGLE LUDO MATCH =================
 router.get("/:id", async (req, res) => {
   try {
     const match = await LudoMatch.findById(req.params.id);
     res.json({ success: true, data: match });
   } catch (err) {
     res.status(500).json({ success: false, message: err.message });
   }
 });
 
 // ================= UPDATE ROOM CODE =================
 router.put("/update-room/:id", protectAdmin, async (req, res) => {
   try {
     const { roomCode } = req.body;
     const match = await LudoMatch.findByIdAndUpdate(
       req.params.id,
       { roomCode, status: "live", isRoomOpen: true },
       { new: true }
     );
     res.json({ success: true, message: "Room code updated", data: match });
   } catch (err) {
     res.status(500).json({ success: false, message: err.message });
   }
 });
 
 // ================= JOIN LUDO MATCH =================
 router.put("/join/:id", async (req, res) => {
   try {
     const { userId } = req.body;
     const match = await LudoMatch.findById(req.params.id);
 
     if (!match) return res.status(404).json({ success: false, message: "Match not found" });
 
     const alreadyJoined = (match.joinedUsers || []).find(
       (u) => u.userId.toString() === userId.toString()
     );
     if (alreadyJoined) return res.json({ success: false, message: "ইতোমধ্যে join করেছেন" });
     if (match.joinedPlayers >= match.totalPlayers) return res.json({ success: false, message: "Match is full" });
 
     const user = await User.findById(userId);
     if (!user) return res.status(404).json({ success: false, message: "User not found" });
     if (user.balance < match.entryFee) return res.json({ success: false, message: "পর্যাপ্ত balance নেই" });
 
     const usedSlots = (match.joinedUsers || []).map((u) => u.slotNumber);
     let slotNumber = 1;
     while (usedSlots.includes(slotNumber)) slotNumber++;
 
     user.balance -= match.entryFee;
     if (!user.joinHistory) user.joinHistory = [];
     user.joinHistory.push({ matchId: match._id, matchTitle: match.title, entryFee: match.entryFee, joinedAt: new Date() });
     await user.save();
 
     if (!match.joinedUsers) match.joinedUsers = [];
     match.joinedUsers.push({ userId, slotNumber });
     match.joinedPlayers = match.joinedUsers.length;
     await match.save();
 
     res.json({ success: true, message: "Join সফল হয়েছে", newBalance: user.balance, slotNumber, data: match });
   } catch (err) {
     res.status(500).json({ success: false, message: err.message });
   }
 });
 
 module.exports = router;
 