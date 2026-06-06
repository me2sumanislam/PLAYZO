 const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema(
  {
    title:    { type: String, required: true },
    category: { type: String, required: true },

    entryFee: { type: Number, required: true, default: 0 },
    winPrize: { type: Number, required: true, default: 0 },

    prizes: {
      first:  { type: Number, default: 0 },
      second: { type: Number, default: 0 },
      third:  { type: Number, default: 0 },
      fourth: { type: Number, default: 0 },
    },

    perKill: { type: Number, default: 0 },

    map:    { type: String, default: "Bermuda" },
    device: { type: String, default: "Mobile" },
    image:  { type: String, default: "" },

    startTime: { type: Date },

    totalPlayers:  { type: Number, default: 48 },
    joinedPlayers: { type: Number, default: 0 },

    joinedUsers: [
      {
        userId:     { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        inGameName: { type: String, default: "" },
        gameName:   { type: String, default: "" }, // ✅ নতুন
        slotNumber: { type: Number },
        joinedAt:   { type: Date, default: Date.now },
      },
    ],

    roomId:       { type: String, default: "" },
    roomPassword: { type: String, default: "" },
    isRoomOpen:   { type: Boolean, default: false },

    results: [
      {
        userId:     { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        inGameName: { type: String },
        position:   { type: Number },
        kills:      { type: Number },
        prize:      { type: Number },
        rank:       { type: Number }, // ✅ নতুন
      },
    ],

    resultSubmissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ResultSubmission",
      default: null,
    },

    completedAt: { type: Date },
    deleteAt:    { type: Date },

    status: { type: String, default: "upcoming" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Match", matchSchema);