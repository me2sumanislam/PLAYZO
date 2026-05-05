 const express = require("express");
const router = express.Router();
const Match = require("../models/Match");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

// ================= ADMIN MIDDLEWARE =================
const protectAdmin = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.json({ success: false, message: "No token found" });
    }

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

// ================= TEST ROUTE =================
router.get("/test", (req, res) => {
  res.json({ success: true, message: "Match Routes Working ✅" });
});

// ================= CREATE MATCH =================
router.post("/create", protectAdmin, async (req, res) => {
  try {
    const { startTime, ...rest } = req.body;

    const expiresAt = startTime
      ? new Date(new Date(startTime).getTime() + 20 * 60 * 1000)
      : new Date(Date.now() + 20 * 60 * 1000);

    const match = await Match.create({
      ...rest,
      startTime,
      expiresAt,
      joinedPlayers: 0,
      status: "upcoming",
    });

    res.status(201).json({
      success: true,
      message: "Match created successfully",
      data: match,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ================= SUBMIT MATCH RESULT + PRIZE =================
router.post("/result", protectAdmin, async (req, res) => {
  console.log("🔥 Result API Hit!", req.body);

  try {
    const { matchId, results } = req.body;

    if (!matchId || !results || results.length === 0) {
      return res.status(400).json({
        success: false,
        message: "matchId and results are required"
      });
    }

    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ success: false, message: "Match not found" });
    }

    const finalResults = results.map(player => {
      let prize = (player.kills || 0) * (match.perKill || 5);

      if (player.position == 1) prize += (match.prizes?.first || 60);
      else if (player.position == 2) prize += (match.prizes?.second || 40);
      else if (player.position == 3) prize += (match.prizes?.third || 20);

      return { ...player, prize: Math.floor(prize) };
    });

    match.results = finalResults;
    match.status = "completed";
    match.completedAt = new Date();
    await match.save();

    for (const player of finalResults) {
      if (player.userId && player.prize > 0) {
        await User.findByIdAndUpdate(player.userId, {
          $inc: { balance: player.prize },
          $push: {
            transactions: {
              type: "match_prize",
              amount: player.prize,
              matchId: match._id,
              matchTitle: match.title,
              date: new Date()
            }
          }
        });
      }
    }

    res.json({
      success: true,
      message: "Result submitted & prizes distributed successfully",
      data: match
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ================= MY MATCHES (USER) =================
router.get("/my-matches", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ success: false, message: "userId is required" });
    }

    const matches = await Match.find({
      "joinedUsers.userId": userId
    }).sort({ createdAt: -1 });

    res.json({ success: true, data: matches });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ================= GET ALL MATCHES =================
router.get("/", async (req, res) => {
  try {
    const matches = await Match.find().sort({ createdAt: -1 });
    res.json({ success: true, data: matches });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ================= GET SINGLE MATCH =================
router.get("/:id", async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    res.json({ success: true, data: match });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ================= UPDATE ROOM =================
router.put("/update-room/:id", protectAdmin, async (req, res) => {
  try {
    const { roomId, roomPassword } = req.body;

    const match = await Match.findByIdAndUpdate(
      req.params.id,
      { roomId, roomPassword, status: "live", isRoomOpen: true },
      { returnDocument: 'after' }
    );

    res.json({
      success: true,
      message: "Room updated successfully",
      data: match,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ================= JOIN MATCH =================
router.put("/join/:id", async (req, res) => {
  try {
    const { userId } = req.body;
    const match = await Match.findById(req.params.id);

    if (!match) return res.status(404).json({ success: false, message: "Match not found" });

    const alreadyJoined = (match.joinedUsers || []).find(u => u.userId.toString() === userId.toString());
    if (alreadyJoined) {
      return res.json({ success: false, message: "আপনি ইতোমধ্যে এই match-এ join করেছেন" });
    }

    if (match.joinedPlayers >= match.totalPlayers) {
      return res.json({ success: false, message: "Match is full" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (user.balance < match.entryFee) {
      return res.json({ success: false, message: "পর্যাপ্ত balance নেই" });
    }

    const usedSlots = (match.joinedUsers || []).map(u => u.slotNumber);
    let slotNumber = 1;
    while (usedSlots.includes(slotNumber)) slotNumber++;

    user.balance -= match.entryFee;

    if (!user.joinHistory) user.joinHistory = [];
    user.joinHistory.push({
      matchId: match._id,
      matchTitle: match.title,
      entryFee: match.entryFee,
      joinedAt: new Date(),
    });

    await user.save();

    if (!match.joinedUsers) match.joinedUsers = [];
    match.joinedUsers.push({ userId, slotNumber });
    match.joinedPlayers = match.joinedUsers.length;
    await match.save();

    res.json({
      success: true,
      message: "Match-এ join সফল হয়েছে",
      newBalance: user.balance,
      slotNumber,
      data: match,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ================= DELETE ALL =================
router.delete("/clear-all", protectAdmin, async (req, res) => {
  try {
    const result = await Match.deleteMany({});
    res.json({
      success: true,
      message: `${result.deletedCount} টা match delete হয়েছে`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;