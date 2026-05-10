 const mongoose = require("mongoose");
const ActivityLogSchema = new mongoose.Schema({
  adminName: String,
  action: String,
  target: String,
  type: { type: String, enum: ["approve","reject","create","ban","login"] },
}, { timestamps: true });
module.exports = mongoose.model("ActivityLog", ActivityLogSchema);