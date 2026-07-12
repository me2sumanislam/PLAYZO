// utils/sendSms.js
// -----------------------------------------------------------------------
// এখানে আপনার SMS gateway (BulkSMSBD / Alpha SMS / SSLWireless / Mimsms
// ইত্যাদির) HTTP API কল বসান। নিচে একটা জেনেরিক example দেওয়া আছে —
// আপনার gateway-র actual endpoint, params, auth অনুযায়ী বদলে নিন।
//
// .env এ যোগ করুন:
//   SMS_API_URL=...
//   SMS_API_KEY=...
//   SMS_SENDER_ID=...   (যদি লাগে)
// -----------------------------------------------------------------------

const axios = require("axios");

/**
 * @param {string} phone - Bangladeshi local format, e.g. "01712345678"
 * @param {string} message
 * @returns {Promise<boolean>} success হলে true
 */
async function sendSms(phone, message) {
  try {
    // ---- উদাহরণ: BulkSMSBD-স্টাইল GET API (আপনার gateway অনুযায়ী বদলান) ----
    const url = process.env.SMS_API_URL;
    const apiKey = process.env.SMS_API_KEY;
    const senderId = process.env.SMS_SENDER_ID;

    if (!url || !apiKey) {
      console.error("❌ SMS_API_URL / SMS_API_KEY .env এ সেট করা নেই — SMS পাঠানো যায়নি।");
      return false;
    }

    const res = await axios.get(url, {
      params: {
        api_key: apiKey,
        senderid: senderId,
        number: phone,
        message,
      },
      timeout: 10000,
    });

    // gateway response অনুযায়ী success check বদলে নিন
    console.log("SMS gateway response:", res.data);
    return true;
  } catch (err) {
    console.error("SMS send failed:", err.message);
    return false;
  }
}

module.exports = { sendSms };