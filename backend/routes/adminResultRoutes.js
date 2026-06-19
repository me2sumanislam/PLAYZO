 // routes/adminResultRoutes.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { getSubmissionsByMatch } = require("../controllers/resultController");
const User = require("../models/User");
const Match = require("../models/Match");
const ResultSubmission = require("../models/ResultSubmission");

const adminOnly = async (req, res, next) => {
  const admin = await User.findById(req.user.id);
  if (!admin || !["admin", "super-admin", "finance"].includes(admin.role)) {
    return res.status(403).json({ success: false, message: "Admin access required" });
  }
  next();
};

// ✅ এই route-টাই missing ছিল — screenshots দেখাচ্ছিল না
// Frontend: GET /api/results/admin/match/:matchId
router.get("/admin/match/:matchId", protect, adminOnly, getSubmissionsByMatch);

// Distribute route (আগের মতোই রাখুন)
router.put("/admin/distribute/:matchId", protect, adminOnly, async (req, res) => {
  try {
    const { winners } = req.body;
    if (!Array.isArray(winners) || winners.length === 0)
      return res.status(400).json({ success: false, message: "কমপক্ষে ১ জন winner দিতে হবে" });

    const match = await Match.findById(req.params.matchId);
    if (!match) return res.status(404).json({ success: false, message: "Match পাওয়া যায়নি" });
    if (match.status === "completed") return res.status(400).json({ success: false, message: "Result already submitted" });
    if (match.prizesDistributed) return res.status(400).json({ success: false, message: "Prize already distributed" });

    let totalDistributed = 0;
    const finalResults = [];

    for (let i = 0; i < winners.length; i++) {
      const winner = winners[i];
      const user = await User.findById(winner.userId);
      if (!user) continue;
      const prize = Number(winner.prize) || 0;
      if (prize <= 0) continue;
      totalDistributed += prize;
      user.balance = (user.balance || 0) + prize;
      if (!user.transactions) user.transactions = [];
      user.transactions.push({ type: "match_prize", amount: prize, matchId: match._id, matchTitle: match.title, date: new Date() });
      await user.save();
      finalResults.push({ userId: user._id, inGameName: winner.inGameName || user.inGameName || user.name || "Player", prize, position: i + 1 });
    }

    match.results = finalResults;
    match.status = "completed";
    match.completedAt = new Date();
    match.prizesDistributed = true;
    match.deleteAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await match.save();

    await ResultSubmission.updateMany({ match: match._id }, { $set: { status: "published" } });

    return res.json({ success: true, message: `✅ ৳${totalDistributed} successfully distributed`, totalDistributed, winnersDistributed: finalResults.length, results: finalResults });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
});

module.exports = router;