 const mongoose = require("mongoose");

const paymentNumberSchema = new mongoose.Schema(
  {
    method: {
      type: String,
      enum: ["bkash", "nagad", "rocket"],
      required: true,
    },
    number: {
      type: String,
      required: true,
      trim: true,
    },
    limit: {
      type: Number,
      default: null,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PaymentNumber", paymentNumberSchema);