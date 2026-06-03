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
  enum: [
    "general",
    "freefire",
    "ludo",
    "br_match",
    "br_survival",
    "clash_squad",
    "cs_2vs2",
    "lonewolf",
    "training_match"
  ],
  default: "general",
},
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);