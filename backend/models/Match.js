 // models/Match.js
const mongoose = require("mongoose");

// ─── Match Type Config ────────────────────────────────────────────────────────
// matchType = "solo"   → Type 1: position prize + kill prize (individual)
// matchType = "team"   → Type 2: winner team prize pool ÷ teamSize
//
// mode        teamSize  totalPlayers  matchType
// br_solo        1         48          solo
// br_duo         2         48          team
// br_squad       4         48          team
// clash_squad    4          8          team
// cs_2vs2        2          4          team
// lone_wolf      1          2          team   ← winner takes all
// tdm_6v6        6         12          team
// ─────────────────────────────────────────────────────────────────────────────

const joinedUserSchema = new mongoose.Schema({
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  inGameName: { type: String, default: "" },
  gameName:   { type: String, default: "" },
  slotNumber: { type: Number },
  team:       { type: String, default: "A" }, // "A" or "B" — team match এ কোন দলে
  joinedAt:   { type: Date, default: Date.now },
}, { _id: false });

const matchSchema = new mongoose.Schema({
  title:    { type: String, required: true },
  category: { type: String, required: true },

  // ── Type ──────────────────────────────────────────────────────────────────
  matchType: {
    type: String,
    enum: ["solo", "team"],
    default: "solo",
  },
  teamSize: {
    type: Number,
    default: 1,   // 1=solo/lone_wolf, 2=duo/2v2, 4=squad/cs4v4, 6=6v6
  },

  // ── Finance ───────────────────────────────────────────────────────────────
  entryFee: { type: Number, required: true, default: 0 },
  winPrize: { type: Number, required: true, default: 0 },

  // Solo mode prizes (position based)
  prizes: {
    first:  { type: Number, default: 0 },
    second: { type: Number, default: 0 },
    third:  { type: Number, default: 0 },
    fourth: { type: Number, default: 0 },
  },

  // Solo mode kill prize
  perKill: { type: Number, default: 0 },

  // Team mode: prizePool = total টাকা winner team পাবে (ভাগ হবে teamSize দিয়ে)
  prizePool: { type: Number, default: 0 },

  // ── Match Info ────────────────────────────────────────────────────────────
  map:    { type: String, default: "Bermuda" },
  device: { type: String, default: "Mobile" },
  image:  { type: String, default: "" },

  startTime: { type: Date },

  totalPlayers:  { type: Number, default: 48 },
  joinedPlayers: { type: Number, default: 0 },

  joinedUsers: [joinedUserSchema],

  // ── Room ──────────────────────────────────────────────────────────────────
  roomId:       { type: String, default: "" },
  roomPassword: { type: String, default: "" },
  isRoomOpen:   { type: Boolean, default: false },

  // ── Results ───────────────────────────────────────────────────────────────
  results: [
    {
      userId:     { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      inGameName: { type: String },
      position:   { type: Number },
      kills:      { type: Number, default: 0 },
      prize:      { type: Number, default: 0 },
      rank:       { type: Number },
      team:       { type: String },           // team match result এ winner team
    },
  ],

  // ── Winner Team (team match only) ─────────────────────────────────────────
  winnerTeam: { type: String, default: "" }, // "A" or "B"

  resultSubmissionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ResultSubmission",
    default: null,
  },

  completedAt: { type: Date },
  deleteAt:    { type: Date },
  status:      { type: String, default: "upcoming" },
}, { timestamps: true });

module.exports = mongoose.model("Match", matchSchema);