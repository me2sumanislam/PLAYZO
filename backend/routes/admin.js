 // routes/admin.js
const express = require("express");
const router  = express.Router();
const bcrypt  = require("bcryptjs");
const jwt     = require("jsonwebtoken");

const User          = require("../models/User");
const Deposit       = require("../models/Deposit");
const Withdraw      = require("../models/withdraw");
const Match         = require("../models/Match");
const ActivityLog   = require("../models/ActivityLog");
const PaymentNumber = require("../models/PaymentNumber");

const JWT_SECRET  = process.env.JWT_SECRET || "your_secret_key";
const ADMIN_ROLES = ["admin", "super-admin", "finance"];

// ─── Prize Logic Config ───────────────────────────────────────────────────────
// matchLogic:
//   "solo_kill"   → BR Solo/Duo: position prize + kill × perKill
//   "solo_pos"    → CS Solo / LW Solo: winner position prize only (no kill)
//   "team_kill"   → BR Duo: position ÷ teamSize + individual kill (special)
//   "team_only"   → BR Squad, CS Duo, CS Squad, CS 6vs6, LW Duo: winner team ÷ teamSize

const CATEGORY_CONFIG = {
  br_solo:    { matchType: "solo",      teamSize: 1,  logic: "solo_kill",  killPrize: true  },
  br_duo:     { matchType: "team_kill", teamSize: 2,  logic: "team_kill",  killPrize: true  },
  br_squad:   { matchType: "team",      teamSize: 4,  logic: "team_only",  killPrize: false },
  cs_solo:    { matchType: "solo",      teamSize: 1,  logic: "solo_pos",   killPrize: false },
  cs_duo:     { matchType: "team",      teamSize: 2,  logic: "team_only",  killPrize: false },
  cs_squad:   { matchType: "team",      teamSize: 4,  logic: "team_only",  killPrize: false },
  cs_6vs6:    { matchType: "team",      teamSize: 6,  logic: "team_only",  killPrize: false },
  lw_solo:    { matchType: "solo",      teamSize: 1,  logic: "solo_pos",   killPrize: false },
  lw_duo:     { matchType: "team",      teamSize: 2,  logic: "team_only",  killPrize: false },
  // backward compat
  br_match:   { matchType: "solo",      teamSize: 1,  logic: "solo_kill",  killPrize: true  },
  br_survival:{ matchType: "solo",      teamSize: 1,  logic: "solo_kill",  killPrize: true  },
  clash_squad:{ matchType: "team",      teamSize: 4,  logic: "team_only",  killPrize: false },
  cs_2vs2:    { matchType: "team",      teamSize: 2,  logic: "team_only",  killPrize: false },
  lone_wolf:  { matchType: "solo",      teamSize: 1,  logic: "solo_pos",   killPrize: false },
  training:   { matchType: "solo",      teamSize: 1,  logic: "solo_kill",  killPrize: true  },
};

const authAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ success: false, message: "No token" });
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || !ADMIN_ROLES.includes(user.role))
      return res.status(401).json({ success: false, message: "Admin not found" });
    req.admin = user;
    next();
  } catch {
    res.status(401).json({ success: false, message: "Invalid token" });
  }
};

const log = (adminName, action, target, type) =>
  ActivityLog.create({ adminName, action, target, type }).catch(() => {});

// ── STATS ─────────────────────────────────────────────────────────────────────
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
        totalDeposit:          totalDeposit[0]?.sum          || 0,
        totalWithdraw:         totalWithdraw[0]?.sum         || 0,
        pendingDepositAmount:  pendingDepositAmount[0]?.sum  || 0,
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

// ── DEPOSITS ──────────────────────────────────────────────────────────────────
router.get("/deposits", authAdmin, async (req, res) => {
  try {
    const { status, limit = 50 } = req.query;
    const query = status && status !== "all" ? { status } : {};
    const data = await Deposit.find(query)
      .populate("userId", "name phone")
      .sort({ createdAt: -1 })
      .limit(Number(limit));
    const mapped = data.map((d) => ({ ...d.toObject(), user: d.userId }));
    res.json({ success: true, data: mapped });
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
    await dep.save();
    await User.findByIdAndUpdate(dep.userId._id || dep.userId, {
      $inc: { balance: dep.amount, totalDeposit: dep.amount },
    });
    log(req.admin.name, `approved deposit of ৳${dep.amount}`, dep.userId?.name || "user", "approve");
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
    ).populate("userId");
    log(req.admin.name, `rejected deposit of ৳${dep.amount}`, dep.userId?.name || "user", "reject");
    res.json({ success: true, message: "Deposit rejected" });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── WITHDRAWALS ───────────────────────────────────────────────────────────────
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
    if (user.balance < wit.amount) return res.json({ success: false, message: "Insufficient balance" });
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

// ── USERS ─────────────────────────────────────────────────────────────────────
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

// ── PAYMENT NUMBERS ───────────────────────────────────────────────────────────
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
    const updated = await PaymentNumber.findByIdAndUpdate(req.params.id, { ...req.body }, { new: true });
    if (!updated) return res.json({ success: false, message: "Not found" });
    res.json({ success: true, data: updated });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.delete("/payment-numbers/:id", authAdmin, async (req, res) => {
  try {
    const deleted = await PaymentNumber.findByIdAndDelete(req.params.id);
    if (!deleted) return res.json({ success: false, message: "Not found" });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── ACTIVITY LOG ──────────────────────────────────────────────────────────────
router.get("/logs", authAdmin, async (req, res) => {
  try {
    const data = await ActivityLog.find().sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── ADMIN MANAGEMENT ──────────────────────────────────────────────────────────
router.get("/admins", authAdmin, async (req, res) => {
  try {
    const data = await User.find({ role: { $in: ADMIN_ROLES } }, "name phone role createdAt").sort({ createdAt: -1 });
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.post("/admins/create", authAdmin, async (req, res) => {
  try {
    if (req.admin.role !== "super-admin")
      return res.json({ success: false, message: "Only super admin can create admins" });
    const { name, phone, password, role } = req.body;
    const exists = await User.findOne({ phone });
    if (exists) return res.json({ success: false, message: "Phone already registered" });
    const hash  = await bcrypt.hash(password, 10);
    const admin = await User.create({ name, phone, password: hash, role });
    log(req.admin.name, `created new admin ${name}`, phone, "create");
    res.json({ success: true, admin });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── COMPLETED MATCHES (Admin panel — 1 মাস store) ────────────────────────────
router.get("/completed-matches", authAdmin, async (req, res) => {
  try {
    // ১ মাসের পুরনো completed match auto delete
    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    await Match.deleteMany({ status: "completed", completedAt: { $lt: oneMonthAgo } });

    const matches = await Match.find({ status: "completed" })
      .sort({ completedAt: -1 })
      .limit(100);
    res.json({ success: true, data: matches });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// MATCH RESULT — PUT /api/admin/matches/:id/result
//
// BR Solo:      { results: [{userId, inGameName, position, kills}] }
//               → position prize (individual) + kill × perKill (individual)
//
// BR Duo:       { results: [{userId, inGameName, position, kills, team}] }
//               → position prize ÷ 2 (team) + kill × perKill (individual)
//
// BR Squad / CS Duo / CS Squad / CS 6vs6 / LW Duo:
//               { results: [], winnerTeam: "A"|"B" }
//               → winner team floor(prizePool ÷ teamSize)
//
// CS Solo / LW Solo:
//               { results: [{userId, inGameName, position:1}] }
//               → winner gets full prize (position 1 only)
// ════════════════════════════════════════════════════════════════════════════
router.put("/matches/:id/result", authAdmin, async (req, res) => {
  try {
    const { results, winnerTeam } = req.body;
    const match = await Match.findById(req.params.id);
    if (!match) return res.json({ success: false, message: "Match not found" });

    const cfg = CATEGORY_CONFIG[match.category] || CATEGORY_CONFIG.br_solo;

    // ── BR Solo / CS Solo / LW Solo ──────────────────────────────────────────
    if (cfg.logic === "solo_kill" || cfg.logic === "solo_pos") {
      if (!results || results.length === 0)
        return res.json({ success: false, message: "results array required" });

      const finalResults = results.map((p) => {
        const pos = Number(p.position) || 0;
        let prize = 0;

        if (cfg.logic === "solo_kill") {
          // Position prize
          if (pos === 1)      prize += match.prizes?.first  || 0;
          else if (pos === 2) prize += match.prizes?.second || 0;
          else if (pos === 3) prize += match.prizes?.third  || 0;
          else if (pos === 4) prize += match.prizes?.fourth || 0;
          // Kill prize
          prize += (Number(p.kills) || 0) * (match.perKill || 0);
        } else {
          // solo_pos: শুধু winner (position 1) full prize পায়
          if (pos === 1) prize = match.prizePool || match.winPrize || match.prizes?.first || 0;
        }

        return {
          userId:     p.userId,
          inGameName: p.inGameName || "",
          position:   pos,
          kills:      Number(p.kills) || 0,
          killPrize:  cfg.logic === "solo_kill" ? (Number(p.kills) || 0) * (match.perKill || 0) : 0,
          posPrize:   prize - ((cfg.logic === "solo_kill") ? (Number(p.kills) || 0) * (match.perKill || 0) : 0),
          prize:      Math.floor(prize),
          rank:       pos,
        };
      });

      const totalDistributed = finalResults.reduce((s, p) => s + p.prize, 0);

      // Prize pool exceed check
      const prizePool = (match.prizes?.first || 0) + (match.prizes?.second || 0) +
                        (match.prizes?.third || 0) + (match.prizes?.fourth || 0);

      match.results     = finalResults;
      match.status      = "completed";
      match.completedAt = new Date();
      match.deleteAt    = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // ১ মাস পর
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

      log(req.admin.name, `Result: ${match.category} — ${finalResults.length} players — ৳${totalDistributed} distributed`, match.title, "create");

      return res.json({
        success: true,
        message: `✅ Result submitted! ৳${totalDistributed} distributed to ${finalResults.length} players.`,
        totalDistributed,
        prizePoolExceeded: prizePool > 0 && totalDistributed > prizePool,
        data: match,
      });
    }

    // ── BR Duo (position ÷ 2 + individual kill) ───────────────────────────────
    if (cfg.logic === "team_kill") {
      if (!results || results.length === 0)
        return res.json({ success: false, message: "results required for BR Duo" });

      // Group by team to find team positions
      const teamMap = {};
      for (const p of results) {
        const t = p.team || "A";
        if (!teamMap[t]) teamMap[t] = { players: [], position: Number(p.position) || 99 };
        teamMap[t].players.push(p);
        if (Number(p.position) < teamMap[t].position)
          teamMap[t].position = Number(p.position);
      }

      const finalResults = results.map((p) => {
        const t   = p.team || "A";
        const pos = teamMap[t]?.position || 0;

        // Position prize ÷ 2 (team এর দুজনে ভাগ)
        let posPrize = 0;
        if (pos === 1)      posPrize = Math.floor((match.prizes?.first  || 0) / 2);
        else if (pos === 2) posPrize = Math.floor((match.prizes?.second || 0) / 2);
        else if (pos === 3) posPrize = Math.floor((match.prizes?.third  || 0) / 2);
        else if (pos === 4) posPrize = Math.floor((match.prizes?.fourth || 0) / 2);

        // Kill prize individual
        const killPrize = (Number(p.kills) || 0) * (match.perKill || 0);
        const prize     = posPrize + killPrize;

        return {
          userId:     p.userId,
          inGameName: p.inGameName || "",
          position:   pos,
          kills:      Number(p.kills) || 0,
          killPrize,
          posPrize,
          prize:      Math.floor(prize),
          rank:       pos,
          team:       t,
        };
      });

      const totalDistributed = finalResults.reduce((s, p) => s + p.prize, 0);
      const prizePool = (match.prizes?.first || 0) + (match.prizes?.second || 0) +
                        (match.prizes?.third || 0) + (match.prizes?.fourth || 0);

      match.results     = finalResults;
      match.status      = "completed";
      match.completedAt = new Date();
      match.deleteAt    = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
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

      log(req.admin.name, `BR Duo result — ৳${totalDistributed} distributed`, match.title, "create");

      return res.json({
        success: true,
        message: `✅ BR Duo result submitted! ৳${totalDistributed} distributed.`,
        totalDistributed,
        prizePoolExceeded: prizePool > 0 && totalDistributed > prizePool,
        data: match,
      });
    }

    // ── Team Only (BR Squad / CS Duo / CS Squad / CS 6vs6 / LW Duo) ──────────
    if (cfg.logic === "team_only") {
      if (!winnerTeam)
        return res.json({ success: false, message: "winnerTeam ('A' or 'B') required" });

      const pool          = match.prizePool || match.winPrize || 0;
      const winnerPlayers = (match.joinedUsers || []).filter((u) => (u.team || "A") === winnerTeam);
      const actualCount   = winnerPlayers.length || cfg.teamSize;
      const prizeEach     = Math.floor(pool / actualCount);

      const finalResults = (match.joinedUsers || []).map((u) => ({
        userId:     u.userId,
        inGameName: u.inGameName || u.gameName || "",
        position:   (u.team || "A") === winnerTeam ? 1 : 2,
        kills:      0,
        killPrize:  0,
        posPrize:   (u.team || "A") === winnerTeam ? prizeEach : 0,
        prize:      (u.team || "A") === winnerTeam ? prizeEach : 0,
        rank:       (u.team || "A") === winnerTeam ? 1 : 2,
        team:       u.team || "A",
      }));

      const totalDistributed = prizeEach * actualCount;

      match.results     = finalResults;
      match.winnerTeam  = winnerTeam;
      match.status      = "completed";
      match.completedAt = new Date();
      match.deleteAt    = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await match.save();

      for (const player of finalResults) {
        if (player.prize > 0 && player.userId) {
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

      log(req.admin.name, `Team result: Team ${winnerTeam} wins — ${actualCount}×৳${prizeEach}`, match.title, "create");

      return res.json({
        success: true,
        message: `✅ Team ${winnerTeam} winner! ${actualCount} জন × ৳${prizeEach} = ৳${totalDistributed} distributed.`,
        totalDistributed,
        data: match,
      });
    }

    return res.json({ success: false, message: "Unknown match logic" });

  } catch (e) {
    console.error("Result error:", e);
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;