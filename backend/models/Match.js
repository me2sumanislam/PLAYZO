 const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema({
  title: String,
  category: {
    type: String,
    enum: ["solo", "duo", "squad", "cs", "custom", "tournament"],
  },
  winPrize: Number,
  entryFee: Number,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Match", matchSchema);