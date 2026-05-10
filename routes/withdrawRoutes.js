 const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const {
  createWithdraw,
  myWithdraw,
  getAllWithdraw,
  approveWithdraw,
  rejectWithdraw,
} = require("../controllers/withdrawController");
const { protect, adminOnly } = require("../middleware/auth");

// শুধু withdraw submit এ limit — ১ ঘণ্টায় ১০ বার
const withdrawLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { message: "অনেক বেশি withdraw request। ১ ঘণ্টা পর আবার চেষ্টা করুন।" },
  standardHeaders: true,
  legacyHeaders: false,
});

// USER
router.post("/request", protect, withdrawLimiter, createWithdraw);
router.get("/my",       protect, myWithdraw);

// ADMIN — কোনো limit নেই
router.get("/admin/all",          protect, adminOnly, getAllWithdraw);
router.put("/admin/approve/:id",  protect, adminOnly, approveWithdraw);
router.put("/admin/reject/:id",   protect, adminOnly, rejectWithdraw);

module.exports = router;