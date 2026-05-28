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
      ref: "Match",
      default: null,
    },
    // ✅ NEW: কোন গেমের notification সেটা বোঝার জন্য
    category: {
      type: String,
      enum: ["freefire", "ludo", "general"],
      default: "general",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);