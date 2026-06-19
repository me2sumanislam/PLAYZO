 const dns = require("node:dns/promises");
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const dotenv = require("dotenv");
dotenv.config();

require("colors");

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");

const Match = require("./models/Match");   // ← এই লাইনটি যোগ করা হয়েছে

const app = express();

// Security Middleware
app.use(helmet());

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:4173",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS blocked: " + origin));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Rate Limiter
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    message: "অনেকবার চেষ্টা করেছেন। ১৫ মিনিট পর আবার চেষ্টা করুন।",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ================= ROUTES =================
app.get("/", (req, res) => {
  res.json({ success: true, message: "🚀 Playzo Backend is running!" });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Main Routes
app.use("/api/referral", require("./routes/referralRoutes"));
app.use("/api/matches", require("./routes/matchRoutes"));
app.use("/api/auth", authLimiter, require("./routes/authRoutes"));
app.use("/api/admin", authLimiter, require("./routes/adminAuthRoutes"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/wallet", require("./routes/walletRoutes"));
app.use("/api/payment-numbers", require("./routes/paymentNumbers"));
app.use("/api/users", require("./routes/users"));
app.use("/api/withdraw", require("./routes/withdrawRoutes"));
app.use("/api/leaderboard", require("./routes/leaderboardRoutes"));
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api/ludo-matches", require("./routes/ludoMatchRoutes"));
app.use("/api/ludo-tournament", require("./routes/ludoMatchRoutes"));

// Result Routes
app.use("/api/result", require("./routes/resultRoutes"));

// ================= ERROR HANDLER =================
app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  res.status(500).json({ success: false, message: "Something went wrong!" });
});

// ================= DATABASE + SERVER START =================
const PORT = process.env.PORT || 5000;

console.log(
  "MONGO_URI:",
  process.env.MONGO_URI ? "✅ Loaded" : "❌ Not found"
);

connectDB()
  .then(() => {
    console.log("✅ MongoDB Connected Successfully".bgGreen.black);

    // Auto delete old completed matches
    setInterval(async () => {
      try {
        const deleted = await Match.deleteMany({
          status: "completed",
          deleteAt: { $lte: new Date() },
        });
        if (deleted.deletedCount > 0) {
          console.log(
            `🗑️ ${deleted.deletedCount} completed match(es) auto deleted`.bgRed.white
          );
        }
      } catch (err) {
        console.error("Auto delete error:", err.message);
      }
    }, 60 * 1000);

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`.bgCyan.black);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:".bgRed.white, err.message);
    process.exit(1);
  });