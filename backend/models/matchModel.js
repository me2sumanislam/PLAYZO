 const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      required: true,
    },

    entryFee: {
      type: Number,
      required: true,
      default: 0,
    },

    winPrize: {
      type: Number,
      required: true,
      default: 0,
    },

    totalPlayers: {
      type: Number,
      default: 48,
    },

    joinedPlayers: {
      type: Number,
      default: 0,
    },

    roomId: {
      type: String,
      default: "",
    },

    roomPassword: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      default: "upcoming",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Match", matchSchema);