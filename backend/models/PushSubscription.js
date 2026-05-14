 const mongoose = require("mongoose");

const pushSubscriptionSchema = new mongoose.Schema({
  endpoint: { type: String, required: true, unique: true },
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  subscription: { type: Object, required: true },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("PushSubscription", pushSubscriptionSchema);