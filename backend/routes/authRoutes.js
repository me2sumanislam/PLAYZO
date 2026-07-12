 // routes/authRoutes.js
const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const crypto = require("crypto");
const { Pool } = require("pg");
const supabaseAdmin = require("../utils/supabaseAdmin");
const supabase = require("../utils/supabaseClient");
const { looksLikeFakePhone } = require("../utils/referralFraud");
const { sendSms } = require("../utils/smsProvider");

const pool = require("../utils/db");

const ADMIN_ROLES = ["admin", "super-admin", "finance"];
const OTP_TTL_MS = 5 * 60 * 1000; // ৫ মিনিট
const OTP_MAX_ATTEMPTS = 5;

function generateOtp() {
  return String(crypto.randomInt(100000, 999999)); // ৬ ডিজিট
}

function hashOtp(otp, phone) {
  // phone-কে salt হিসেবে ব্যবহার করা হচ্ছে যাতে rainbow-table দিয়ে সহজে ভাঙা না যায়
  return crypto.createHash("sha256").update(`${phone}:${otp}`).digest("hex");
}

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

// Supabase Auth এর জন্য placeholder email (phone-based login সাপোর্ট করার জন্য)
function placeholderEmail(phone) {
  return `${phone}@placeholder.playzo`;
}

// Bangladeshi local number কে E.164 তে রূপান্তর করে, নাহলে null
function toE164(phone) {
  const digitsOnly = phone.replace(/\D/g, "");
  if (/^01\d{9}$/.test(digitsOnly)) {
    return "+880" + digitsOnly.slice(1);
  }
  return null;
}

// একটা unique referral code বের করে (max 15 চেষ্টা)
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

// ============ RATE LIMITERS (brute-force / enumeration ঠেকানোর জন্য) ============
// একই IP থেকে ১৫ মিনিটে ৫ বারের বেশি check-phone/reset-password চেষ্টা করা যাবে না
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "অনেকবার চেষ্টা হয়েছে, কিছুক্ষণ পর আবার চেষ্টা করুন" },
});

// লগইনও brute-force এর টার্গেট — আলাদা, একটু বেশি generous limiter
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

    // ✅ Supabase Auth-এ user তৈরি (bcrypt hashing এখন Supabase নিজেই করে, তাই আমাদের আর করা লাগবে না)
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
        "supabase-auth", // password কলাম আর ব্যবহৃত হচ্ছে না, placeholder রাখা হলো
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

    // ✅ রেজিস্ট্রেশনের পরপরই sign-in করে session token বের করা
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

    // ✅ referralCode না থাকলে generate করে save করা
    let referralCode = user.referral_code;
    if (!referralCode) {
      referralCode = await generateUniqueReferralCode(client, user.name);
      await client.query(`UPDATE users SET referral_code = $1 WHERE id = $2`, [referralCode, user.id]);
    }

    await client.query(`UPDATE users SET last_login = now() WHERE id = $1`, [user.id]);

    // migrated flag চেক করা — true মানে temp password দিয়ে ঢুকেছে, reset করা দরকার
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

// ================= CHECK PHONE (deprecated, নিরাপদ stub) =================
// পুরনো frontend যদি এখনো এই route কল করে, ভাঙা এড়াতে রেখে দেওয়া হলো,
// কিন্তু আর কোনো real information (account exists কিনা) দেয় না।
// নতুন frontend flow-তে এটার বদলে /forgot-password/request-otp ব্যবহার করুন।
router.post("/check-phone", forgotPasswordLimiter, async (req, res) => {
  return res.json({
    success: false,
    message: "এই পদ্ধতি আর সমর্থিত নয়। অনুগ্রহ করে অ্যাপ আপডেট করুন।",
    deprecated: true,
  });
});

// ================= RESET PASSWORD (deprecated, নিরাপদ stub) =================
router.post("/reset-password", forgotPasswordLimiter, async (req, res) => {
  return res.json({
    success: false,
    message: "এই পদ্ধতি আর সমর্থিত নয়। অনুগ্রহ করে অ্যাপ আপডেট করুন।",
    deprecated: true,
  });
});

// ================= FORGOT PASSWORD — STEP 1: OTP পাঠানো =================
// নিরাপত্তার জন্য এই endpoint সবসময় একই generic success message দেয় —
// phone আসলে registered কিনা, বা admin কিনা, সেটা কখনো আলাদা করে বলা হয় না
// (user enumeration প্রতিরোধ)। শুধু legit, non-admin ফোন নাম্বার হলেই
// আসলে OTP তৈরি হয়ে পাঠানো হয়।
router.post("/forgot-password/request-otp", forgotPasswordLimiter, async (req, res) => {
  const client = await pool.connect();
  const GENERIC_RESPONSE = {
    success: true,
    message: "যদি এই নাম্বারে অ্যাকাউন্ট থাকে, একটি OTP কোড পাঠানো হয়েছে।",
  };

  try {
    const { phone } = req.body;
    if (!phone) {
      return res.json({ success: false, message: "ফোন নাম্বার দিন" });
    }

    const { rows } = await client.query(
      `SELECT id, role FROM users WHERE phone = $1`,
      [phone]
    );
    const user = rows[0];

    // user না থাকলে বা admin হলে — কিছুই না করে generic success ফেরত দাও
    if (!user || ADMIN_ROLES.includes(user.role)) {
      return res.json(GENERIC_RESPONSE);
    }

    // আগের কোনো unconsumed OTP থাকলে invalidate করে দাও
    await client.query(
      `UPDATE password_reset_otps SET consumed = true WHERE phone = $1 AND consumed = false`,
      [phone]
    );

    const otp = generateOtp();
    const otpHash = hashOtp(otp, phone);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    await client.query(
      `INSERT INTO password_reset_otps (phone, otp_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [phone, otpHash, expiresAt]
    );

    try {
      await sendSms(phone, `আপনার Playzo পাসওয়ার্ড রিসেট কোড: ${otp} (৫ মিনিটের জন্য বৈধ)`);
    } catch (smsErr) {
      // SMS পাঠাতে ব্যর্থ হলেও attacker কে জানানো যাবে না —
      // OTP তবুও DB-তে থেকে যাবে, admin panel থেকে ম্যানুয়ালি দেওয়া যাবে
      console.error("SMS send failed:", smsErr.message);
    }

    return res.json(GENERIC_RESPONSE);
  } catch (err) {
    console.error("request-otp error:", err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

// ================= FORGOT PASSWORD — STEP 2: OTP verify + reset =================
router.post("/forgot-password/verify-and-reset", forgotPasswordLimiter, async (req, res) => {
  const client = await pool.connect();
  try {
    const { phone, otp, password } = req.body;

    if (!phone || !otp || !password) {
      return res.json({ success: false, message: "সব তথ্য দিন" });
    }
    if (password.length < 8) {
      return res.json({ success: false, message: "পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে" });
    }

    const { rows: otpRows } = await client.query(
      `SELECT * FROM password_reset_otps
       WHERE phone = $1 AND consumed = false
       ORDER BY created_at DESC LIMIT 1`,
      [phone]
    );
    const otpRow = otpRows[0];

    if (!otpRow) {
      return res.json({ success: false, message: "কোনো বৈধ OTP পাওয়া যায়নি, নতুন কোড চান" });
    }
    if (new Date(otpRow.expires_at) < new Date()) {
      return res.json({ success: false, message: "OTP মেয়াদ শেষ হয়ে গেছে, নতুন কোড চান" });
    }
    if (otpRow.attempts >= OTP_MAX_ATTEMPTS) {
      return res.json({ success: false, message: "অনেকবার ভুল হয়েছে, নতুন কোড চান" });
    }

    const expectedHash = hashOtp(otp, phone);
    if (expectedHash !== otpRow.otp_hash) {
      await client.query(
        `UPDATE password_reset_otps SET attempts = attempts + 1 WHERE id = $1`,
        [otpRow.id]
      );
      return res.json({ success: false, message: "OTP সঠিক নয়" });
    }

    const { rows: userRows } = await client.query(
      `SELECT auth_user_id, role FROM users WHERE phone = $1`,
      [phone]
    );
    const user = userRows[0];

    // ✅ admin/super-admin/finance এই public flow দিয়ে কখনো reset হবে না
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

    // OTP consume করে দাও যাতে reuse না হয়
    await client.query(
      `UPDATE password_reset_otps SET consumed = true WHERE id = $1`,
      [otpRow.id]
    );

    res.json({ success: true, message: "পাসওয়ার্ড পরিবর্তন সফল হয়েছে!" });
  } catch (err) {
    console.error("verify-and-reset error:", err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
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