 // backend/utils/sendNotification.js
const axios = require("axios");

const ONESIGNAL_APP_ID = "ad701a0f-8ef4-4d3c-8967-2a028216da99";
const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY;

// ─── সব user কে notification ─────────────────────────────────────────────────
const sendToAll = async ({ title, message, url = "/", matchId = null, category = "general" }) => {
  try {
    const res = await axios.post(
      "https://onesignal.com/api/v1/notifications",
      {
        app_id: ONESIGNAL_APP_ID,
        included_segments: ["All"],
        headings: { en: title },
        contents: { en: message },
        url,
        // ─── extra data (SW এ data হিসেবে পাবে) ──────
        data: {
          matchId: matchId ? matchId.toString() : null,
          category,
          url,
        },
        ios_badgeType: "Increase",
        ios_badgeCount: 1,
        priority: 10,
        ttl: 86400,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Key ${ONESIGNAL_API_KEY}`,
        },
      }
    );
    console.log("✅ Notification sent to all:", res.data);
    return { success: true, data: res.data };
  } catch (err) {
    console.error("❌ Notification error:", err.response?.data || err.message);
    return { success: false, message: err.message };
  }
};

// ─── নির্দিষ্ট user কে notification ──────────────────────────────────────────
const sendToUser = async ({ userId, title, message, url = "/", matchId = null, category = "general" }) => {
  try {
    const res = await axios.post(
      "https://onesignal.com/api/v1/notifications",
      {
        app_id: ONESIGNAL_APP_ID,
        include_aliases: { external_id: [userId.toString()] },
        target_channel: "push",
        headings: { en: title },
        contents: { en: message },
        url,
        data: {
          matchId: matchId ? matchId.toString() : null,
          category,
          url,
        },
        ios_badgeType: "Increase",
        ios_badgeCount: 1,
        priority: 10,
        ttl: 86400,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Key ${ONESIGNAL_API_KEY}`,
        },
      }
    );
    console.log("✅ Notification sent to user:", userId);
    return { success: true, data: res.data };
  } catch (err) {
    console.error("❌ Notification error:", err.response?.data || err.message);
    return { success: false, message: err.message };
  }
};

module.exports = { sendToAll, sendToUser };