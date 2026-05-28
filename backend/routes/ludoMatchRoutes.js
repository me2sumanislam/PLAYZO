 // routes/ludoTournamentRoutes.js
const express = require("express");
const router  = express.Router();
const LudoTournament = require("../models/LudoTournament");
const User    = require("../models/User");
const jwt     = require("jsonwebtoken");

// ✅ Notification
const notificationRouter = require("./notifications");

// ─── ADMIN MIDDLEWARE ──────────────────────────────────────────
const protectAdmin = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.json({ success: false, message: "No token" });
    const token   = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!["admin","super-admin"].includes(decoded.role)) {
      return res.json({ success: false, message: "Admin only" });
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.json({ success: false, message: "Invalid token: " + err.message });
  }
};

// ─── HELPERS ──────────────────────────────────────────────────
const slotsForMode = (mode) => {
  if (mode === "1v1")     return 2;
  if (mode === "2v2")     return 4;
  if (mode === "4player") return 4;
  return 4;
};

// ════════════════════════════════════════════════════════════
// ADMIN: CREATE LUDO TOURNAMENT
// POST /api/ludo-tournament/create
// ════════════════════════════════════════════════════════════
router.post("/create", protectAdmin, async (req, res) => {
  try {
    const { startTime, mode, ...rest } = req.body;
    const expiresAt = startTime
      ? new Date(new Date(startTime).getTime() + 20 * 60 * 1000)
      : new Date(Date.now() + 20 * 60 * 1000);

    const totalSlots = slotsForMode(mode || "4player");

    const match = await LudoTournament.create({
      ...rest,
      mode: mode || "4player",
      startTime,
      expiresAt,
      totalSlots,
      joinedPlayers: 0,
      status: "upcoming",
    });

    // ✅ Ludo notification পাঠাও
    notificationRouter.sendMatchNotification(match, "ludo");

    res.status(201).json({ success: true, message: "Ludo tournament created", data: match });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ════════════════════════════════════════════════════════════
// GET ALL (public)
// GET /api/ludo-tournament
// ════════════════════════════════════════════════════════════
router.get("/", async (req, res) => {
  try {
    const { mode, status } = req.query;
    const filter = {};
    if (mode)   filter.mode   = mode;
    if (status) filter.status = status;
    const matches = await LudoTournament.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: matches });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ════════════════════════════════════════════════════════════
// GET MY MATCHES (by userId query param)
// GET /api/ludo-tournament/my-matches?userId=xxx
// ════════════════════════════════════════════════════════════
router.get("/my-matches", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ success: false, message: "userId required" });
    const matches = await LudoTournament
      .find({ "joinedUsers.userId": userId })
      .sort({ createdAt: -1 });
    res.json({ success: true, data: matches });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ════════════════════════════════════════════════════════════
// GET SINGLE
// GET /api/ludo-tournament/:id
// ════════════════════════════════════════════════════════════
router.get("/:id", async (req, res) => {
  try {
    const match = await LudoTournament.findById(req.params.id)
      .populate("joinedUsers.userId", "name phone inGameName");
    if (!match) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: match });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ════════════════════════════════════════════════════════════
// ADMIN: UPDATE ROOM CODE & SET LIVE
// PUT /api/ludo-tournament/update-room/:id
// ════════════════════════════════════════════════════════════
router.put("/update-room/:id", protectAdmin, async (req, res) => {
  try {
    const { roomCode } = req.body;
    const match = await LudoTournament.findByIdAndUpdate(
      req.params.id,
      { roomCode, status: "live", isRoomOpen: true },
      { new: true }
    );
    res.json({ success: true, message: "Room code updated, match is now LIVE", data: match });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ════════════════════════════════════════════════════════════
// USER: JOIN TOURNAMENT
// PUT /api/ludo-tournament/join/:id
// body: { userId }
// ════════════════════════════════════════════════════════════
router.put("/join/:id", async (req, res) => {
  try {
    const { userId } = req.body;
    const match = await LudoTournament.findById(req.params.id);
    if (!match) return res.status(404).json({ success: false, message: "Match not found" });
    if (match.status === "completed" || match.status === "cancelled") {
      return res.json({ success: false, message: "Match আর join করা যাবে না" });
    }

    const already = (match.joinedUsers || []).find(
      (u) => u.userId?.toString() === userId?.toString()
    );
    if (already) return res.json({ success: false, message: "ইতোমধ্যে join করেছেন" });

    if (match.joinedPlayers >= match.totalSlots) {
      return res.json({ success: false, message: "Match ফুল হয়ে গেছে" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    if (user.balance < match.entryFee) {
      return res.json({ success: false, message: "পর্যাপ্ত balance নেই" });
    }

    const usedSlots = (match.joinedUsers || []).map((u) => u.slotNumber);
    let slot = 1;
    while (usedSlots.includes(slot)) slot++;

    user.balance -= match.entryFee;
    if (!user.joinHistory) user.joinHistory = [];
    user.joinHistory.push({
      matchId: match._id,
      matchTitle: match.title,
      entryFee: match.entryFee,
      joinedAt: new Date(),
      gameType: "ludo",
    });
    await user.save();

    if (!match.joinedUsers) match.joinedUsers = [];
    match.joinedUsers.push({ userId, slotNumber: slot });
    match.joinedPlayers = match.joinedUsers.length;

    if (match.joinedPlayers >= match.totalSlots) {
      match.status = "live";
    }

    await match.save();

    res.json({
      success: true,
      message: "Join সফল! 🎉",
      newBalance: user.balance,
      slotNumber: slot,
      data: match,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ════════════════════════════════════════════════════════════
// ADMIN: SUBMIT RESULT & DISTRIBUTE PRIZE
// POST /api/ludo-tournament/result/:id
// body: { results: [{ userId, rank, prize, kills }] }
// ════════════════════════════════════════════════════════════
router.post("/result/:id", protectAdmin, async (req, res) => {
  try {
    const { results } = req.body;
    const match = await LudoTournament.findById(req.params.id);
    if (!match) return res.status(404).json({ success: false, message: "Match not found" });

    match.results  = results;
    match.status   = "completed";
    await match.save();

    for (const r of results) {
      if (r.userId && r.prize > 0) {
        await User.findByIdAndUpdate(r.userId, {
          $inc: { balance: r.prize },
          $push: {
            transactions: {
              type: "match_prize",
              amount: r.prize,
              matchId: match._id,
              description: `${match.title} (Ludo ${match.mode}) - Rank #${r.rank} Prize`,
            },
          },
        });
      }
    }

    res.json({ success: true, message: "Result submitted & prizes distributed ✅", data: match });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ════════════════════════════════════════════════════════════
// ADMIN: DELETE
// DELETE /api/ludo-tournament/:id
// ════════════════════════════════════════════════════════════
router.delete("/:id", protectAdmin, async (req, res) => {
  try {
    await LudoTournament.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Match deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ════════════════════════════════════════════════════════════
// ADMIN: UPDATE MATCH
// PUT /api/ludo-tournament/:id
// ════════════════════════════════════════════════════════════
router.put("/:id", protectAdmin, async (req, res) => {
  try {
    const match = await LudoTournament.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true }
    );
    res.json({ success: true, data: match });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;