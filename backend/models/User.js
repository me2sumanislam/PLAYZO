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

    // ✅ Fraud-detection metadata (registration সময় capture হবে — routes/authRoutes.js দেখুন)
    registerIp:         { type: String, default: "" },
    deviceId:           { type: String, default: "" }, // frontend থেকে optional localStorage-generated id
    isSuspicious:        { type: Boolean, default: false }, // admin flag করলে true হবে
    suspiciousReason:    { type: String, default: "" },

    // ✅ Referral System — Gem based (gem কখনো taka তে convert হয় না)
    referralCode:       { type: String, unique: true },
    referredBy:         { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    gems:                { type: Number, default: 0 }, // ⚠️ পুরনো referralPoints বাদ, gems দিয়ে replace
    referralCount:      { type: Number, default: 0 },
    referralHistory: [
      {
        userId:        { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        name:          { type: String },
        phone:         { type: String },
        deposited:     { type: Boolean, default: false },   // B প্রথমবার deposit করেছে কিনা
        depositAmount: { type: Number, default: 0 },         // সেই deposit এর amount (gem tier হিসাব করতে)
        gemsPending:   { type: Number, default: 0 },         // deposit অনুযায়ী কত gem পাওয়ার কথা (match join এর অপেক্ষায়)
        gemGiven:      { type: Boolean, default: false },    // gem ইতিমধ্যে credit হয়েছে কিনা
        joinedAt:      { type: Date, default: Date.now },
      }
    ],

    // ✅ Join History
    joinHistory: [
      {
        matchId:    { type: mongoose.Schema.Types.ObjectId, ref: "Match" },
        matchTitle: { type: String },
        entryFee:   { type: Number },
        paidWithGem: { type: Boolean, default: false }, // gem দিয়ে join করেছিল কিনা
        joinedAt:   { type: Date, default: Date.now },
      }
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);