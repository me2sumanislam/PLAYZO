//  const express = require("express");
// const router = express.Router();
// const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");

// const User = require("../models/User");
// const Deposit = require("../models/Deposit");
// const Withdraw = require("../models/withdraw");
// const Match = require("../models/Match");
// const ActivityLog = require("../models/ActivityLog");
// const PaymentNumber = require("../models/PaymentNumber");

// const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";
// const ADMIN_ROLES = ["admin", "super-admin", "finance"];

// const authAdmin = async (req, res, next) => {
//   try {
//     const token = req.headers.authorization?.split(" ")[1];
//     if (!token) return res.status(401).json({ success: false, message: "No token" });
//     const decoded = jwt.verify(token, JWT_SECRET);
//     const user = await User.findById(decoded.id);
//     if (!user || !ADMIN_ROLES.includes(user.role)) {
//       return res.status(401).json({ success: false, message: "Admin not found" });
//     }
//     req.admin = user;
//     next();
//   } catch {
//     res.status(401).json({ success: false, message: "Invalid token" });
//   }
// };

// const log = (adminName, action, target, type) =>
//   ActivityLog.create({ adminName, action, target, type }).catch(() => {});

// // STATS
// router.get("/stats", authAdmin, async (req, res) => {
//   try {
//     const [
//       totalDeposit, totalWithdraw,
//       pendingDepositAmount, pendingWithdrawAmount,
//       pendingDeposit, pendingWithdraw,
//       totalUsers, totalMatches,
//     ] = await Promise.all([
//       Deposit.aggregate([{ $match: { status: "approved" } }, { $group: { _id: null, sum: { $sum: "$amount" } } }]),
//       Withdraw.aggregate([{ $match: { status: "approved" } }, { $group: { _id: null, sum: { $sum: "$amount" } } }]),
//       Deposit.aggregate([{ $match: { status: "pending" } }, { $group: { _id: null, sum: { $sum: "$amount" } } }]),
//       Withdraw.aggregate([{ $match: { status: "pending" } }, { $group: { _id: null, sum: { $sum: "$amount" } } }]),
//       Deposit.countDocuments({ status: "pending" }),
//       Withdraw.countDocuments({ status: "pending" }),
//       User.countDocuments(),
//       Match.countDocuments(),
//     ]);

//     res.json({
//       success: true,
//       data: {
//         totalDeposit: totalDeposit[0]?.sum || 0,
//         totalWithdraw: totalWithdraw[0]?.sum || 0,
//         pendingDepositAmount: pendingDepositAmount[0]?.sum || 0,
//         pendingWithdrawAmount: pendingWithdrawAmount[0]?.sum || 0,
//         pendingDeposit,
//         pendingWithdraw,
//         totalUsers,
//         totalMatches,
//       },
//     });
//   } catch (e) {
//     res.status(500).json({ success: false, message: e.message });
//   }
// });

// // DEPOSITS
// router.get("/deposits", authAdmin, async (req, res) => {
//   try {
//     const { status, limit = 50 } = req.query;
//     const query = status && status !== "all" ? { status } : {};
//     const data = await Deposit.find(query)
//       .populate("userId", "name phone")
//       .sort({ createdAt: -1 })
//       .limit(Number(limit));

//     // frontend এ user field expect করে তাই map করি
//     const mapped = data.map(d => ({
//       ...d.toObject(),
//       user: d.userId,
//     }));

//     res.json({ success: true, data: mapped });
//   } catch (e) {
//     res.status(500).json({ success: false, message: e.message });
//   }
// });

// router.put("/deposits/:id/approve", authAdmin, async (req, res) => {
//   try {
//     const dep = await Deposit.findById(req.params.id).populate("userId");
//     if (!dep) return res.json({ success: false, message: "Not found" });
//     if (dep.status !== "pending") return res.json({ success: false, message: "Already processed" });

//     dep.status = "approved";
//     dep.approvedBy = req.admin.name;
//     await dep.save();

//     await User.findByIdAndUpdate(dep.userId._id || dep.userId, {
//       $inc: { balance: dep.amount, totalDeposit: dep.amount },
//     });

//     log(req.admin.name, `approved deposit of ৳${dep.amount}`, dep.userId?.name || "user", "approve");
//     res.json({ success: true, message: "Deposit approved" });
//   } catch (e) {
//     res.status(500).json({ success: false, message: e.message });
//   }
// });

// router.put("/deposits/:id/reject", authAdmin, async (req, res) => {
//   try {
//     const dep = await Deposit.findByIdAndUpdate(
//       req.params.id,
//       { status: "rejected", rejectedBy: req.admin.name },
//       { new: true }
//     ).populate("userId");
//     log(req.admin.name, `rejected deposit of ৳${dep.amount}`, dep.userId?.name || "user", "reject");
//     res.json({ success: true, message: "Deposit rejected" });
//   } catch (e) {
//     res.status(500).json({ success: false, message: e.message });
//   }
// });

// // WITHDRAWALS
// router.get("/withdraws", authAdmin, async (req, res) => {
//   try {
//     const { status, limit = 50 } = req.query;
//     const query = status && status !== "all" ? { status } : {};
//     const data = await Withdraw.find(query)
//       .populate("user", "name phone")
//       .sort({ createdAt: -1 })
//       .limit(Number(limit));
//     res.json({ success: true, data });
//   } catch (e) {
//     res.status(500).json({ success: false, message: e.message });
//   }
// });

// router.put("/withdraws/:id/approve", authAdmin, async (req, res) => {
//   try {
//     const wit = await Withdraw.findById(req.params.id).populate("user");
//     if (!wit) return res.json({ success: false, message: "Not found" });
//     if (wit.status !== "pending") return res.json({ success: false, message: "Already processed" });

//     const user = await User.findById(wit.user._id);
//     if (user.balance < wit.amount) return res.json({ success: false, message: "User has insufficient balance" });

//     wit.status = "approved";
//     wit.approvedBy = req.admin.name;
//     await wit.save();

//     await User.findByIdAndUpdate(wit.user._id, {
//       $inc: { balance: -wit.amount, totalWithdraw: wit.amount },
//     });

//     log(req.admin.name, `approved withdraw of ৳${wit.amount}`, wit.user.name, "approve");
//     res.json({ success: true, message: "Withdraw approved & balance deducted" });
//   } catch (e) {
//     res.status(500).json({ success: false, message: e.message });
//   }
// });

// router.put("/withdraws/:id/reject", authAdmin, async (req, res) => {
//   try {
//     const wit = await Withdraw.findByIdAndUpdate(
//       req.params.id,
//       { status: "rejected", rejectedBy: req.admin.name },
//       { new: true }
//     ).populate("user");
//     log(req.admin.name, `rejected withdraw of ৳${wit.amount}`, wit.user.name, "reject");
//     res.json({ success: true, message: "Withdraw rejected" });
//   } catch (e) {
//     res.status(500).json({ success: false, message: e.message });
//   }
// });

// // USERS
// router.get("/users", authAdmin, async (req, res) => {
//   try {
//     const data = await User.find({}, "name phone balance totalDeposit totalWithdraw banned").sort({ createdAt: -1 });
//     res.json({ success: true, data });
//   } catch (e) {
//     res.status(500).json({ success: false, message: e.message });
//   }
// });

// router.put("/users/:id/ban", authAdmin, async (req, res) => {
//   try {
//     const user = await User.findByIdAndUpdate(req.params.id, { banned: true }, { new: true });
//     log(req.admin.name, "banned user", user.name, "ban");
//     res.json({ success: true });
//   } catch (e) {
//     res.status(500).json({ success: false, message: e.message });
//   }
// });

// router.put("/users/:id/unban", authAdmin, async (req, res) => {
//   try {
//     const user = await User.findByIdAndUpdate(req.params.id, { banned: false }, { new: true });
//     log(req.admin.name, "unbanned user", user.name, "ban");
//     res.json({ success: true });
//   } catch (e) {
//     res.status(500).json({ success: false, message: e.message });
//   }
// });

// // PAYMENT NUMBERS
// router.get("/payment-numbers", authAdmin, async (req, res) => {
//   try {
//     const data = await PaymentNumber.find().sort({ createdAt: -1 });
//     res.json({ success: true, data });
//   } catch (e) {
//     res.status(500).json({ success: false, message: e.message });
//   }
// });

// router.post("/payment-numbers", authAdmin, async (req, res) => {
//   try {
//     const { method, number, limit, active } = req.body;
//     if (!method || !number) return res.json({ success: false, message: "method ও number দিন" });
//     const entry = await PaymentNumber.create({ method, number, limit: limit || null, active: active !== false });
//     log(req.admin.name, `added payment number ${number}`, method, "create");
//     res.json({ success: true, data: entry });
//   } catch (e) {
//     res.status(500).json({ success: false, message: e.message });
//   }
// });

// router.put("/payment-numbers/:id", authAdmin, async (req, res) => {
//   try {
//     const updated = await PaymentNumber.findByIdAndUpdate(
//       req.params.id, { ...req.body }, { new: true }
//     );
//     if (!updated) return res.json({ success: false, message: "Not found" });
//     log(req.admin.name, `updated payment number ${updated.number}`, updated.method, "create");
//     res.json({ success: true, data: updated });
//   } catch (e) {
//     res.status(500).json({ success: false, message: e.message });
//   }
// });

// router.delete("/payment-numbers/:id", authAdmin, async (req, res) => {
//   try {
//     const deleted = await PaymentNumber.findByIdAndDelete(req.params.id);
//     if (!deleted) return res.json({ success: false, message: "Not found" });
//     log(req.admin.name, `deleted payment number ${deleted.number}`, deleted.method, "reject");
//     res.json({ success: true });
//   } catch (e) {
//     res.status(500).json({ success: false, message: e.message });
//   }
// });

// // ACTIVITY LOG
// router.get("/logs", authAdmin, async (req, res) => {
//   try {
//     const data = await ActivityLog.find().sort({ createdAt: -1 }).limit(100);
//     res.json({ success: true, data });
//   } catch (e) {
//     res.status(500).json({ success: false, message: e.message });
//   }
// });

// module.exports = router;

// ══════════════════════════════════════════════════════════════════════════════
// এই code টা backend/routes/admin.js তে
// PUT /api/admin/matches/:id/result  route টা REPLACE করবেন
// ══════════════════════════════════════════════════════════════════════════════

// PUT /api/admin/matches/:id/result
router.put("/matches/:id/result", authAdmin, async (req, res) => {
  try {
    const { results, winnerTeam } = req.body;
    // results = [{ userId, inGameName, position, kills }]
    // winnerTeam = "A" or "B"  (team match এ)

    if (!results || results.length === 0) {
      return res.json({ success: false, message: "results array required" });
    }

    const match = await Match.findById(req.params.id);
    if (!match) return res.json({ success: false, message: "Match not found" });

    // ══════════════════════════════════════════════════════════════════════════
    // TYPE 1 — SOLO / BR_SURVIVAL / TRAINING
    // position prize + kill prize → individual player পায়
    // ══════════════════════════════════════════════════════════════════════════
    if (match.matchType === "solo") {
      const finalResults = results.map((p) => {
        let prize = (Number(p.kills) || 0) * (match.perKill || 0);
        const pos = Number(p.position) || 0;
        if (pos === 1)      prize += match.prizes?.first  || 0;
        else if (pos === 2) prize += match.prizes?.second || 0;
        else if (pos === 3) prize += match.prizes?.third  || 0;
        else if (pos === 4) prize += match.prizes?.fourth || 0;
        return {
          userId:     p.userId,
          inGameName: p.inGameName || "",
          position:   pos,
          kills:      Number(p.kills) || 0,
          prize:      Math.floor(prize),
          rank:       pos,
        };
      });

      match.results     = finalResults;
      match.status      = "completed";
      match.completedAt = new Date();
      await match.save();

      // Prize distribute
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
              },
            },
          });
        }
      }

      log(
        req.admin?.name || "Admin",
        `Solo result: ${finalResults.length} players, total prize ৳${finalResults.reduce((s, p) => s + p.prize, 0)}`,
        match.title,
        "create"
      );

      return res.json({
        success: true,
        message: `Solo result submitted! ${finalResults.length} players — prize distributed.`,
        data:    match,
      });
    }

    // ══════════════════════════════════════════════════════════════════════════
    // TYPE 2 — TEAM MATCH (duo / squad / cs4v4 / cs2v2 / lone_wolf / tdm6v6)
    // winner team select করলে → floor(prizePool ÷ teamSize) সবাই পায়
    // ══════════════════════════════════════════════════════════════════════════
    if (match.matchType === "team") {
      if (!winnerTeam) {
        return res.json({ success: false, message: "winnerTeam ('A' or 'B') required for team match" });
      }

      // prizePool = match.prizePool অথবা match.winPrize (যেটা আছে)
      const pool    = match.prizePool || match.winPrize || 0;
      const tSize   = match.teamSize  || 1;

      // Winner team এর players বের করি joinedUsers থেকে
      const winnerPlayers = (match.joinedUsers || []).filter(
        (u) => u.team === winnerTeam
      );

      // প্রতিজন পাবে
      const prizeEach = Math.floor(pool / Math.max(winnerPlayers.length || tSize, 1));

      const finalResults = (match.joinedUsers || []).map((u) => ({
        userId:     u.userId,
        inGameName: u.inGameName || u.gameName || "",
        position:   u.team === winnerTeam ? 1 : 2,
        kills:      0,
        prize:      u.team === winnerTeam ? prizeEach : 0,
        rank:       u.team === winnerTeam ? 1 : 2,
        team:       u.team,
      }));

      match.results     = finalResults;
      match.winnerTeam  = winnerTeam;
      match.status      = "completed";
      match.completedAt = new Date();
      await match.save();

      // Prize distribute to winner team
      for (const player of finalResults) {
        if (player.prize > 0 && player.userId) {
          await User.findByIdAndUpdate(player.userId, {
            $inc: { balance: player.prize },
            $push: {
              transactions: {
                type:       "match_prize",
                amount:     player.prize,
                matchId:    match._id,
                matchTitle: match.title,
                date:       new Date(),
              },
            },
          });
        }
      }

      log(
        req.admin?.name || "Admin",
        `Team result: Team ${winnerTeam} wins — ${winnerPlayers.length} players × ৳${prizeEach}`,
        match.title,
        "create"
      );

      return res.json({
        success: true,
        message: `Team ${winnerTeam} winner! ${winnerPlayers.length} players × ৳${prizeEach} = ৳${prizeEach * winnerPlayers.length} distributed.`,
        data:    match,
      });
    }

    return res.json({ success: false, message: "Unknown matchType" });

  } catch (e) {
    console.error("Result error:", e);
    res.status(500).json({ success: false, message: e.message });
  }
});