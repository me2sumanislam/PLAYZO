 // routes/matches.js
const express = require("express");
const router = express.Router();
const Match = require("../models/Match");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const notificationRouter = require("./notifications");

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN MIDDLEWARE
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// TEST ROUTE
// ─────────────────────────────────────────────────────────────────────────────
router.get("/test", (req, res) => {
  res.json({ success: true, message: "Match Routes Working ✅" });
});

// ─────────────────────────────────────────────────────────────────────────────
// CREATE MATCH
// POST /api/matches/create
// ─────────────────────────────────────────────────────────────────────────────
router.post("/create", protectAdmin, async (req, res) => {
  try {
    const { startTime, category = "freefire", ...rest } = req.body;

    const expiresAt = startTime
      ? new Date(new Date(startTime).getTime() + 20 * 60 * 1000)
      : new Date(Date.now() + 20 * 60 * 1000);

    const match = await Match.create({
      ...rest,
      startTime,
      expiresAt,
      category,
      joinedPlayers: 0,
      status: "upcoming",
    });

    // ✅ Match create হলে সব users কে push notification পাঠাও
    await notificationRouter.sendMatchNotification(match, category);

    res.status(201).json({
      success: true,
      message: "Match created successfully",
      data: match,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// SUBMIT MATCH RESULT + PRIZE DISTRIBUTION
// POST /api/matches/result
// ─────────────────────────────────────────────────────────────────────────────
router.post("/result", protectAdmin, async (req, res) => {
  console.log("🔥 Result API Hit!", req.body);
  try {
    const { matchId, results } = req.body;
    if (!matchId || !results || results.length === 0) {
      return res.status(400).json({
        success: false,
        message: "matchId and results are required",
      });
    }

    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ success: false, message: "Match not found" });
    }

    const finalResults = results.map((player) => {
      let prize = (player.kills || 0) * (match.perKill || 5);
      if (player.position == 1)      prize += match.prizes?.first  || 60;
      else if (player.position == 2) prize += match.prizes?.second || 40;
      else if (player.position == 3) prize += match.prizes?.third  || 20;
      return { ...player, prize: Math.floor(prize) };
    });

    match.results     = finalResults;
    match.status      = "completed";
    match.completedAt = new Date();
    await match.save();

    // Prize distribute করো
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
              date: new Date(),
            },
          },
        });
      }
    }

    res.json({
      success: true,
      message: "Result submitted & prizes distributed successfully",
      data: match,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET COMPLETED MATCHES
// GET /api/matches/completed
// ─────────────────────────────────────────────────────────────────────────────
router.get("/completed", async (req, res) => {
  try {
    const matches = await Match.find({ status: "completed" })
      .sort({ completedAt: -1 })
      .limit(20);
    res.json({ success: true, data: matches });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// MY MATCHES (USER)
// GET /api/matches/my-matches?userId=xxx
// ─────────────────────────────────────────────────────────────────────────────
router.get("/my-matches", async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) {
      return res.status(400).json({ success: false, message: "userId is required" });
    }
    const matches = await Match.find({
      "joinedUsers.userId": userId,
    }).sort({ createdAt: -1 });
    res.json({ success: true, data: matches });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET ALL MATCHES
// GET /api/matches/
// ─────────────────────────────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const matches = await Match.find()
      .populate("joinedUsers.userId", "name phone")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: matches });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET SINGLE MATCH
// GET /api/matches/:id
// ─────────────────────────────────────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ success: false, message: "Match not found" });
    res.json({ success: true, data: match });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE ROOM (Admin sets room ID & password)
// PUT /api/matches/update-room/:id
// ─────────────────────────────────────────────────────────────────────────────
router.put("/update-room/:id", protectAdmin, async (req, res) => {
  try {
    const { roomId, roomPassword } = req.body;
    const match = await Match.findByIdAndUpdate(
      req.params.id,
      { roomId, roomPassword, status: "live", isRoomOpen: true },
      { returnDocument: "after" }
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

// ─────────────────────────────────────────────────────────────────────────────
// JOIN MATCH
// PUT /api/matches/join/:id
// ─────────────────────────────────────────────────────────────────────────────
router.put("/join/:id", async (req, res) => {
  try {
    const { userId, inGameName } = req.body;
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ success: false, message: "Match not found" });

    const alreadyJoined = (match.joinedUsers || []).find(
      (u) => u.userId.toString() === userId.toString()
    );
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

    // Slot assign
    const usedSlots = (match.joinedUsers || []).map((u) => u.slotNumber);
    let slotNumber = 1;
    while (usedSlots.includes(slotNumber)) slotNumber++;

    // Balance কাটো
    user.balance -= match.entryFee;
    if (!user.joinHistory) user.joinHistory = [];
    user.joinHistory.push({
      matchId:    match._id,
      matchTitle: match.title,
      entryFee:   match.entryFee,
      joinedAt:   new Date(),
    });
    await user.save();

    if (!match.joinedUsers) match.joinedUsers = [];
       match.joinedUsers.push({ 
       userId: user._id, 
      slotNumber: slot,
  gameName: req.body.userName || req.body.gameName || ""  // ← এটা যোগ করুন
});
    match.joinedPlayers = match.joinedUsers.length;
    await match.save();

    // ✅ REFERRAL POINT TRIGGER
    if (user.referredBy) {
      try {
        const referrer = await User.findById(user.referredBy);
        if (referrer) {
          const refEntry = referrer.referralHistory.find(
            (r) => r.userId.toString() === user._id.toString()
          );
          if (refEntry && refEntry.deposited && !refEntry.pointGiven) {
            refEntry.pointGiven = true;
            referrer.referralPoints = (referrer.referralPoints || 0) + 5;
            await referrer.save();
            console.log(`🎯 [Referral] ${referrer.name} পেলেন 5 points — ${user.name} match join করেছে`);
          }
        }
      } catch (refErr) {
        console.error("Referral point error:", refErr.message);
      }
    }

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

// ─────────────────────────────────────────────────────────────────────────────
// DELETE ALL MATCHES (Admin)
// DELETE /api/matches/clear-all
// ─────────────────────────────────────────────────────────────────────────────
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