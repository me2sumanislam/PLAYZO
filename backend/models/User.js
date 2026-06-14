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
   transactions: [
  {
    type: {
      type: String,
    },

    amount: {
      type: Number,
    },

    matchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Match",
    },

    matchTitle: String,

    date: {
      type: Date,
      default: Date.now,
    },
  },
],
    totalMatchesPlayed: { type: Number, default: 0 },
    totalWins:          { type: Number, default: 0 },
    isBlocked:          { type: Boolean, default: false },
    lastLogin:          { type: Date },

    // ✅ Referral System
    referralCode:       { type: String, unique: true },
    referredBy:         { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    referralPoints:     { type: Number, default: 0 },
    referralCount:      { type: Number, default: 0 },
    referralHistory: [
      {
        userId:      { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        name:        { type: String },
        phone:       { type: String },
        deposited:   { type: Boolean, default: false },
        pointGiven:  { type: Boolean, default: false },
        joinedAt:    { type: Date, default: Date.now },
      }
    ],

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