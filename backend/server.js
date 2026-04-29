 const dns = require("node:dns/promises");
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const dotenv = require("dotenv");
dotenv.config();

require("colors");

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();

// ================= MIDDLEWARE =================
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ================= DB CONNECTION =================
connectDB();

// ================= LOG CHECK =================
console.log(
  "MONGO_URI:",
  process.env.MONGO_URI ? "✅ Loaded" : "❌ Not found"
);

// ================= TEST ROUTE =================
app.get("/", (req, res) => {
  res.json({ success: true, message: "🚀 Playzo Backend is running!" });
});

// ================= MATCH ROUTES =================
app.use("/api/matches", require("./routes/matchRoutes"));

// ================= AUTH ROUTES =================
app.use("/api/auth", require("./routes/authRoutes"));

// ================= ADMIN AUTH ROUTES =================
app.use("/api/admin", require("./routes/adminAuthRoutes"));

// ================= NEW ADMIN PANEL ROUTES =================
app.use("/api/admin", require("./routes/admin"));

// ================= WALLET ROUTES =================
app.use("/api/wallet", require("./routes/walletRoutes"));

// ================= PAYMENT NUMBERS (User side — active only) =================
const PaymentNumber = require("./models/PaymentNumber");
app.get("/api/payment-numbers", async (req, res) => {
  try {
    const data = await PaymentNumber.find({ active: true }).sort({ createdAt: -1 });
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ================= PAYMENT NUMBERS ADMIN ROUTES =================
app.use("/api/admin/payment-numbers", require("./routes/paymentNumbers"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`.bgCyan.black);
});