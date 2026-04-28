const express = require("express");
const router = express.Router();
const Deposit = require("../models/Deposit");

// ─────────────────────────────────────────────
// User: deposit submit করা
// POST /api/wallet/deposit
// ─────────────────────────────────────────────
router.post("/deposit", async (req, res) => {
  try {
    const { method, amount, trxId } = req.body;

    if (!method || !amount || !trxId) {
      return res
        .status(400)
        .json({ success: false, message: "method, amount এবং trxId দিন" });
    }

    const deposit = await Deposit.create({ method, amount, trxId });

    res.json({ success: true, deposit });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────
// Admin: সব pending deposit দেখা
// GET /api/wallet/deposits
// ─────────────────────────────────────────────
router.get("/deposits", async (req, res) => {
  try {
    const deposits = await Deposit.find({ status: "pending" }).sort({
      createdAt: -1,
    });
    res.json(deposits);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─────────────────────────────────────────────
// Admin: approve বা reject করা
// PATCH /api/wallet/deposit/:id
// ─────────────────────────────────────────────
router.patch("/deposit/:id", async (req, res) => {
  try {
    const { status } = req.body; // "approved" অথবা "rejected"

    const deposit = await Deposit.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!deposit) {
      return res
        .status(404)
        .json({ success: false, message: "Deposit পাওয়া যায়নি" });
    }

    res.json({ success: true, deposit });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;