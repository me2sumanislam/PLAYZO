 // models/Notification.js
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    matchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Match",
      default: null,
    },
    category: {
      type: String,
      enum: ["general", "freefire", "ludo"],
      default: "general",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);