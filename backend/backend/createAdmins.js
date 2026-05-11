 const dns = require("node:dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const dotenv = require("dotenv");
dotenv.config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

// DEBUG
console.log("MONGO_URI:", process.env.MONGO_URI);

mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 10000,
});

const createAdmins = async () => {
  try {
    const hashedPassword = await bcrypt.hash("123456", 10);

    const admins = [
      { phone: "admin1", password: hashedPassword, role: "admin" },
      { phone: "admin2", password: hashedPassword, role: "admin" },
      { phone: "admin3", password: hashedPassword, role: "admin" },
      { phone: "admin4", password: hashedPassword, role: "admin" },
      { phone: "admin5", password: hashedPassword, role: "admin" },
    ];

    await User.insertMany(admins);

    console.log("5 Admin Created 🚀");
    process.exit();
  } catch (err) {
    console.log("Error:", err.message);
    process.exit();
  }
};

createAdmins();