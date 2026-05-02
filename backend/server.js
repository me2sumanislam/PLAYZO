 const dns = require("node:dns/promises");
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const dotenv = require("dotenv");
dotenv.config();

require("colors");

const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");

// ================= APP CREATE FIRST =================
const app = express();

// ================= MIDDLEWARE =================
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ================= RATE LIMITING =================

// সব route এ — ১৫ মিনিটে সর্বোচ্চ ১০০ request
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: "অনেক বেশি request। কিছুক্ষণ পর আবার চেষ্টা করুন।" },
  standardHeaders: true,
  legacyHeaders: false,
});

// Login/Register এ — ১৫ মিনিটে সর্বোচ্চ ১০ বার
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "অনেকবার চেষ্টা করেছেন। ১৫ মিনিট পর আবার চেষ্টা করুন।" },
  standardHeaders: true,
  legacyHeaders: false,
});

// Withdraw এ — ১৫ মিনিটে সর্বোচ্চ ৫ বার
const withdrawLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: "অনেক বেশি withdraw request। কিছুক্ষণ পর আবার চেষ্টা করুন।" },
  standardHeaders: true,
  legacyHeaders: false,
});

// Global limiter সব route এ
app.use(globalLimiter);

// ================= DB =================
connectDB();

console.log(
  "MONGO_URI:",
  process.env.MONGO_URI ? "✅ Loaded" : "❌ Not found"
);

// ================= TEST =================
app.get("/", (req, res) => {
  res.json({ success: true, message: "🚀 Playzo Backend is running!" });
});

// ================= ROUTES =================
app.use("/api/matches", require("./routes/matchRoutes"));
app.use("/api/auth", authLimiter, require("./routes/authRoutes"));         // ✅ auth limiter
app.use("/api/admin", authLimiter, require("./routes/adminAuthRoutes"));   // ✅ auth limiter
app.use("/api/admin", require("./routes/admin"));

app.use("/api/wallet", require("./routes/walletRoutes"));
app.use("/api/wallet", require("./routes/deposit"));
app.use("/api/admin", require("./routes/deposit"));

app.use("/api/payment-numbers", require("./routes/paymentNumbers"));
app.use("/admin/payment-numbers", require("./routes/paymentNumbers"));
app.use("/api/admin/payment-numbers", require("./routes/paymentNumbers"));

app.use("/api/users", require("./routes/users"));
app.use("/api/withdraw", withdrawLimiter, require("./routes/withdrawRoutes")); // ✅ withdraw limiter

// ================= ERROR HANDLER =================
app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  res.status(500).json({ message: "Something went wrong!" });
});

// ================= START =================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`.bgCyan.black);
});