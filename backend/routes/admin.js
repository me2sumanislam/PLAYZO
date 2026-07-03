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

// ✅ Gem Referral System — fraud detection helpers
const {
  isDuplicateTrx,
  findSameDeviceReferrals,
  isOverDailyGemCap,
} = require("../utils/referralFraud");

// ✅ Deposit amount অনুযায়ী কত gem পাবে
function calcGemTier(amount) {
  if (amount >= 100) return 10;
  if (amount >= 50) return 5;
  return 0;
}

const JWT_SECRET  = process.env.JWT_SECRET || "your_secret_key";
const ADMIN_ROLES = ["admin", "super-admin", "finance"];

// ─── Prize Logic Config ───────────────────────────────────────────────────────
// matchLogic:
//   "solo_kill"  → BR Solo: position prize + kill × perKill
//   "solo_pos"   → CS Solo / LW Solo: winner 1 জন → 100% prizePool
//   "team_only"  → BR Duo/Squad, CS Duo/Squad/6vs6, LW Duo:
//                  kill prize নেই, winner team সমান ভাগ

const CATEGORY_CONFIG = {
  br_solo:     { matchType: "solo", teamSize: 1, logic: "solo_kill",  killPrize: true  },
  br_duo:      { matchType: "team", teamSize: 2, logic: "team_only",  killPrize: false },
  br_squad:    { matchType: "team", teamSize: 4, logic: "team_only",  killPrize: false },
  cs_solo:     { matchType: "solo", teamSize: 1, logic: "solo_pos",   killPrize: false },
  cs_duo:      { matchType: "team", teamSize: 2, logic: "team_only",  killPrize: false },
  cs_squad:    { matchType: "team", teamSize: 4, logic: "team_only",  killPrize: false },
  cs_6vs6:     { matchType: "team", teamSize: 6, logic: "team_only",  killPrize: false },
  lw_solo:     { matchType: "solo", teamSize: 1, logic: "solo_pos",   killPrize: false },
  lw_duo:      { matchType: "team", teamSize: 2, logic: "team_only",  killPrize: false },
  // backward compat
  br_match:    { matchType: "solo", teamSize: 1, logic: "solo_kill",  killPrize: true  },
  br_survival: { matchType: "solo", teamSize: 1, logic: "solo_kill",  killPrize: true  },
  clash_squad: { matchType: "team", teamSize: 4, logic: "team_only",  killPrize: false },
  cs_2vs2:     { matchType: "team", teamSize: 2, logic: "team_only",  killPrize: false },
  lone_wolf:   { matchType: "solo", teamSize: 1, logic: "solo_pos",   killPrize: false },
  training:    { matchType: "solo", teamSize: 1, logic: "solo_kill",  killPrize: true  },
  free_match:  { matchType: "solo", teamSize: 1, logic: "solo_kill",  killPrize: true  },
};

// ✅ BR Solo default placement prizes
// Admin match create করার সময় prizes set না করলে এই default ব্যবহার হবে
const BR_SOLO_DEFAULT_PRIZES = {
  first:  60,
  second: 40,
  third:  30,
  fourth: 20,
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

    // ✅ Fraud check: একই trxId আগে অন্য কোনো approved deposit এ ব্যবহার হয়েছে কিনা
    if (await isDuplicateTrx(dep.trxId, dep._id)) {
      return res.json({
        success: false,
        message: "⚠️ এই Transaction ID আগে অন্য একটি deposit এ ব্যবহার হয়েছে — reject করে user কে জানান",
      });
    }

    dep.status = "approved";
    dep.approvedBy = req.admin.name;
    await dep.save();

    const depositedUser = await User.findByIdAndUpdate(
      dep.userId._id || dep.userId,
      { $inc: { balance: dep.amount, totalDeposit: dep.amount } },
      { new: true }
    );

    // ✅ REFERRAL GEM LOGIC — deposit approve হলে gemsPending সেট হবে,
    // আসল gem credit হবে B যখন প্রথমবার match join করবে তখন (routes/matchRoutes.js এ)
    const gemTier = calcGemTier(dep.amount);
    if (gemTier > 0 && depositedUser?.referredBy) {
      const referrer = await User.findById(depositedUser.referredBy);
      if (referrer) {
        const refEntry = referrer.referralHistory.find(
          (r) => r.userId.toString() === depositedUser._id.toString()
        );
        if (refEntry && !refEntry.deposited) {
          // ✅ Daily gem cap check — spam/fake referral আটকাতে (শুধু log করি, block করি না)
          if (isOverDailyGemCap(referrer)) {
            console.warn(`⚠️ [Gem Cap] ${referrer.name} আজকের daily gem cap ছুঁয়ে ফেলেছে — admin রিভিউ করুন`);
          }
          refEntry.deposited = true;
          refEntry.depositAmount = dep.amount;
          refEntry.gemsPending = gemTier;
          await referrer.save();
        }
      }
    }

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

// ── COMPLETED MATCHES ─────────────────────────────────────────────────────────
router.get("/completed-matches", authAdmin, async (req, res) => {
  try {
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

 
router.put("/matches/:id/result", authAdmin, async (req, res) => {
  try {
    const { results, winnerUserIds, totalPrize } = req.body;
    const match = await Match.findById(req.params.id);
    if (!match) return res.json({ success: false, message: "Match not found" });

    const cfg = CATEGORY_CONFIG[match.category] || CATEGORY_CONFIG.br_solo;

    // ══════════════════════════════════════════════════════════════════════
    // BR SOLO — Position Prize + Kill Prize
    // ══════════════════════════════════════════════════════════════════════
    if (cfg.logic === "solo_kill") {
      if (!results || results.length === 0)
        return res.json({ success: false, message: "results array required" });

      // ✅ Admin set করা prizes নাও, না থাকলে default ব্যবহার করো
      const p1 = match.prizes?.first  || BR_SOLO_DEFAULT_PRIZES.first;
      const p2 = match.prizes?.second || BR_SOLO_DEFAULT_PRIZES.second;
      const p3 = match.prizes?.third  || BR_SOLO_DEFAULT_PRIZES.third;
      const p4 = match.prizes?.fourth || BR_SOLO_DEFAULT_PRIZES.fourth;
      const kp = match.perKill || 0;  // ✅ Admin set করা perKill (৫ বা ১০ টাকা)

      const finalResults = results.map((p) => {
        const pos         = Number(p.position) || 0;
        const kills       = Number(p.kills)    || 0;
        const killEarning = kills * kp;

        let placementPrize = 0;
        if      (pos === 1) placementPrize = p1;
        else if (pos === 2) placementPrize = p2;
        else if (pos === 3) placementPrize = p3;
        else if (pos === 4) placementPrize = p4;
        // ৫ম-৪৮তম: placement prize = 0, শুধু kill prize

        const prize = Math.floor(placementPrize + killEarning);

        return {
          userId:         p.userId,
          inGameName:     p.inGameName || "",
          position:       pos,
          kills,
          killPrize:      Math.floor(killEarning),
          posPrize:       Math.floor(placementPrize),
          prize,
          rank:           pos,
        };
      });

      const totalDistributed = finalResults.reduce((s, p) => s + p.prize, 0);
      const prizePool        = match.prizePool || match.winPrize || 0;

      // ✅ Red Alert: total kill prize বেশি হলে warn করো
      const totalKillPrize = finalResults.reduce((s, p) => s + p.killPrize, 0);
      const redAlert       = prizePool > 0 && totalDistributed > prizePool;

      if (redAlert) {
        console.warn(`🔴 RED ALERT: "${match.title}" — distributed ৳${totalDistributed} > pool ৳${prizePool}`);
      }

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
                type:       "match_prize",
                amount:     player.prize,
                matchId:    match._id,
                matchTitle: match.title,
                date:       new Date(),
                note:       `Placement: ৳${player.posPrize} + Kills(${player.kills}×৳${kp}): ৳${player.killPrize}`,
              },
            },
          });
        }
      }

      log(
        req.admin.name,
        `BR Solo Result — ${finalResults.length} players — ৳${totalDistributed} distributed${redAlert ? " 🔴 RED ALERT" : ""}`,
        match.title,
        "create"
      );

      return res.json({
        success:           true,
        message:           `✅ Result submitted! ৳${totalDistributed} distributed to ${finalResults.filter(p => p.prize > 0).length} players.`,
        totalDistributed,
        totalKillPrize,
        redAlert,          // ⚠️ Admin panel এ দেখাবে
        data:              match,
      });
    }

    // ══════════════════════════════════════════════════════════════════════
    // CS SOLO / LW SOLO — Winner 1 জন, 100% Prize Pool
    // ══════════════════════════════════════════════════════════════════════
    if (cfg.logic === "solo_pos") {
      if (!results || results.length === 0)
        return res.json({ success: false, message: "results array required" });

      const winnerPrize = match.prizePool || match.winPrize || match.prizes?.first || 0;

      const finalResults = results.map((p) => {
        const pos     = Number(p.position) || 0;
        const isWinner = pos === 1;
        return {
          userId:     p.userId,
          inGameName: p.inGameName || "",
          position:   pos,
          kills:      0,
          killPrize:  0,
          posPrize:   isWinner ? winnerPrize : 0,
          prize:      isWinner ? Math.floor(winnerPrize) : 0,
          rank:       pos,
        };
      });

      const totalDistributed = finalResults.reduce((s, p) => s + p.prize, 0);

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

      log(req.admin.name, `Solo Result — ৳${totalDistributed} to winner`, match.title, "create");

      return res.json({
        success: true,
        message: `✅ Winner কে ৳${totalDistributed} prize দেওয়া হয়েছে।`,
        totalDistributed,
        data: match,
      });
    }

    // ══════════════════════════════════════════════════════════════════════
    // TEAM ONLY — BR Duo/Squad, CS Duo/Squad/6vs6, LW Duo
    // Winner team সমান ভাগে prize পাবে, kill prize নেই
    // ══════════════════════════════════════════════════════════════════════
    if (cfg.logic === "team_only") {
      if (!winnerUserIds || winnerUserIds.length === 0)
        return res.json({ success: false, message: "কমপক্ষে ১ জন winner select করুন" });

      const prize = Number(totalPrize) || 0;
      if (prize <= 0)
        return res.json({ success: false, message: "Prize amount দিন" });

      const winnerSet  = new Set(winnerUserIds.map((id) => id.toString()));
      const prizeEach  = Math.floor(prize / winnerSet.size);

      const finalResults = (match.joinedUsers || []).map((u) => {
        const uid      = u.userId?._id?.toString() || u.userId?.toString();
        const isWinner = winnerSet.has(uid);
        return {
          userId:     u.userId?._id || u.userId,
          inGameName: u.inGameName || u.gameName || "",
          position:   isWinner ? 1 : 0,
          kills:      0,
          killPrize:  0,
          posPrize:   isWinner ? prizeEach : 0,
          prize:      isWinner ? prizeEach : 0,
          rank:       isWinner ? 1 : 0,
        };
      });

      const totalDistributed = prizeEach * winnerSet.size;

      match.results     = finalResults;
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

      log(
        req.admin.name,
        `Team Result — ${winnerSet.size} জন × ৳${prizeEach} = ৳${totalDistributed}`,
        match.title,
        "create"
      );

      return res.json({
        success:          true,
        message:          `✅ ${winnerSet.size} জন winner — প্রতিজন ৳${prizeEach} — মোট ৳${totalDistributed} distributed.`,
        totalDistributed,
        prizeEach,
        data:             match,
      });
    }

    return res.json({ success: false, message: "Unknown match logic" });

  } catch (e) {
    console.error("Result error:", e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// ─── ADMIN: Referral Fraud Alerts ─────────────────────────────────
// একই IP/device থেকে referrer এর একাধিক referred user থাকলে flag করে দেখায়।
// এটা কাউকে ব্লক করে না, শুধু admin কে manual review এর জন্য তালিকা দেয়।
router.get("/referral-fraud-alerts", authAdmin, async (req, res) => {
  try {
    const referrers = await User.find({ referralCount: { $gt: 0 } }, "_id name phone referralCount");
    const alerts = [];

    for (const ref of referrers) {
      const groups = await findSameDeviceReferrals(ref._id);
      if (groups.length > 0) {
        alerts.push({
          referrerId: ref._id,
          referrerName: ref.name,
          referrerPhone: ref.phone,
          suspiciousGroups: groups,
        });
      }
    }

    // Sequential/pattern phone number দিয়ে খোলা account গুলোও আলাদা করে দেখান
    const suspiciousPhoneUsers = await User.find(
      { isSuspicious: true },
      "name phone registerIp suspiciousReason referredBy createdAt"
    ).populate("referredBy", "name phone");

    res.json({ success: true, data: { deviceAlerts: alerts, phonePatternAlerts: suspiciousPhoneUsers } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;