 // models/PushSubscription.js
const mongoose = require("mongoose");

const pushSubscriptionSchema = new mongoose.Schema({
  endpoint: { 
    type: String, 
    required: true, 
    unique: true          // এটা রাখুন (অটো ইনডেক্স তৈরি করে)
  },
  
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    default: null 
  },
  
  subscription: { 
    type: Object, 
    required: true 
  },
  
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  
  updatedAt: { 
    type: Date, 
    default: Date.now 
  },
}, { timestamps: true });

// ✅ শুধু userId এর ইনডেক্স রাখুন
pushSubscriptionSchema.index({ userId: 1 });

// endpoint এর জন্য explicit index লাগবে না (unique: true যথেষ্ট)

module.exports = mongoose.model("PushSubscription", pushSubscriptionSchema);