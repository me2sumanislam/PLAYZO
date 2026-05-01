 const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ================= PROTECT =================
const protect = async (req, res, next) => {
  let token;

  try {
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "secretkey"
      );

      // 🔥 DB থেকে real user আনো
      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      req.user = user; // ✔ real user object
      next();
    } else {
      return res.status(401).json({ message: "No token provided" });
    }
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// ================= ADMIN ONLY =================
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({ message: "Admin only access" });
  }
};

module.exports = { protect, adminOnly };