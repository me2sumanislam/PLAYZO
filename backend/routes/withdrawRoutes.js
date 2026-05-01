 const express = require("express");
const router = express.Router();

const {
  createWithdraw,
  myWithdraw,
  getAllWithdraw,
  approveWithdraw,
  rejectWithdraw
} = require("../controllers/withdrawController");

const { protect, adminOnly } = require("../middleware/auth");

// USER
router.post("/request", protect, createWithdraw);
router.get("/my", protect, myWithdraw);

// ADMIN
router.get("/admin/all", protect, adminOnly, getAllWithdraw);
router.put("/admin/approve/:id", protect, adminOnly, approveWithdraw);
router.put("/admin/reject/:id", protect, adminOnly, rejectWithdraw);

module.exports = router;