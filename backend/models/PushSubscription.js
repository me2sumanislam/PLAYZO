 // models/PushSubscription.js
const mongoose = require("mongoose");

const pushSubscriptionSchema = new mongoose.Schema({
  endpoint: { 
    type: String, 
    required: true, 
    unique: true 
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

// Index for faster queries
pushSubscriptionSchema.index({ endpoint: 1 });
pushSubscriptionSchema.index({ userId: 1 });

module.exports = mongoose.model("PushSubscription", pushSubscriptionSchema);