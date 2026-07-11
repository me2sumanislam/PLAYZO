 // routes/authRoutes.js
const express = require("express");
const router = express.Router();
const { Pool } = require("pg");
const supabaseAdmin = require("../utils/supabaseAdmin");
const supabase = require("../utils/supabaseClient");
const { looksLikeFakePhone } = require("../utils/referralFraud");

const pool = require("../utils/db");

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
router.post("/login", async (req, res) => {
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

// ================= CHECK PHONE =================
router.post("/check-phone", async (req, res) => {
  const client = await pool.connect();
  try {
    const { phone } = req.body;
    const { rows } = await client.query(`SELECT id FROM users WHERE phone = $1`, [phone]);
    if (rows.length === 0) return res.json({ success: false, message: "User not found" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

// ================= RESET PASSWORD =================
router.post("/reset-password", async (req, res) => {
  const client = await pool.connect();
  try {
    const { phone, password } = req.body;

    const { rows } = await client.query(`SELECT auth_user_id FROM users WHERE phone = $1`, [phone]);
    const user = rows[0];
    if (!user || !user.auth_user_id) {
      return res.json({ success: false, message: "User not found" });
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(user.auth_user_id, {
      password,
      user_metadata: { migrated: false }, // reset হয়ে গেছে, তাই ফ্ল্যাগ নামিয়ে দেওয়া
    });

    if (error) {
      console.error("Reset password error:", error);
      return res.json({ success: false, message: "পাসওয়ার্ড পরিবর্তন করতে সমস্যা হয়েছে" });
    }

    res.json({ success: true, message: "পাসওয়ার্ড পরিবর্তন সফল হয়েছে!" });
  } catch (err) {
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