 // models/LudoTournament.js
const mongoose = require("mongoose");

const ludoTournamentSchema = new mongoose.Schema({
  title:        { type: String, required: true },
  mode:         { type: String, enum: ["1v1", "2v2", "4player"], default: "4player" },
  
  entryFee:     { type: Number, default: 0 },
  winPrize:     { type: Number, default: 0 },
  totalSlots:   { type: Number, default: 4 },
  joinedPlayers:{ type: Number, default: 0 },
  
  roomCode:     { type: String, default: "" },
  isRoomOpen:   { type: Boolean, default: false },
  
  map:          { type: String, default: "Classic" },
  device:       { type: String, default: "Mobile" },
  image:        { type: String, default: "" },
  
  status:       { type: String, enum: ["upcoming","live","completed","cancelled"], default: "upcoming" },
  startTime:    { type: Date, default: null },
  expiresAt:    { type: Date, default: null },

  // 2v2 এর জন্য Winning Team
  winningTeam:  { type: String, default: "" },

  prizes: {
    first:  { type: Number, default: 0 },
    second: { type: Number, default: 0 },
    third:  { type: Number, default: 0 },
    fourth: { type: Number, default: 0 },
  },

  // For 2v2 mode: teams
  teams: [
    {
      teamName:   { type: String, default: "" },
      players: [
        {
          userId:     { type: mongoose.Schema.Types.ObjectId, ref: "User" },
          slotNumber: { type: Number },
        }
      ],
    }
  ],

  // For 1v1 and 4player: individual slots
  joinedUsers: [
    {
      userId:     { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      slotNumber: { type: Number },
      teamId:     { type: String, default: "" }, // for 2v2 pairing
    }
  ],

  // Result
  results: [
    {
      userId:   { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      rank:     { type: Number },
      prize:    { type: Number, default: 0 },
      kills:    { type: Number, default: 0 },
    }
  ],

}, { timestamps: true });

// Auto-delete 20 min after startTime
ludoTournamentSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("LudoTournament", ludoTournamentSchema);