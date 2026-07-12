 // routes/authRoutes.js
const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const crypto = require("crypto");
const { Pool } = require("pg");
const supabaseAdmin = require("../utils/supabaseAdmin");
const supabase = require("../utils/supabaseClient");
const { looksLikeFakePhone } = require("../utils/referralFraud");
const { sendSms } = require("../utils/sendSms");
const { protect } = require("../middleware/auth");

const pool = require("../utils/db");

const ADMIN_ROLES = ["admin", "super-admin", "finance"];
const OTP_TTL_MINUTES = 5;
const OTP_MAX_ATTEMPTS = 5;

function generateReferralCode(name) {
  const clean = (name || "USER").replace(/\s+/g, "").toUpperCase().slice(0, 4);
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${clean}${rand}`;
}

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.socket?.remoteAddress || req.ip || "";
}

function placeholderEmail(phone) {
  return `${phone}@placeholder.playzo`;
}

function toE164(phone) {
  const digitsOnly = phone.replace(/\D/g, "");
  if (/^01\d{9}$/.test(digitsOnly)) {
    return "+880" + digitsOnly.slice(1);
  }
  return null;
}

async function generateUniqueReferralCode(client, name) {
  let code, attempts = 0;
  let isUnique = false;
  while (!isUnique && attempts < 15) {
    code = generateReferralCode(name);
    const { rows } = await client.query(
      `SELECT id FROM users WHERE referral_code = $1`,
      [code]
    );
    if (rows.length === 0) isUnique = true;
    attempts++;
  }
  return code;
}

// ---------- OTP helpers ----------
function generateOtp() {
  // ৬ ডিজিটের OTP, cryptographically random
  return String(crypto.randomInt(100000, 999999));
}

function hashOtp(otp, phone) {
  // phone কে salt হিসেবে ব্যবহার করা হচ্ছে যাতে rainbow-table দিয়ে গেস করা কঠিন হয়
  return crypto.createHash("sha256").update(`${phone}:${otp}:${process.env.OTP_PEPPER || ""}`).digest("hex");
}

// ============ RATE LIMITERS ============
const otpRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // একই IP থেকে ১৫ মিনিটে সর্বোচ্চ ৫ বার OTP রিকোয়েস্ট
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "অনেকবার চেষ্টা হয়েছে, কিছুক্ষণ পর আবার চেষ্টা করুন" },
});

const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "অনেকবার চেষ্টা হয়েছে, কিছুক্ষণ পর আবার চেষ্টা করুন" },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "অনেকবার চেষ্টা হয়েছে, কিছুক্ষণ পর আবার চেষ্টা করুন" },
});

// ================= REGISTER =================
router.post("/register", async (req, res) => {
  const client = await pool.connect();
  try {
    const { name, inGameName, email, phone, password, referralCode, deviceId } = req.body;

    const { rows: existingPhoneRows } = await client.query(
      `SELECT id FROM users WHERE phone = $1`,
      [phone]
    );
    if (existingPhoneRows.length > 0) {
      return res.json({ success: false, message: "এই ফোন নম্বর দিয়ে আগেই একাউন্ট আছে" });
    }

    if (name && name.trim()) {
      const { rows: existingNameRows } = await client.query(
        `SELECT id FROM users WHERE name = $1`,
        [name.trim()]
      );
      if (existingNameRows.length > 0) {
        return res.json({ success: false, message: "এই নামটি ইতিমধ্যে ব্যবহৃত, অন্য নাম দিন" });
      }
    }

    const e164Phone = toE164(phone);
    const authPayload = {
      email: placeholderEmail(phone),
      password,
      email_confirm: true,
      user_metadata: { name: name?.trim(), migrated: false },
    };
    if (e164Phone) {
      authPayload.phone = e164Phone;
      authPayload.phone_confirm = true;
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser(authPayload);
    if (authError) {
      console.error("Supabase Auth create error:", authError);
      return res.json({ success: false, message: "একাউন্ট তৈরি করতে সমস্যা হয়েছে" });
    }

    const authUserId = authData.user.id;
    const newReferralCode = await generateUniqueReferralCode(client, name);

    let referrer = null;
    if (referralCode && referralCode.trim()) {
      const { rows } = await client.query(
        `SELECT * FROM users WHERE referral_code = $1`,
        [referralCode.trim().toUpperCase()]
      );
      referrer = rows[0] || null;
    }

    const clientIp = getClientIp(req);
    const fakePhonePattern = looksLikeFakePhone(phone);

    const { rows: insertedRows } = await client.query(
      `INSERT INTO users (
        auth_user_id, name, in_game_name, email, phone, password,
        referral_code, referred_by, register_ip, device_id,
        is_suspicious, suspicious_reason
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING *`,
      [
        authUserId,
        name?.trim(),
        inGameName?.trim(),
        email?.trim(),
        phone,
        "supabase-auth",
        newReferralCode,
        referrer ? referrer.id : null,
        clientIp,
        deviceId || "",
        fakePhonePattern,
        fakePhonePattern ? "Pattern-based phone number" : "",
      ]
    );
    const user = insertedRows[0];

    if (referrer && referrer.id !== user.id && referrer.phone !== user.phone) {
      await client.query(
        `INSERT INTO referral_history (referrer_id, referred_user_id, name, phone, deposited, joined_at)
         VALUES ($1,$2,$3,$4,false,now())`,
        [referrer.id, user.id, user.name, user.phone]
      );
      await client.query(
        `UPDATE users SET referral_count = referral_count + 1 WHERE id = $1`,
        [referrer.id]
      );
    }

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: placeholderEmail(phone),
      password,
    });
    if (signInError) {
      console.error("Post-register sign-in error:", signInError);
      return res.json({ success: false, message: "একাউন্ট তৈরি হয়েছে, কিন্তু লগইন করতে সমস্যা হয়েছে। আবার লগইন করুন।" });
    }

    res.json({
      success: true,
      message: "রেজিস্ট্রেশন সফল হয়েছে!",
      token: signInData.session.access_token,
      refreshToken: signInData.session.refresh_token,
      user: {
        id: user.id,
        name: user.name,
        inGameName: user.in_game_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        balance: user.balance,
        referralCode: user.referral_code,
        gems: user.referral_points,
        referralCount: user.referral_count,
      },
    });
  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ success: false, message: "সার্ভার এরর হয়েছে" });
  } finally {
    client.release();
  }
});

// ================= LOGIN =================
router.post("/login", loginLimiter, async (req, res) => {
  const client = await pool.connect();
  try {
    const { phone, password, deviceType } = req.body;

    if (deviceType && deviceType !== "mobile") {
      return res.json({ success: false, message: "Only mobile devices allowed 🎮"});
    }

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: placeholderEmail(phone),
      password,
    });

    if (signInError) {
      return res.json({ success: false, message: "ফোন নম্বর বা পাসওয়ার্ড ভুল" });
    }

    const authUserId = signInData.user.id;

    const { rows } = await client.query(
      `SELECT * FROM users WHERE auth_user_id = $1`,
      [authUserId]
    );
    const user = rows[0];
    if (!user) {
      return res.json({ success: false, message: "ইউজার পাওয়া যায়নি" });
    }

    let referralCode = user.referral_code;
    if (!referralCode) {
      referralCode = await generateUniqueReferralCode(client, user.name);
      await client.query(`UPDATE users SET referral_code = $1 WHERE id = $2`, [referralCode, user.id]);
    }

    await client.query(`UPDATE users SET last_login = now() WHERE id = $1`, [user.id]);

    const needsPasswordReset = signInData.user.user_metadata?.migrated === true;

    res.json({
      success: true,
      message: "Login success",
      token: signInData.session.access_token,
      refreshToken: signInData.session.refresh_token,
      needsPasswordReset,
      user: {
        id: user.id,
        name: user.name,
        inGameName: user.in_game_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        balance: user.balance,
        totalMatchesPlayed: user.total_matches_played,
        totalWins: user.total_wins,
        referralCode,
        gems: user.referral_points || 0,
        referralCount: user.referral_count,
      },
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ success: false, message: "সার্ভার এরর হয়েছে" });
  } finally {
    client.release();
  }
});

// =====================================================================
// ============== FORGOT PASSWORD — OTP-BASED (নতুন, নিরাপদ) ==========
// =====================================================================

// ---- STEP 1: OTP রিকোয়েস্ট করা ----
router.post("/forgot-password/request", otpRequestLimiter, async (req, res) => {
  const client = await pool.connect();
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.json({ success: false, message: "ফোন নাম্বার দিন" });
    }

    const genericResponse = {
      success: true,
      message: "যদি এই নাম্বারে অ্যাকাউন্ট থাকে, একটা OTP পাঠানো হয়েছে",
    };

    const { rows } = await client.query(
      `SELECT id, role FROM users WHERE phone = $1`,
      [phone]
    );
    const user = rows[0];

    if (!user || ADMIN_ROLES.includes(user.role)) {
      return res.json(genericResponse);
    }

    await client.query(
      `UPDATE password_reset_otps SET used = true WHERE phone = $1 AND used = false`,
      [phone]
    );

    const otp = generateOtp();
    const otpHash = hashOtp(otp, phone);
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    await client.query(
      `INSERT INTO password_reset_otps (phone, otp_hash, expires_at) VALUES ($1,$2,$3)`,
      [phone, otpHash, expiresAt]
    );

    if (process.env.TEST_MODE === "true") {
      console.log(`🧪 [TEST_MODE] ${phone} এর OTP: ${otp}`);
    } else {
      const smsSent = await sendSms(
        phone,
        `আপনার uthiYO পাসওয়ার্ড রিসেট কোড: ${otp} (৫ মিনিট বৈধ)। কারো সাথে শেয়ার করবেন না।`
      );

      if (!smsSent) {
        console.error(`⚠️ SMS পাঠানো যায়নি: ${phone}`);
      }
    }

    return res.json(genericResponse);
  } catch (err) {
    console.error("Forgot-password request error:", err);
    res.status(500).json({ success: false, message: "সার্ভার এরর হয়েছে" });
  } finally {
    client.release();
  }
});

// ---- STEP 2: OTP verify করে নতুন পাসওয়ার্ড সেট করা ----
router.post("/forgot-password/verify", otpVerifyLimiter, async (req, res) => {
  const client = await pool.connect();
  try {
    const { phone, otp, password } = req.body;

    if (!phone || !otp || !password) {
      return res.json({ success: false, message: "সব তথ্য পূরণ করুন" });
    }
    if (password.length < 8) {
      return res.json({ success: false, message: "পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে" });
    }

    const { rows: otpRows } = await client.query(
      `SELECT * FROM password_reset_otps
       WHERE phone = $1 AND used = false
       ORDER BY created_at DESC LIMIT 1`,
      [phone]
    );
    const record = otpRows[0];

    if (!record) {
      return res.json({ success: false, message: "কোনো active OTP নেই, আবার রিকোয়েস্ট করুন" });
    }
    if (new Date(record.expires_at) < new Date()) {
      return res.json({ success: false, message: "OTP মেয়াদ শেষ হয়ে গেছে, আবার রিকোয়েস্ট করুন" });
    }
    if (record.attempts >= OTP_MAX_ATTEMPTS) {
      return res.json({ success: false, message: "অনেকবার ভুল হয়েছে, নতুন OTP রিকোয়েস্ট করুন" });
    }

    const providedHash = hashOtp(otp, phone);
    if (providedHash !== record.otp_hash) {
      await client.query(
        `UPDATE password_reset_otps SET attempts = attempts + 1 WHERE id = $1`,
        [record.id]
      );
      return res.json({ success: false, message: "OTP ভুল হয়েছে" });
    }

    const { rows: userRows } = await client.query(
      `SELECT auth_user_id, role FROM users WHERE phone = $1`,
      [phone]
    );
    const user = userRows[0];
    if (!user || !user.auth_user_id || ADMIN_ROLES.includes(user.role)) {
      return res.json({ success: false, message: "User not found" });
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(user.auth_user_id, {
      password,
      user_metadata: { migrated: false },
    });

    if (error) {
      console.error("Reset password error:", error);
      return res.json({ success: false, message: "পাসওয়ার্ড পরিবর্তন করতে সমস্যা হয়েছে" });
    }

    await client.query(
      `UPDATE password_reset_otps SET used = true WHERE id = $1`,
      [record.id]
    );

    res.json({ success: true, message: "পাসওয়ার্ড পরিবর্তন সফল হয়েছে!" });
  } catch (err) {
    console.error("Forgot-password verify error:", err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

// ================= CHANGE PASSWORD (লগইন করা অবস্থায়) =================
router.post("/change-password", protect, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 8) {
      return res.json({ success: false, message: "পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে" });
    }

    const client = await pool.connect();
    let authUserId;
    try {
      const { rows } = await client.query(
        `SELECT auth_user_id FROM users WHERE id = $1`,
        [req.user.id]
      );
      authUserId = rows[0]?.auth_user_id;
    } finally {
      client.release();
    }

    if (!authUserId) {
      return res.json({ success: false, message: "User not found" });
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(authUserId, {
      password,
      user_metadata: { migrated: false },
    });

    if (error) {
      console.error("Change password error:", error);
      return res.json({ success: false, message: "পাসওয়ার্ড পরিবর্তন করতে সমস্যা হয়েছে" });
    }

    res.json({ success: true, message: "পাসওয়ার্ড পরিবর্তন সফল হয়েছে!" });
  } catch (err) {
    console.error("Change-password error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ================= (DEPRECATED) OLD INSECURE ENDPOINTS =================
router.post("/check-phone", (req, res) => {
  res.status(410).json({
    success: false,
    message: "এই ভার্সন পুরনো হয়ে গেছে, অ্যাপ আপডেট করুন",
  });
});

router.post("/reset-password", (req, res) => {
  res.status(410).json({
    success: false,
    message: "এই ভার্সন পুরনো হয়ে গেছে, অ্যাপ আপডেট করুন",
  });
});

// ================= REFRESH TOKEN =================
router.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: "refreshToken প্রয়োজন" });
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data.session) {
      return res.status(401).json({ success: false, message: "Session expired, আবার লগইন করুন" });
    }

    res.json({
      success: true,
      token: data.session.access_token,
      refreshToken: data.session.refresh_token,
    });
  } catch (err) {
    console.error("Refresh Error:", err);
    res.status(500).json({ success: false, message: "সার্ভার এরর হয়েছে" });
  }
});

module.exports = router;