

const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema({
  title:         { type: String, required: true },
  category:      { type: String, required: true },
  entryFee:      { type: Number, default: 0 },
  winPrize:      { type: Number, default: 0 },
  perKill:       { type: Number, default: 0 },
  totalPlayers:  { type: Number, default: 48 },
  joinedPlayers: { type: Number, default: 0 },
  roomId:        { type: String, default: "" },
  roomPassword:  { type: String, default: "" },
  map:           { type: String, default: "Bermuda" },
  device:        { type: String, default: "Mobile" },
  image:         { type: String, default: "" },
  status:        { type: String, default: "upcoming" },
  isRoomOpen:    { type: Boolean, default: false },
  startTime:     { type: Date, default: null },   // ✅ required false
  expiresAt:     { type: Date, default: null },   // ✅ TTL field
}, { timestamps: true });

// ✅ TTL index — expiresAt সময়ে auto delete
matchSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Match", matchSchema);