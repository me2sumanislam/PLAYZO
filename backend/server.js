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
const Match = require("./models/Match"); // ← যোগ হয়েছে

// ================= APP CREATE =================
const app = express();

// ================= SECURITY MIDDLEWARE =================
app.use(helmet());

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ================= RATE LIMITING =================
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: "অনেকবার চেষ্টা করেছেন। ১৫ মিনিট পর আবার চেষ্টা করুন।" },
  standardHeaders: true,
  legacyHeaders: false,
});

// ================= DB =================
connectDB().then(() => {

  // ──────────────────────────────────────
  // AUTO DELETE — result submit এর পর
  // deleteAt পার হলে match delete হবে
  // ──────────────────────────────────────
  setInterval(async () => {
    try {
      const deleted = await Match.deleteMany({
        status: "completed",
        deleteAt: { $lte: new Date() },
      });
      if (deleted.deletedCount > 0) {
        console.log(`🗑️  ${deleted.deletedCount} completed match(es) auto deleted`.bgRed.white);
      }
    } catch (err) {
      console.error("Auto delete error:", err.message);
    }
  }, 60 * 1000); // প্রতি ১ মিনিটে check

});

console.log(
  "MONGO_URI:",
  process.env.MONGO_URI ? "✅ Loaded" : "❌ Not found"
);

// ================= TEST =================
app.get("/", (req, res) => {
  res.json({ success: true, message: "🚀 Playzo Backend is running!" });
});

// ================= ROUTES =================
app.use("/api/matches",               require("./routes/matchRoutes"));
app.use("/api/auth",                  authLimiter, require("./routes/authRoutes"));
app.use("/api/admin",                 authLimiter, require("./routes/adminAuthRoutes"));
app.use("/api/admin",                 require("./routes/admin"));
app.use("/api/wallet",                require("./routes/walletRoutes"));
app.use("/api/payment-numbers",       require("./routes/paymentNumbers"));
app.use("/admin/payment-numbers",     require("./routes/paymentNumbers"));
app.use("/api/admin/payment-numbers", require("./routes/paymentNumbers"));
app.use("/api/users",                 require("./routes/users"));
app.use("/api/withdraw",              require("./routes/withdrawRoutes"));

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