 const mongoose = require("mongoose");
 
 const depositSchema = new mongoose.Schema({
   // কোন method দিয়ে পাঠিয়েছে
   method: {
     type: String,
     enum: ["bkash", "nagad", "rocket"],
     required: true,
   },
 
   // কত টাকা
   amount: {
     type: Number,
     required: true,
     min: 1,
   },
 
   // Transaction ID
   trxId: {
     type: String,
     required: true,
     trim: true,
   },
 
   // কোন user এর request (optional — login system থাকলে পাঠাবেন)
   userId: {
     type: mongoose.Schema.Types.ObjectId,
     ref: "User",
     default: null,
   },
 
   // Admin approve/reject করবে
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
 