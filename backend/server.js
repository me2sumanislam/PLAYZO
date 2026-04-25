 const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
require("colors");

// 🔥 DNS FIX for MongoDB Atlas SRV issue
const dns = require("node:dns/promises");
dns.setServers(["1.1.1.1", "8.8.8.8"]); // Cloudflare + Google DNS

dotenv.config();

// DB CONNECT
const connectDB = require("./config/db");

const app = express();

// ================= MIDDLEWARE =================
app.use(cors());
app.use(express.json());

// ================= DB CONNECTION =================
connectDB();

// ================= LOG CHECK =================
console.log(
  "MONGO_URI:",
  process.env.MONGO_URI ? "✅ Loaded" : "❌ Not found"
);

// ================= TEST ROUTE =================
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🚀 Playzo Backend is running!",
  });
});

// ================= MATCH ROUTES =================
const matchRoutes = require("./routes/matchRoutes");
app.use("/api/matches", matchRoutes);

// ================= AUTH ROUTES =================
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

// ================= ADMIN AUTH ROUTES =================
const adminAuthRoutes = require("./routes/adminAuthRoutes");
app.use("/api/admin", adminAuthRoutes);

// ================= FUTURE ROUTES =================
// app.use("/api/users", require("./routes/userRoutes"));
// app.use("/api/wallet", require("./routes/walletRoutes"));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`.bgCyan.black);
});