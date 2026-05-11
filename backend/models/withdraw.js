const mongoose = require("mongoose");

const WithdrawSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true },
  method: { type: String, enum: ["bKash", "Nagad", "Rocket"], required: true },
  accountNo: { type: String, required: true },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  trxId: String,
  note: String,
  approvedBy: String,
  rejectedBy: String,
}, { timestamps: true });

module.exports = mongoose.model("Withdraw", WithdrawSchema);
