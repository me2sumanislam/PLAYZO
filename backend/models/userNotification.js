 // models/userNotification.js
const mongoose = require("mongoose");

const userNotificationSchema = new mongoose.Schema(
  {
    notificationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Notification",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Index for fast per-user queries
userNotificationSchema.index({ userId: 1, isRead: 1 });
userNotificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("UserNotification", userNotificationSchema);