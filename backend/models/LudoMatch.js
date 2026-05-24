 const mongoose = require("mongoose");
 
 const ludoMatchSchema = new mongoose.Schema({
   title:         { type: String, required: true },
   category:      { type: String, enum: ["2player", "4player"], default: "4player" },
   entryFee:      { type: Number, default: 0 },
   winPrize:      { type: Number, default: 0 },
   totalPlayers:  { type: Number, default: 4 },
   joinedPlayers: { type: Number, default: 0 },
   roomCode:      { type: String, default: "" },
   isRoomOpen:    { type: Boolean, default: false },
   map:           { type: String, default: "Classic" },
   device:        { type: String, default: "Mobile" },
   image:         { type: String, default: "" },
   status:        { type: String, default: "upcoming" },
   startTime:     { type: Date, default: null },
   expiresAt:     { type: Date, default: null },
 
   prizes: {
     first:  { type: Number, default: 0 },
     second: { type: Number, default: 0 },
     third:  { type: Number, default: 0 },
     fourth: { type: Number, default: 0 },
   },
 
   joinedUsers: [
     {
       userId:     { type: mongoose.Schema.Types.ObjectId, ref: "User" },
       slotNumber: { type: Number },
     }
   ],
 
 }, { timestamps: true });
 
 // TTL index — startTime থেকে 20 মিনিট পরে auto delete
 ludoMatchSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
 
 module.exports = mongoose.model("LudoMatch", ludoMatchSchema);
 