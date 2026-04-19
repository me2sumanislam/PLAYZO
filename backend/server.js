 const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
require("colors");

// 🔥 DNS FIX for MongoDB Atlas SRV (querySrv ECONNREFUSED)
const dns = require("node:dns/promises");
dns.setServers(["1.1.1.1", "8.8.8.8"]);   // Cloudflare + Google DNS

// env load
dotenv.config();

const connectDB = require("./config/db");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

console.log("MONGO_URI:", process.env.MONGO_URI ? "✅ Loaded" : "❌ Not found");

connectDB();

// Test route
app.get("/", (req, res) => {
  res.send("🚀 Playzo Backend is running!");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`.bgCyan.black);
});