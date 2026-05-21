// models/Notification.js

const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    title: { 
      type: String, 
      required: true 
    },
    message: { 
      type: String, 
      required: true 
    },
    isRead: { 
      type: Boolean, 
      default: false 
    }, // ইউজার বেল আইকন ওপেন করে দেখেছে কিনা
    matchId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Match", 
      default: null 
    } // কোন ম্যাচের নোটিফিকেশন সেটির আইডি
  },
  { timestamps: true } // এটি নোটিফিকেশন তৈরির সময় (createdAt) অটোমেটিক সেভ রাখবে
);

module.exports = mongoose.model("Notification", notificationSchema);