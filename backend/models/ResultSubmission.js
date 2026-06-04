 // models/ResultSubmission.js  ← নতুন ফাইল, models/ folder এ রাখুন
const mongoose = require("mongoose");

const playerSchema = new mongoose.Schema({
  inGameName:    { type: String, required: true },
  kills:         { type: Number, default: 0 },
  rank:          { type: Number, default: 0 },
  isMatched:     { type: Boolean, default: false }, // joined list এর সাথে match হয়েছে?
  matchedUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  prizeAwarded:  { type: Number, default: 0 },
}, { _id: false });

const resultSubmissionSchema = new mongoose.Schema({
  match: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Match",
    required: true,
    unique: true, // একটা match এ একটাই submission
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  screenshot: {
    url:      { type: String, required: true },
    publicId: { type: String, required: true },
  },
  ocrRawText:   { type: String, default: "" },
  ocrPlayers:   [playerSchema], // OCR যা detect করেছে
  finalPlayers: [playerSchema], // admin edit করার পরের final version

  status: {
    type: String,
    enum: ["processing", "pending_review", "approved", "rejected", "published"],
    default: "processing",
  },
  adminNote:  { type: String, default: "" },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  reviewedAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model("ResultSubmission", resultSubmissionSchema);