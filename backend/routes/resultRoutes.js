 const express = require("express");
const jwt = require("jsonwebtoken");

const router = express.Router();

const Match = require("../models/Match");
const User = require("../models/User");
const ResultSubmission = require("../models/ResultSubmission");
 const { protect } = require("../middleware/auth");

// ════════════════════════════════════════════════════════════════
// ADMIN CUSTOM WINNER DISTRIBUTION
// PUT /api/result/admin/distribute/:matchId
// ════════════════════════════════════════════════════════════════

 router.put("/admin/distribute/:matchId", protect, async (req, res) => {
    try {
      const userId = req.user.id;

      const admin = await User.findById(userId);

      if (
        !admin ||
        !["admin", "super-admin", "finance"].includes(
          admin.role
        )
      ) {
        return res.status(403).json({
          success: false,
          message: "Admin access required",
        });
      }

      const { winners } = req.body;

      if (
        !Array.isArray(winners) ||
        winners.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message: "কমপক্ষে ১ জন winner দিন",
        });
      }

      const match = await Match.findById(
        req.params.matchId
      );

      if (!match) {
        return res.status(404).json({
          success: false,
          message: "Match পাওয়া যায়নি",
        });
      }

      // already completed check
      if (match.status === "completed") {
        return res.status(400).json({
          success: false,
          message: "Result already submitted",
        });
      }

      // duplicate protection
      if (match.prizesDistributed) {
        return res.status(400).json({
          success: false,
          message: "Prize already distributed",
        });
      }

      let totalDistributed = 0;

      const finalResults = [];

      for (let i = 0; i < winners.length; i++) {
        const winner = winners[i];

        const user = await User.findById(
          winner.userId
        );

        if (!user) continue;

        const prize =
          Number(winner.prize) || 0;

        if (prize <= 0) continue;

        totalDistributed += prize;

        // update balance
        user.balance =
          (user.balance || 0) + prize;

        // transaction history
        if (!user.transactions) {
          user.transactions = [];
        }

        user.transactions.push({
          type: "match_prize",
          amount: prize,
          matchId: match._id,
          matchTitle: match.title,
          date: new Date(),
        });

        await user.save();

        finalResults.push({
          userId: user._id,

          inGameName:
            winner.inGameName ||
            user.inGameName ||
            user.name ||
            "Player",

          prize,

          position: i + 1,
        });

        // notification
        try {
          const {
            sendToUser,
          } = require("../utils/sendNotification");

          await sendToUser({
            userId: user._id,

            title: "🏆 Prize Added",

            message: `আপনি ${match.title} match থেকে ৳${prize} জিতেছেন!`,

            url: "/wallet",

            matchId: match._id,

            category: "match_result",
          });
        } catch (err) {
          console.log(
            "Notification Error:",
            err.message
          );
        }
      }

      // save results
      match.results = finalResults;

      match.status = "completed";

      match.completedAt = new Date();

      match.prizesDistributed = true;

      // auto delete after 30 days
      match.deleteAt = new Date(
        Date.now() +
          30 * 24 * 60 * 60 * 1000
      );

      await match.save();

      // publish submissions
      await ResultSubmission.updateMany(
        {
          match: match._id,
        },
        {
          $set: {
            status: "published",
          },
        }
      );

      return res.json({
        success: true,

        message: `✅ ৳${totalDistributed} distributed successfully`,

        totalDistributed,

        winners: finalResults.length,

        results: finalResults,
      });
    } catch (err) {
      console.error(err);

      res.status(500).json({
        success: false,
        message:
          err.message || "Server Error",
      });
    }
  }
);

module.exports = router;