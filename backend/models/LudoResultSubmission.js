 // models/LudoResultSubmission.js
// User-submitted screenshot for ludo tournament result verification

const mongoose = require("mongoose");

const ludoResultSubmissionSchema = new mongoose.Schema(
  {
    match: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "LudoTournament",
      required: true,
    },
    submittedBy: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true,
    },
    screenshot: {
      url:      { type: String, required: true },
      publicId: { type: String, required: true },
    },
    status: {
      type:    String,
      enum:    ["pending_review", "approved", "rejected", "published"],
      default: "pending_review",
    },
    adminNote:  { type: String, default: "" },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// একজন user একটা match এ শুধু ১টাই screenshot দিতে পারবে
ludoResultSubmissionSchema.index({ match: 1, submittedBy: 1 }, { unique: true });

module.exports = mongoose.model("LudoResultSubmission", ludoResultSubmissionSchema);