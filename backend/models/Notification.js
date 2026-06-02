 // models/Notification.js
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    matchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LudoTournament",     // ← এটি পরিবর্তন করা হয়েছে
      default: null,
    },
    // ✅ কোন গেমের notification সেটা বোঝার জন্য
    category: {
      type: String,
      enum: ["freefire", "ludo", "general"],
      default: "general",
    },
    // অপশনাল: নির্দিষ্ট ইউজারের জন্য নোটিফিকেশন
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);