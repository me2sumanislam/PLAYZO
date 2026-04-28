 const mongoose = require("mongoose");

const depositSchema = new mongoose.Schema({
  method: {
    type: String,
    enum: ["bkash", "nagad", "rocket"],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  trxId: {
    type: String,
    required: true,
    trim: true,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Deposit", depositSchema);
