 const Match = require('../models/Match');
const User = require('../models/User');

// @desc    Submit Match Result & Distribute Prize
// @route   POST /api/admin/match-result
// @access  Admin
const submitMatchResult = async (req, res) => {
  try {
    const { matchId, results } = req.body;

    if (!matchId || !results || results.length === 0) {
      return res.status(400).json({ message: "Match ID and results are required" });
    }

    // Find match
    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ message: "Match not found" });
    }

    // Update match with results
    match.results = results;
    match.status = 'completed';
    match.completedAt = new Date();

    await match.save();

    // Distribute Prize to Users
    for (const player of results) {
      if (player.userId && player.prize > 0) {
        await User.findByIdAndUpdate(
          player.userId,
          { 
            $inc: { balance: player.prize },
            $push: { 
              transactions: {
                type: 'match_prize',
                amount: player.prize,
                matchId: match._id,
                description: `${match.title} - Prize`
              }
            }
          }
        );
      }
    }

    res.status(200).json({
      success: true,
      message: "Match result submitted and prizes distributed successfully",
      match
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Get User's Joined Matches
// @route   GET /api/user/my-matches
const getMyMatches = async (req, res) => {
  try {
    const userId = req.user.id; // from auth middleware

    const matches = await Match.find({
      "participants.user": userId
    })
    .select('title prizePool status roomId password results createdAt')
    .sort({ createdAt: -1 });

    res.json(matches);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Get Single Match Result (for user)
const getMatchResult = async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = req.user.id;

    const match = await Match.findById(matchId)
      .select('title prizePool status roomId password results');

    if (!match) return res.status(404).json({ message: "Match not found" });

    // Check if user joined this match
    const isParticipant = match.participants?.some(p => p.user.toString() === userId);
    if (!isParticipant) {
      return res.status(403).json({ message: "You did not join this match" });
    }

    res.json(match);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = {
  submitMatchResult,
  getMyMatches,
  getMatchResult
};