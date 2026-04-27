 const express = require("express");
const router = express.Router();
const Match = require("../models/Match");
const jwt = require("jsonwebtoken");


// ================= ADMIN MIDDLEWARE =================
const protectAdmin = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.json({ success: false, message: "No token found" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ "admin" OR "super-admin" দুইটাই allow
    if (decoded.role !== "admin" && decoded.role !== "super-admin") {
      return res.json({ success: false, message: "Admin only access" });
    }

    req.user = decoded;
    next();
  } catch (err) {
    return res.json({ success: false, message: "Invalid token: " + err.message });
  }
};





// ================= CREATE MATCH (ADMIN ONLY) =================
router.post("/create", protectAdmin, async (req, res) => {
  try {
    const { startTime, ...rest } = req.body;

    // ✅ startTime থেকে 20 মিনিট পরে auto delete হবে
    const expiresAt = startTime
      ? new Date(new Date(startTime).getTime() + 20 * 60 * 1000)
      : new Date(Date.now() + 20 * 60 * 1000);

    const match = await Match.create({
      ...rest,
      startTime,
      expiresAt,
      joinedPlayers: 0,
      status: "upcoming",
    });

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

    res.json({
      success: true,
      data: matches,
    });
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

    res.json({
      success: true,
      data: match,
    });
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
        status: "live",
        isRoomOpen: true,
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