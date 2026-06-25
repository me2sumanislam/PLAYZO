 // routes/matchRoutes.js
const express = require("express");
const router  = express.Router();
const Match   = require("../models/Match");
const User    = require("../models/User");
const jwt     = require("jsonwebtoken");
const notificationRouter = require("./notifications");

// ─── Match mode → config ──────────────────────────────────────────────────────
const MODE_CONFIG = {
  br_solo:      { matchType: "solo", teamSize: 1, defaultTotal: 48 },
  br_survival:  { matchType: "solo", teamSize: 1, defaultTotal: 48 },
  br_duo:       { matchType: "team", teamSize: 2, defaultTotal: 48 },
  br_squad:     { matchType: "team", teamSize: 4, defaultTotal: 48 },
  clash_squad:  { matchType: "team", teamSize: 4, defaultTotal:  8 },
  cs_solo:      { matchType: "team", teamSize: 1, defaultTotal:  2 },
  cs_duo:       { matchType: "team", teamSize: 2, defaultTotal:  4 },
  cs_2vs2:      { matchType: "team", teamSize: 2, defaultTotal:  4 },
  cs_squad:     { matchType: "team", teamSize: 4, defaultTotal:  8 },
  cs_6vs6:      { matchType: "team", teamSize: 6, defaultTotal: 12 },
  cs_12:        { matchType: "team", teamSize: 6, defaultTotal: 12 },
  lw_solo:      { matchType: "team", teamSize: 1, defaultTotal:  2 },
  lw_duo:       { matchType: "team", teamSize: 2, defaultTotal:  4 },
  lone_wolf:    { matchType: "team", teamSize: 1, defaultTotal:  2 },
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

// ═══════════════════════════════════════════════════════════════════════════════
// ✅ PRIZE CALCULATOR — আপনার নতুন rules অনুযায়ী
// ═══════════════════════════════════════════════════════════════════════════════
/**
 * calculatePrizes(match, results)
 *
 * results array format (admin থেকে আসে):
 *   [{ userId, inGameName, position, kills, team? }, ...]
 *
 * returns: { finalResults, redAlert }
 */
function calculatePrizes(match, results) {
  const category  = match.category  || "br_solo";
  const perKill   = match.perKill   || 0;
  const prizePool = match.prizePool  || match.winPrize || 0;
  const prizes    = match.prizes     || {};

  // ─────────────────────────────────────────────────────────────────────────
  // 1. BR SOLO (48 players) — Position Prize + Kill Prize
  //    ১ম: prizes.first + (kills × perKill)
  //    ২য়: prizes.second + (kills × perKill)
  //    ৩য়: prizes.third + (kills × perKill)
  //    ৪র্থ: prizes.fourth + (kills × perKill)
  //    ৫ম-৪৮তম: শুধু (kills × perKill)
  //    Red Alert: total prize > prizePool * 1.5 হলে warn করো
  // ─────────────────────────────────────────────────────────────────────────
  if (category === "br_solo" || category === "br_survival") {
    const PLACEMENT = {
      1: prizes.first  ?? 60,
      2: prizes.second ?? 40,
      3: prizes.third  ?? 30,
      4: prizes.fourth ?? 20,
    };

    const finalResults = results.map((p) => {
      const killEarning    = (p.kills || 0) * perKill;
      const placementPrize = PLACEMENT[p.position] || 0;
      return {
        ...p,
        prize:          Math.floor(killEarning + placementPrize),
        killEarning:    Math.floor(killEarning),
        placementPrize: Math.floor(placementPrize),
      };
    });

    const totalOut = finalResults.reduce((s, p) => s + p.prize, 0);
    const redAlert = totalOut > prizePool * 1.5;

    if (redAlert) {
      console.warn(`🔴 RED ALERT: Match "${match.title}" — total prize ৳${totalOut} > prizePool ৳${prizePool}`);
    }

    return { finalResults, redAlert };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 2. BR DUO (48 players) — Winner টিম (2 জন) Prize Pool সমান ভাগ
  //    Kill Prize নেই
  // ─────────────────────────────────────────────────────────────────────────
  if (category === "br_duo") {
    return _teamWinnerPrize(results, prizePool, 2, match.winnerTeam);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 3. BR SQUAD (48 players) — Winner টিম (4 জন) Prize Pool সমান ভাগ
  //    Kill Prize নেই
  // ─────────────────────────────────────────────────────────────────────────
  if (category === "br_squad") {
    return _teamWinnerPrize(results, prizePool, 4, match.winnerTeam);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 4. CLASH SQUAD MODES — Kill Prize নেই, winner(s) Prize Pool ভাগ
  //    cs_solo  (2):  বিজয়ী 1 জন  → 100% pool
  //    cs_duo   (4):  বিজয়ী 2 জন  → pool ÷ 2
  //    cs_squad (8):  বিজয়ী 4 জন  → pool ÷ 4
  //    cs_6vs6  (12): বিজয়ী 6 জন  → pool ÷ 6
  // ─────────────────────────────────────────────────────────────────────────
  if (category === "cs_solo") {
    return _teamWinnerPrize(results, prizePool, 1, match.winnerTeam);
  }
  if (category === "cs_duo" || category === "cs_2vs2") {
    return _teamWinnerPrize(results, prizePool, 2, match.winnerTeam);
  }
  if (category === "cs_squad" || category === "clash_squad") {
    return _teamWinnerPrize(results, prizePool, 4, match.winnerTeam);
  }
  if (category === "cs_6vs6" || category === "cs_12") {
    return _teamWinnerPrize(results, prizePool, 6, match.winnerTeam);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 5. LONE WOLF MODES — Kill Prize নেই, winner(s) Prize Pool ভাগ
  //    lw_solo / lone_wolf (2): বিজয়ী 1 জন → 100% pool
  //    lw_duo             (4): বিজয়ী 2 জন → pool ÷ 2
  // ─────────────────────────────────────────────────────────────────────────
  if (category === "lw_solo" || category === "lone_wolf") {
    return _teamWinnerPrize(results, prizePool, 1, match.winnerTeam);
  }
  if (category === "lw_duo") {
    return _teamWinnerPrize(results, prizePool, 2, match.winnerTeam);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Default fallback — br_solo এর মতো
  // ─────────────────────────────────────────────────────────────────────────
  return _soloFallback(results, prizes, perKill);
}

// ─── Helper: Team Winner Prize ────────────────────────────────────────────────
// Winner team এর প্রতিজন সমান prize পাবে। বাকিরা ০।
// winnerTeam = "A" বা "B" — admin panel থেকে set করা হয়।
// যদি winnerTeam না থাকে, position = 1 বা position <= winnerCount কে winner ধরা হয়।
function _teamWinnerPrize(results, prizePool, winnerCount, winnerTeam) {
  const prizePerWinner = winnerCount > 0
    ? Math.floor(prizePool / winnerCount)
    : 0;

  const finalResults = results.map((p) => {
    let isWinner = false;
    if (winnerTeam) {
      // team match: team A বা B winner
      isWinner = p.team === winnerTeam;
    } else {
      // solo/position based: top N জন winner
      isWinner = (p.position || 999) <= winnerCount;
    }

    return {
      ...p,
      prize:          isWinner ? prizePerWinner : 0,
      killEarning:    0,          // kill prize নেই এই modes এ
      placementPrize: isWinner ? prizePerWinner : 0,
    };
  });

  return { finalResults, redAlert: false };
}

// ─── Helper: Solo fallback ────────────────────────────────────────────────────
function _soloFallback(results, prizes, perKill) {
  const PLACEMENT = {
    1: prizes.first  || 0,
    2: prizes.second || 0,
    3: prizes.third  || 0,
    4: prizes.fourth || 0,
  };
  const finalResults = results.map((p) => {
    const killEarning    = (p.kills || 0) * perKill;
    const placementPrize = PLACEMENT[p.position] || 0;
    return { ...p, prize: Math.floor(killEarning + placementPrize) };
  });
  return { finalResults, redAlert: false };
}

// ─── Test ─────────────────────────────────────────────────────────────────────
router.get("/test", (req, res) => res.json({ success: true, message: "Match Routes ✅" }));

// ─── CREATE MATCH ─────────────────────────────────────────────────────────────
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
      matchType:     cfg.matchType,
      teamSize:      cfg.teamSize,
      totalPlayers:  totalPlayers || cfg.defaultTotal,
      prizePool:     prizePool    || rest.winPrize || 0,
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
router.put("/join/:id", async (req, res) => {
  try {
    const { userId, inGameName, team = "A" } = req.body;
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ success: false, message: "Match not found" });

    const alreadyJoined = (match.joinedUsers || []).find(
      (u) => u.userId.toString() === userId.toString()
    );
    if (alreadyJoined)
      return res.json({ success: false, message: "আপনি ইতোমধ্যে join করেছেন" });

    if (match.joinedPlayers >= match.totalPlayers)
      return res.json({ success: false, message: "Match is full" });

    if (match.matchType === "team" && match.teamSize > 1) {
      const teamCount = (match.joinedUsers || []).filter((u) => u.team === team).length;
      if (teamCount >= match.teamSize)
        return res.json({ success: false, message: `Team ${team} full! অন্য team select করুন।` });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    if (user.balance < match.entryFee)
      return res.json({ success: false, message: "পর্যাপ্ত balance নেই" });

    const usedSlots = (match.joinedUsers || []).map((u) => u.slotNumber);
    let slotNumber = 1;
    while (usedSlots.includes(slotNumber)) slotNumber++;

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

// ═══════════════════════════════════════════════════════════════════════════════
// ✅ SUBMIT RESULT — নতুন Prize Calculation সহ
// POST /api/matches/result
// Body: { matchId, results: [...], winnerTeam?: "A" | "B" }
// ═══════════════════════════════════════════════════════════════════════════════
router.post("/result", protectAdmin, async (req, res) => {
  try {
    const { matchId, results, winnerTeam } = req.body;

    if (!matchId || !results?.length)
      return res.status(400).json({ success: false, message: "matchId and results required" });

    const match = await Match.findById(matchId);
    if (!match) return res.status(404).json({ success: false, message: "Match not found" });

    // ✅ winnerTeam match document এ set করো (team mode এর জন্য)
    if (winnerTeam) match.winnerTeam = winnerTeam;

    // ✅ নতুন prize calculate করো
    const { finalResults, redAlert } = calculatePrizes(match, results);

    match.results     = finalResults;
    match.status      = "completed";
    match.completedAt = new Date();
    match.deleteAt    = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 দিন পর auto delete
    await match.save();

    // ✅ Prize distribute করো
    let distributed = 0;
    for (const player of finalResults) {
      if (player.userId && player.prize > 0) {
        await User.findByIdAndUpdate(player.userId, {
          $inc: { balance: player.prize },
          $push: {
            transactions: {
              type:       "match_prize",
              amount:     player.prize,
              matchId:    match._id,
              matchTitle: match.title,
              date:       new Date(),
              note: `${match.category === "br_solo"
                ? `Placement: ৳${player.placementPrize || 0} + Kills: ৳${player.killEarning || 0}`
                : `Winner Prize`}`,
            },
          },
        });
        distributed++;
      }
    }

    res.json({
      success:     true,
      message:     `✅ Result submitted! ${distributed} জন কে prize দেওয়া হয়েছে।`,
      redAlert,           // ⚠️ Admin panel এ দেখাতে পারো
      totalPrize:  finalResults.reduce((s, p) => s + p.prize, 0),
      distributed,
      data:        match,
    });
  } catch (err) {
    console.error("Result submit error:", err);
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

// ─── START MATCH (set status live) ───────────────────────────────────────────
router.put("/live/:id", async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match)
      return res.status(404).json({ success: false, message: "Match not found" });
    if (match.status === "live")
      return res.status(400).json({ success: false, message: "Match already live" });
    if (match.status === "completed")
      return res.status(400).json({ success: false, message: "Completed match cannot start" });

    match.status    = "live";
    match.startedAt = new Date();
    await match.save();

    res.json({ success: true, message: "✅ Match started successfully", match });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;