 const express = require("express");
const router = express.Router();
const PaymentNumber = require("../models/PaymentNumber");

// GET all

router.get("/", async (req, res) => {
  try {
    const { activeOnly } = req.query;
    const filter = activeOnly === "true" ? { active: true } : {};
    const data = await PaymentNumber.find(filter).sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST create
router.post("/", async (req, res) => {
  try {
    const item = await PaymentNumber.create(req.body);
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update
router.put("/:id", async (req, res) => {
  try {
    const item = await PaymentNumber.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE
router.delete("/:id", async (req, res) => {
  try {
    await PaymentNumber.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;