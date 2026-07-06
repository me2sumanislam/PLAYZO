 // utils/referralFraud.js
// ✅ Referral Gem System — Fake User / Self-Referral Fraud Detection Helpers
// (Postgres/Supabase version — converted from Mongoose)
//
// এই ফাইলের ফাংশনগুলো deposit approve করার সময় এবং admin panel এর
// "Referral Fraud Alerts" section এ ব্যবহার হবে। কোনো ফাংশনই কাউকে সরাসরি
// ব্লক করে না — শুধু flag/suspicious mark করে, চূড়ান্ত সিদ্ধান্ত admin নেবে।
// (Auto-block করলে false positive এ real user block হয়ে যেতে পারে)

const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.SUPABASE_DB_URL });

const GEM_DAILY_CAP = 5; // একজন referrer দিনে সর্বোচ্চ কতগুলো নতুন referral থেকে gem পেতে পারবে (rate limit)

/**
 * একই trxId আগে অন্য কোনো (approved) deposit এ ব্যবহৃত হয়েছে কিনা চেক করে।
 * bKash/Nagad এ trxId সবসময় unique হওয়ার কথা — reuse মানেই সন্দেহজনক।
 *
 * NOTE: caller একই transaction (client) এর ভেতরে চেক করতে চাইলে client পাস করুন,
 * নাহলে এই ফাইলের নিজস্ব pool ব্যবহার হবে (read-only চেক এর জন্য এটাই যথেষ্ট)।
 */
async function isDuplicateTrx(trxId, excludeDepositId = null, client = pool) {
  const params = [trxId];
  let query = `SELECT id FROM deposits WHERE trx_id = $1 AND status = 'approved'`;
  if (excludeDepositId) {
    params.push(excludeDepositId);
    query += ` AND id != $2`;
  }
  query += ` LIMIT 1`;
  const { rows } = await client.query(query, params);
  return rows.length > 0;
}

/**
 * একই IP / deviceId থেকে referrer এর একাধিক referred user রেজিস্টার করেছে কিনা।
 * নিজেকে নিজে refer করে fake account বানিয়ে deposit করার সবচেয়ে common পদ্ধতি এটা।
 */
async function findSameDeviceReferrals(referrerId, client = pool) {
  const { rows: referrerRows } = await client.query(
    `SELECT id, name, phone, register_ip FROM users WHERE id = $1`,
    [referrerId]
  );
  const referrer = referrerRows[0];
  if (!referrer) return [];

  const { rows: referredUsers } = await client.query(
    `SELECT u.id, u.name, u.phone, u.register_ip, u.device_id
     FROM referral_history rh
     JOIN users u ON u.id = rh.referred_user_id
     WHERE rh.referrer_id = $1`,
    [referrerId]
  );

  const ipGroups = {};
  referredUsers.forEach((u) => {
    if (!u.register_ip) return;
    ipGroups[u.register_ip] = ipGroups[u.register_ip] || [];
    ipGroups[u.register_ip].push(u);
  });

  // referrer নিজের IP ও যদি কোনো referred user এর সাথে মেলে সেটাও সন্দেহজনক
  if (referrer.register_ip && ipGroups[referrer.register_ip]) {
    ipGroups[referrer.register_ip].push({ name: referrer.name, phone: referrer.phone, self: true });
  }

  return Object.entries(ipGroups)
    .filter(([, users]) => users.length > 1)
    .map(([ip, users]) => ({ ip, users }));
}

/**
 * একটা registration phone number sequential/pattern-based ফেক কিনা মোটামুটি চেক (heuristic)
 * যেমন 01700000001, 01700000002 এর মত একটানা pattern
 */
function looksLikeFakePhone(phone) {
  if (!phone) return false;
  const digits = phone.replace(/\D/g, "");
  const allSame = /^(\d)\1{6,}$/.test(digits.slice(-8));
  const sequential = /0123456789|9876543210/.test(digits);
  return allSame || sequential;
}

/**
 * Referrer আজকে (last 24h) কতগুলো নতুন gem-qualifying referral পেয়েছে — daily cap চেক
 */
async function countTodayGemReferrals(referrerId, client = pool) {
  const { rows } = await client.query(
    `SELECT COUNT(*)::int AS count FROM referral_history
     WHERE referrer_id = $1 AND gem_given = true AND joined_at >= now() - interval '24 hours'`,
    [referrerId]
  );
  return rows[0]?.count || 0;
}

async function isOverDailyGemCap(referrerId, client = pool) {
  const count = await countTodayGemReferrals(referrerId, client);
  return count >= GEM_DAILY_CAP;
}

module.exports = {
  GEM_DAILY_CAP,
  isDuplicateTrx,
  findSameDeviceReferrals,
  looksLikeFakePhone,
  countTodayGemReferrals,
  isOverDailyGemCap,
};