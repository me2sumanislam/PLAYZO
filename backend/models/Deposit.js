 const mongoose = require("mongoose");

const depositSchema = new mongoose.Schema({
  method: {
    type: String,
    enum: ["bkash", "nagad", "rocket"], // ✅ fixed
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 1,
  },
  trxId: {
    type: String,
    required: true,
    trim: true,
  },
  paymentNumber: {
    type: String,
    default: null,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
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