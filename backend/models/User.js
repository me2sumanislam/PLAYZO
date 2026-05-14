 const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name:               { type: String, trim: true, default: "" },
    inGameName:         { type: String, trim: true, default: "" },
    email:              { type: String, trim: true, default: "" },
    phone:              { type: String, required: true, unique: true, trim: true },
    password:           { type: String, required: true },
    role:               { type: String, enum: ["user", "admin", "super-admin", "finance"], default: "user" },
    balance:            { type: Number, default: 0 },
    totalMatchesPlayed: { type: Number, default: 0 },
    totalWins:          { type: Number, default: 0 },
    isBlocked:          { type: Boolean, default: false },
    lastLogin:          { type: Date },

    // ✅ Join History
    joinHistory: [
      {
        matchId:    { type: mongoose.Schema.Types.ObjectId, ref: "Match" },
        matchTitle: { type: String },
        entryFee:   { type: Number },
        joinedAt:   { type: Date, default: Date.now },
      }
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);