 // middleware/auth.js
const { Pool } = require("pg");
const supabase = require("../utils/supabaseClient");

const pool = require("../utils/db");
const ADMIN_ROLES = ["admin", "super-admin", "finance"];

// ================= CORE AUTH LOGIC =================
// strict = true  → token না থাকলে/ভুল হলে 401 দিয়ে আটকে দেয় (protect)
// strict = false → token না থাকলে/ভুল হলে req.user সেট না করেই next() চলে যায় (optionalAuth)
const authenticate = (strict) => async (req, res, next) => {
  try {
    const auth = req.headers.authorization;

    if (!auth || !auth.startsWith("Bearer")) {
      if (strict) return res.status(401).json({ message: "No token provided" });
      return next();
    }

    const token = auth.split(" ")[1];

    // ✅ Supabase session token verify করা (আগের jwt.verify এর বদলে)
    const { data: authData, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authData.user) {
      if (strict) return res.status(401).json({ message: "Invalid token" });
      return next();
    }

    const authUserId = authData.user.id;

    const client = await pool.connect();
    let user;
    try {
      const { rows } = await client.query(
        `SELECT id, name, in_game_name, email, phone, role, balance,
                total_matches_played, total_wins, referral_code,
                referred_by, referral_points, referral_count, is_blocked
         FROM users WHERE auth_user_id = $1`,
        [authUserId]
      );
      user = rows[0];
    } finally {
      client.release();
    }

    if (!user) {
      if (strict) return res.status(401).json({ message: "User not found" });
      return next();
    }

    if (user.is_blocked) {
      if (strict) return res.status(403).json({ message: "Account is blocked" });
      return next();
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    if (strict) return res.status(401).json({ message: "Invalid token" });
    next();
  }
};

// ================= PROTECT (বাধ্যতামূলক login) =================
const protect = authenticate(true);

// ================= OPTIONAL AUTH (login থাকলে req.user সেট করে, না থাকলেও চলতে দেয়) =================
const optionalAuth = authenticate(false);

// ================= ADMIN ONLY =================
const adminOnly = (req, res, next) => {
  if (req.user && ADMIN_ROLES.includes(req.user.role)) {
    next();
  } else {
    return res.status(403).json({ message: "Admin only access" });
  }
};

module.exports = { protect, adminOnly, optionalAuth };