 const jwt = require("jsonwebtoken");
const User = require("../models/User");

const ADMIN_ROLES = ["admin", "super-admin", "finance"];

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

      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      req.user = user;
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
  if (req.user && ADMIN_ROLES.includes(req.user.role)) {
    next();
  } else {
    return res.status(403).json({ message: "Admin only access" });
  }
};

module.exports = { protect, adminOnly };