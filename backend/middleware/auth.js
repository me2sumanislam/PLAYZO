 // middleware/auth.js
const { Pool } = require("pg");
const supabase = require("../utils/supabaseClient");

const pool = new Pool({ connectionString: process.env.SUPABASE_DB_URL });
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

      // ✅ Supabase session token verify করা (আগের jwt.verify এর বদলে)
      const { data: authData, error: authError } = await supabase.auth.getUser(token);

      if (authError || !authData.user) {
        return res.status(401).json({ message: "Invalid token" });
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
        return res.status(401).json({ message: "User not found" });
      }

      if (user.is_blocked) {
        return res.status(403).json({ message: "Account is blocked" });
      }

      req.user = user;
      next();
    } else {
      return res.status(401).json({ message: "No token provided" });
    }
  } catch (err) {
    console.error("Auth middleware error:", err);
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