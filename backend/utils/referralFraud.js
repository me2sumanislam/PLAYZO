 // utils/referralFraud.js
// ✅ Referral Gem System — Fake User / Self-Referral Fraud Detection Helpers
//
// এই ফাইলের ফাংশনগুলো deposit approve করার সময় এবং admin panel এর
// "Referral Fraud Alerts" section এ ব্যবহার হবে। কোনো ফাংশনই কাউকে সরাসরি
// ব্লক করে না — শুধু flag/suspicious mark করে, চূড়ান্ত সিদ্ধান্ত admin নেবে।
// (Auto-block করলে false positive এ real user block হয়ে যেতে পারে)

const Deposit = require("../models/Deposit");
const User = require("../models/User");

const GEM_DAILY_CAP = 5; // একজন referrer দিনে সর্বোচ্চ কতগুলো নতুন referral থেকে gem পেতে পারবে (rate limit)

/**
 * একই trxId আগে অন্য কোনো (approved) deposit এ ব্যবহৃত হয়েছে কিনা চেক করে।
 * bKash/Nagad এ trxId সবসময় unique হওয়ার কথা — reuse মানেই সন্দেহজনক।
 */
async function isDuplicateTrx(trxId, excludeDepositId = null) {
  const query = { trxId, status: "approved" };
  if (excludeDepositId) query._id = { $ne: excludeDepositId };
  const existing = await Deposit.findOne(query);
  return !!existing;
}

/**
 * একই IP / deviceId থেকে referrer এর একাধিক referred user রেজিস্টার করেছে কিনা।
 * নিজেকে নিজে refer করে fake account বানিয়ে deposit করার সবচেয়ে common পদ্ধতি এটা।
 */
async function findSameDeviceReferrals(referrerId) {
  const referrer = await User.findById(referrerId);
  if (!referrer || !referrer.referralHistory?.length) return [];

  const referredIds = referrer.referralHistory.map((r) => r.userId);
  const referredUsers = await User.find({ _id: { $in: referredIds } }, "name phone registerIp deviceId");

  const ipGroups = {};
  referredUsers.forEach((u) => {
    if (!u.registerIp) return;
    ipGroups[u.registerIp] = ipGroups[u.registerIp] || [];
    ipGroups[u.registerIp].push(u);
  });

  // referrer নিজের IP ও যদি কোনো referred user এর সাথে মেলে সেটাও সন্দেহজনক
  if (referrer.registerIp && ipGroups[referrer.registerIp]) {
    ipGroups[referrer.registerIp].push({ name: referrer.name, phone: referrer.phone, self: true });
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
  // একই digit বারবার (e.g. 01111111111) অথবা ক্রমিক (0123456789)
  const allSame = /^(\d)\1{6,}$/.test(digits.slice(-8));
  const sequential = /0123456789|9876543210/.test(digits);
  return allSame || sequential;
}

/**
 * Referrer আজকে (last 24h) কতগুলো নতুন gem-qualifying referral পেয়েছে — daily cap চেক
 */
function countTodayGemReferrals(referrer) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return (referrer.referralHistory || []).filter(
    (r) => r.gemGiven && r.joinedAt && new Date(r.joinedAt) >= since
  ).length;
}

function isOverDailyGemCap(referrer) {
  return countTodayGemReferrals(referrer) >= GEM_DAILY_CAP;
}

module.exports = {
  GEM_DAILY_CAP,
  isDuplicateTrx,
  findSameDeviceReferrals,
  looksLikeFakePhone,
  countTodayGemReferrals,
  isOverDailyGemCap,
};