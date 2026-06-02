 // routes/ludoMatchRoutes.js
const express = require("express");
const router = express.Router();
const LudoTournament = require("../models/LudoTournament");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

const notificationRouter = require("./notifications");

// Admin Middleware
const protectAdmin = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.json({ success: false, message: "No token" });
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!["admin", "super-admin"].includes(decoded.role)) {
      return res.json({ success: false, message: "Admin only" });
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.json({ success: false, message: "Invalid token" });
  }
};

const slotsForMode = (mode) => {
  if (mode === "1v1") return 2;
  if (mode === "2v2") return 4;
  if (mode === "4player") return 4;
  return 4;
};

// Create Tournament
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

    notificationRouter.sendMatchNotification(match, "ludo");

    res.status(201).json({ success: true, message: "Ludo tournament created", data: match });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Join with In-Game Name
router.put("/join/:id", async (req, res) => {
  try {
    const { userId, inGameName } = req.body;

    if (!userId) return res.json({ success: false, message: "User ID required" });
    if (!inGameName || inGameName.trim() === "") {
      return res.json({ success: false, message: "In-Game Name দিতে হবে" });
    }

    const match = await LudoTournament.findById(req.params.id);
    if (!match) return res.status(404).json({ success: false, message: "Match not found" });

    if (match.status === "completed" || match.status === "cancelled") {
      return res.json({ success: false, message: "Match আর join করা যাবে না" });
    }

    const already = (match.joinedUsers || []).find(u => u.userId?.toString() === userId?.toString());
    if (already) return res.json({ success: false, message: "ইতোমধ্যে join করেছেন" });

    if (match.joinedPlayers >= match.totalSlots) {
      return res.json({ success: false, message: "Match ফুল হয়ে গেছে" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    if (user.balance < match.entryFee) {
      return res.json({ success: false, message: "পর্যাপ্ত balance নেই" });
    }

    const usedSlots = (match.joinedUsers || []).map(u => u.slotNumber);
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
    match.joinedUsers.push({ 
      userId, 
      slotNumber: slot, 
      inGameName: inGameName.trim() 
    });
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
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Submit Result
router.post("/result/:id", protectAdmin, async (req, res) => {
  try {
    const { results, winningTeam } = req.body;
    const match = await LudoTournament.findById(req.params.id);

    if (!match) return res.status(404).json({ success: false, message: "Match not found" });
    if (!Array.isArray(results) || results.length === 0) {
      return res.json({ success: false, message: "Results array is required" });
    }

    if (results.length !== match.joinedPlayers) {
      return res.json({ success: false, message: `Exactly ${match.joinedPlayers} results needed` });
    }

    const ranks = results.map(r => r.rank);
    if (new Set(ranks).size !== ranks.length) {
      return res.json({ success: false, message: "Duplicate ranks not allowed" });
    }

    const sortedRanks = [...ranks].sort((a, b) => a - b);
    for (let i = 0; i < sortedRanks.length; i++) {
      if (sortedRanks[i] !== i + 1) {
        return res.json({ success: false, message: "Ranks must be sequential starting from 1" });
      }
    }

    match.results = results;
    match.status = "completed";
    
    if (match.mode === "2v2" && winningTeam) {
      match.winningTeam = winningTeam;
    }

    await match.save();

    let totalPrizeDistributed = 0;
    for (const r of results) {
      if (r.userId && r.prize > 0) {
        totalPrizeDistributed += r.prize;
        await User.findByIdAndUpdate(r.userId, {
          $inc: { balance: r.prize },
          $push: {
            transactions: {
              type: "match_prize",
              amount: r.prize,
              matchId: match._id,
              description: `${match.title} (${match.mode}) - Rank #${r.rank}`,
            },
          },
        });
      }
    }

    res.json({ 
      success: true, 
      message: "✅ Result submitted successfully & prizes distributed!",
      totalPrizeDistributed
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Other Routes
router.get("/", async (req, res) => {
  try {
    const { mode, status } = req.query;
    const filter = {};
    if (mode) filter.mode = mode;
    if (status) filter.status = status;
    const matches = await LudoTournament.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: matches });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

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

router.delete("/:id", protectAdmin, async (req, res) => {
  try {
    await LudoTournament.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Match deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;