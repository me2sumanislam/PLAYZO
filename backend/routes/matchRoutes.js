 const express = require("express");
const router = express.Router();
const Match = require("../models/Match");

// ================= MIDDLEWARE (TEMP SIMPLE PROTECT) =================
// পরে চাইলে আলাদা file এ move করা যাবে
const protectAdmin = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.json({ success: false, message: "No token found" });
  }

  try {
    const jwt = require("jsonwebtoken");
    const decoded = jwt.verify(token.split(" ")[1], process.env.JWT_SECRET);

    if (decoded.role !== "admin") {
      return res.json({
        success: false,
        message: "Admin only access",
      });
    }

    req.user = decoded;
    next();
  } catch (err) {
    return res.json({
      success: false,
      message: "Invalid token",
    });
  }
};


// ================= CREATE MATCH (ADMIN ONLY) =================
router.post("/create", protectAdmin, async (req, res) => {
  try {
    const match = await Match.create(req.body);

    res.status(201).json({
      success: true,
      message: "Match created successfully",
      data: match,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});


// ================= GET ALL MATCHES =================
router.get("/", async (req, res) => {
  try {
    const matches = await Match.find().sort({ createdAt: -1 });

    res.json(matches);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});


// ================= GET SINGLE MATCH =================
router.get("/:id", async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);

    res.json(match);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});


// ================= UPDATE ROOM (ADMIN ONLY) =================
router.put("/update-room/:id", protectAdmin, async (req, res) => {
  try {
    const { roomId, roomPassword } = req.body;

    const match = await Match.findByIdAndUpdate(
      req.params.id,
      {
        roomId,
        roomPassword,
        isRoomOpen: true,
        status: "live",
      },
      { new: true }
    );

    res.json({
      success: true,
      message: "Room updated successfully",
      data: match,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});


// ================= JOIN MATCH =================
router.put("/join/:id", async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);

    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found",
      });
    }

    if (match.joinedPlayers >= match.totalPlayers) {
      return res.json({
        success: false,
        message: "Match is full",
      });
    }

    match.joinedPlayers += 1;

    await match.save();

    res.json({
      success: true,
      message: "Joined successfully",
      data: match,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

module.exports = router;