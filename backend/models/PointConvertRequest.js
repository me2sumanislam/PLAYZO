 // models/PointConvertRequest.js
const mongoose = require("mongoose");

const pointConvertRequestSchema = new mongoose.Schema(
  {
    userId:     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    points:     { type: Number, required: true },   // কতো points convert করতে চাইছে
    taka:       { type: Number, required: true },   // কতো টাকা পাবে (100 points = ৳100)
    status:     { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    adminNote:  { type: String, default: "" },      // admin এর comment (optional)
  },
  { timestamps: true }
);

module.exports = mongoose.model("PointConvertRequest", pointConvertRequestSchema);