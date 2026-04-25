 const Match = require("../models/matchModel");


// ================= CREATE MATCH =================
const createMatch = async (req, res) => {
  try {
    const {
      title,
      category,
      entryFee,
      winPrize,
      totalPlayers,
      roomId,
      roomPassword,
    } = req.body;

    const newMatch = await Match.create({
      title,
      category,
      entryFee,
      winPrize,
      totalPlayers,
      roomId,
      roomPassword,
    });

    res.status(201).json({
      success: true,
      message: "Match created successfully",
      data: newMatch,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ================= GET ALL MATCHES =================
const getMatches = async (req, res) => {
  try {
    const matches = await Match.find().sort({ createdAt: -1 });

    res.json(matches);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


module.exports = {
  createMatch,
  getMatches,
};