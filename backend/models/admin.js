 const mongoose = require("mongoose");
const AdminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["admin","super-admin","finance"], default: "admin" },
}, { timestamps: true });
module.exports = mongoose.model("Admin", AdminSchema);