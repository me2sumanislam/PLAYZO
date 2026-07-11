 const dns = require("node:dns/promises");
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const dotenv = require("dotenv");
dotenv.config();

require("colors");

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const resultRoutes = require("./routes/resultRoutes");
const resultAdminRoutes = require("./routes/adminResultRoutes");

// ✅ Shared single Postgres pool (utils/db.js) — সব ফাইল এটাই ব্যবহার করে,
// আলাদা আলাদা new Pool() বানানো বন্ধ করা হয়েছে (connection exhaustion fix)
const pool = require("./utils/db");

const app = express();

// ================= SECURITY =================
app.use(helmet());
app.set("trust proxy", 1); // ✅ Render এর proxy এর পেছনে চলার জন্য দরকার — rate-limit সঠিকভাবে IP identify করার জন্য

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:4173",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
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

// ================= RATE LIMITER (সাধারণ auth) =================
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    message: "অনেকবার চেষ্টা করেছেন। ১৫ মিনিট পর আবার চেষ্টা করুন।",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ================= ADMIN LOGIN RATE LIMITER (কড়া) ================= ✅ নতুন
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8, // ১৫ মিনিটে সর্বোচ্চ ৮টা চেষ্টা — admin panel তাই সাধারণ auth এর চেয়ে অনেক কড়া
  message: {
    message: "অনেকবার চেষ্টা করেছেন। ১৫ মিনিট পর আবার চেষ্টা করুন।",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ================= HEALTH ROUTES =================
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🚀 Playzo Backend is running!",
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

console.log("✅ Registering /api/result");
app.use("/api/result", resultRoutes);

// ================= MAIN ROUTES =================
app.use("/api/referral", require("./routes/referralRoutes"));
app.use("/api/matches", require("./routes/matchRoutes"));
app.use("/api/auth", authLimiter, require("./routes/authRoutes"));
app.use("/api/admin", adminLoginLimiter, require("./routes/adminAuthRoutes")); // ✅ কড়া limiter বসানো হলো
app.use("/api/admin", require("./routes/admin"));
app.use("/api/wallet", require("./routes/walletRoutes"));
app.use("/api/payment-numbers", require("./routes/paymentNumbers"));
app.use("/api/users", require("./routes/users"));
app.use("/api/withdraw", require("./routes/withdrawRoutes"));
app.use("/api/leaderboard", require("./routes/leaderboardRoutes"));
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api/ludo-tournament", require("./routes/ludoMatchRoutes"));
app.use("/api/settings", require("./routes/settingsRoutes"));
app.use("/api/ludo-result", require("./routes/ludoResultRoutes"));

// ================= RESULT ROUTES =================
app.use("/api/result", resultRoutes);
app.use("/api/results", resultAdminRoutes);

// ================= ERROR HANDLER =================
app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  res.status(500).json({
    success: false,
    message: err.message || "Something went wrong!",
  });
});

// ================= DATABASE + SERVER START =================
const PORT = process.env.PORT || 5000;

console.log(
  "SUPABASE_DB_URL:",
  process.env.SUPABASE_DB_URL ? "✅ Loaded" : "❌ Not found"
);

pool
  .query("SELECT 1")
  .then(() => {
    console.log("✅ Supabase (Postgres) Connected Successfully".bgGreen.black);

    // ✅ Auto delete old completed matches (আগে Match.deleteMany দিয়ে হতো, এখন Postgres DELETE)
    setInterval(async () => {
      try {
        const { rowCount } = await pool.query(
          `DELETE FROM matches WHERE status = 'completed' AND delete_at <= now()`
        );
        if (rowCount > 0) {
          console.log(`🗑️ ${rowCount} completed match(es) auto deleted`.bgRed.white);
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
    console.error("❌ Supabase (Postgres) connection failed:".bgRed.white, err.message);
    process.exit(1);
  });