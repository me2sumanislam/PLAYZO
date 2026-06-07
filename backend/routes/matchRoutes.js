 // routes/matchRoutes.js
const express = require("express");
const router  = express.Router();
const Match   = require("../models/Match");
const User    = require("../models/User");
const jwt     = require("jsonwebtoken");
const notificationRouter = require("./notifications");

// ─── Match mode → config mapping ─────────────────────────────────────────────
// category string  matchType  teamSize  defaultTotalPlayers
const MODE_CONFIG = {
  br_solo:      { matchType: "solo", teamSize: 1, defaultTotal: 48 },
  br_survival:  { matchType: "solo", teamSize: 1, defaultTotal: 48 },
  br_duo:       { matchType: "team", teamSize: 2, defaultTotal: 48 },
  br_squad:     { matchType: "team", teamSize: 4, defaultTotal: 48 },
  clash_squad:  { matchType: "team", teamSize: 4, defaultTotal:  8 },
  cs_2vs2:      { matchType: "team", teamSize: 2, defaultTotal:  4 },
  lone_wolf:    { matchType: "team", teamSize: 1, defaultTotal:  2 }, // winner takes all
  tdm_6v6:      { matchType: "team", teamSize: 6, defaultTotal: 12 },
  training:     { matchType: "solo", teamSize: 1, defaultTotal: 48 },
};

// ─── Middlewares ──────────────────────────────────────────────────────────────
const protectAdmin = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.json({ success: false, message: "No token" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "admin" && decoded.role !== "super-admin")
      return res.json({ success: false, message: "Admin only" });
    req.user = decoded;
    next();
  } catch (err) {
    return res.json({ success: false, message: "Invalid token: " + err.message });
  }
};

const protect = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ success: false, message: "No token" });
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

// ─── Test ─────────────────────────────────────────────────────────────────────
router.get("/test", (req, res) => res.json({ success: true, message: "Match Routes ✅" }));

// ─── CREATE MATCH ─────────────────────────────────────────────────────────────
// POST /api/matches/create
router.post("/create", protectAdmin, async (req, res) => {
  try {
    const { startTime, category = "br_solo", totalPlayers, prizePool, ...rest } = req.body;

    const cfg = MODE_CONFIG[category] || MODE_CONFIG.br_solo;

    const expiresAt = startTime
      ? new Date(new Date(startTime).getTime() + 20 * 60 * 1000)
      : new Date(Date.now() + 20 * 60 * 1000);

    const match = await Match.create({
      ...rest,
      startTime,
      expiresAt,
      category,
      matchType:    cfg.matchType,
      teamSize:     cfg.teamSize,
      totalPlayers: totalPlayers || cfg.defaultTotal,
      prizePool:    prizePool    || rest.winPrize || 0,
      joinedPlayers: 0,
      status:        "upcoming",
    });

    await notificationRouter.sendMatchNotification(match, category);

    res.status(201).json({ success: true, message: "Match created", data: match });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET ALL MATCHES ──────────────────────────────────────────────────────────
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

// ─── GET COMPLETED MATCHES ────────────────────────────────────────────────────
router.get("/completed", async (req, res) => {
  try {
    const matches = await Match.find({ status: "completed" })
      .sort({ completedAt: -1 })
      .limit(30);
    res.json({ success: true, data: matches });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── MY MATCHES ───────────────────────────────────────────────────────────────
router.get("/my-matches", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ success: false, message: "userId required" });
    const matches = await Match.find({ "joinedUsers.userId": userId }).sort({ createdAt: -1 });
    res.json({ success: true, data: matches });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET SINGLE MATCH ─────────────────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ success: false, message: "Match not found" });
    res.json({ success: true, data: match });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── UPDATE ROOM ──────────────────────────────────────────────────────────────
router.put("/update-room/:id", protectAdmin, async (req, res) => {
  try {
    const { roomId, roomPassword } = req.body;
    const match = await Match.findByIdAndUpdate(
      req.params.id,
      { roomId, roomPassword, status: "live", isRoomOpen: true },
      { new: true }
    );
    res.json({ success: true, message: "Room updated", data: match });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── JOIN MATCH ───────────────────────────────────────────────────────────────
// PUT /api/matches/join/:id
// Body: { userId, inGameName, team? }
// team = "A" or "B" — team match এ কোন দলে যাবে
router.put("/join/:id", async (req, res) => {
  try {
    const { userId, inGameName, team = "A" } = req.body;
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ success: false, message: "Match not found" });

    // Already joined?
    const alreadyJoined = (match.joinedUsers || []).find(
      (u) => u.userId.toString() === userId.toString()
    );
    if (alreadyJoined)
      return res.json({ success: false, message: "আপনি ইতোমধ্যে join করেছেন" });

    // Full?
    if (match.joinedPlayers >= match.totalPlayers)
      return res.json({ success: false, message: "Match is full" });

    // Team size check (team match)
    if (match.matchType === "team" && match.teamSize > 1) {
      const teamCount = (match.joinedUsers || []).filter(
        (u) => u.team === team
      ).length;
      if (teamCount >= match.teamSize)
        return res.json({
          success: false,
          message: `Team ${team} full! অন্য team select করুন।`,
        });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (user.balance < match.entryFee)
      return res.json({ success: false, message: "পর্যাপ্ত balance নেই" });

    // Slot assign
    const usedSlots = (match.joinedUsers || []).map((u) => u.slotNumber);
    let slotNumber = 1;
    while (usedSlots.includes(slotNumber)) slotNumber++;

    // Deduct balance
    user.balance -= match.entryFee;
    if (!user.joinHistory) user.joinHistory = [];
    user.joinHistory.push({
      matchId:    match._id,
      matchTitle: match.title,
      entryFee:   match.entryFee,
      joinedAt:   new Date(),
    });
    await user.save();

    match.joinedUsers.push({
      userId:     user._id,
      inGameName: inGameName || "",
      gameName:   inGameName || "",
      slotNumber,
      team:       match.matchType === "team" ? team : "A",
    });
    match.joinedPlayers = match.joinedUsers.length;
    await match.save();

    // Referral point trigger
    if (user.referredBy) {
      try {
        const referrer = await User.findById(user.referredBy);
        if (referrer) {
          const refEntry = referrer.referralHistory?.find(
            (r) => r.userId.toString() === user._id.toString()
          );
          if (refEntry && refEntry.deposited && !refEntry.pointGiven) {
            refEntry.pointGiven = true;
            referrer.referralPoints = (referrer.referralPoints || 0) + 5;
            await referrer.save();
          }
        }
      } catch (refErr) {
        console.error("Referral error:", refErr.message);
      }
    }

    res.json({
      success:    true,
      message:    "Join সফল!",
      newBalance: user.balance,
      slotNumber,
      team:       match.matchType === "team" ? team : null,
      data:       match,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── SUBMIT RESULT (legacy route — admin panel uses /api/admin/matches/:id/result) ──
// POST /api/matches/result
router.post("/result", protectAdmin, async (req, res) => {
  try {
    const { matchId, results } = req.body;
    if (!matchId || !results?.length)
      return res.status(400).json({ success: false, message: "matchId and results required" });

    const match = await Match.findById(matchId);
    if (!match) return res.status(404).json({ success: false, message: "Match not found" });

    const finalResults = results.map((p) => {
      let prize = (p.kills || 0) * (match.perKill || 0);
      if (p.position == 1)      prize += match.prizes?.first  || 0;
      else if (p.position == 2) prize += match.prizes?.second || 0;
      else if (p.position == 3) prize += match.prizes?.third  || 0;
      else if (p.position == 4) prize += match.prizes?.fourth || 0;
      return { ...p, prize: Math.floor(prize) };
    });

    match.results     = finalResults;
    match.status      = "completed";
    match.completedAt = new Date();
    await match.save();

    for (const player of finalResults) {
      if (player.userId && player.prize > 0) {
        await User.findByIdAndUpdate(player.userId, {
          $inc: { balance: player.prize },
          $push: {
            transactions: {
              type: "match_prize", amount: player.prize,
              matchId: match._id, matchTitle: match.title, date: new Date(),
            },
          },
        });
      }
    }

    res.json({ success: true, message: "Result submitted & prizes distributed", data: match });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── DELETE ALL (admin) ───────────────────────────────────────────────────────
router.delete("/clear-all", protectAdmin, async (req, res) => {
  try {
    const result = await Match.deleteMany({});
    res.json({ success: true, message: `${result.deletedCount} matches deleted` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;