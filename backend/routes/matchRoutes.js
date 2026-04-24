 const express = require("express");
const router = express.Router();
const Match = require("../models/Match");

// ➕ CREATE MATCH (ADMIN)
router.post("/create", async (req, res) => {
  try {
    const match = await Match.create(req.body);
    res.json(match);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 📥 GET ALL MATCHES
router.get("/", async (req, res) => {
  const matches = await Match.find();
  res.json(matches);
});

module.exports = router;