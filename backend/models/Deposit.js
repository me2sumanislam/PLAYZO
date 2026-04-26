 const mongoose = require("mongoose");
const DepositSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  amount: Number,
  method: String,
  status: { type: String, enum: ["pending","approved","rejected"], default: "pending" },
  approvedBy: String,
  rejectedBy: String,
}, { timestamps: true });
module.exports = mongoose.model("Deposit", DepositSchema);