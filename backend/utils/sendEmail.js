 // backend/utils/sendEmail.js
// -----------------------------------------------------------------------
// আগে এটা Gmail SMTP (Nodemailer) ব্যবহার করত, কিন্তু Render-এর FREE plan
// SMTP পোর্ট (25, 465, 587) ব্লক করে দেয় বলে ইমেইল কখনোই পাঠানো যাচ্ছিল না
// (App Password/env variable ঠিক থাকা সত্ত্বেও)।
//
// তাই এখন Brevo (আগে Sendinblue) এর HTTP API ব্যবহার করা হচ্ছে — এটা SMTP
// পোর্ট ব্যবহার করে না, বরং সাধারণ HTTPS request (যেমন axios/fetch), তাই
// Render/Vercel এর মতো প্ল্যাটফর্মে ব্লক হয় না।
//
// .env এ যোগ করুন:
//   BREVO_API_KEY=your_brevo_api_key
//   BREVO_SENDER_EMAIL=support@uthiyo.com   (Brevo তে verify করা sender email)
//   BREVO_SENDER_NAME=uthiYO                (optional, ডিফল্ট "uthiYO")
//
// Brevo ফ্রি প্ল্যানে সেটআপ:
//   ১. https://www.brevo.com এ ফ্রি একাউন্ট খুলুন
//   ২. Senders & IP > Senders এ গিয়ে আপনার sender email verify করুন
//   ৩. SMTP & API > API Keys > Generate a new API key
// -----------------------------------------------------------------------

const axios = require("axios");

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

/**
 * @param {string} to - প্রাপকের email
 * @param {string} subject
 * @param {string} text - plain text body
 * @param {string} [html] - optional HTML body
 * @returns {Promise<boolean>} success হলে true
 */
async function sendEmail(to, subject, text, html) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME || "uthiYO";

  if (!apiKey || !senderEmail) {
    console.error(
      "❌ BREVO_API_KEY / BREVO_SENDER_EMAIL .env এ সেট করা নেই — email পাঠানো যাবে না।"
    );
    return false;
  }

  try {
    await axios.post(
      BREVO_API_URL,
      {
        sender: { name: senderName, email: senderEmail },
        to: [{ email: to }],
        subject,
        textContent: text,
        htmlContent: html || undefined,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "api-key": apiKey,
        },
        timeout: 15000,
      }
    );

    return true;
  } catch (err) {
    console.error(
      "Email send failed:",
      err.response?.data || err.message
    );
    return false;
  }
}

/**
 * OTP email পাঠানোর shortcut
 * @param {string} to
 * @param {string} otp
 * @param {number} ttlMinutes
 */
async function sendOtpEmail(to, otp, ttlMinutes = 5) {
  const subject = "আপনার uthiYO পাসওয়ার্ড রিসেট কোড";
  const text = `আপনার uthiYO পাসওয়ার্ড রিসেট কোড: ${otp} (${ttlMinutes} মিনিট বৈধ)। কারো সাথে শেয়ার করবেন না।`;
  const html = `
    <div style="font-family: sans-serif; font-size: 15px; color: #222;">
      <p>আপনার <b>uthiYO</b> পাসওয়ার্ড রিসেট কোড:</p>
      <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px;">${otp}</p>
      <p>এই কোডটি <b>${ttlMinutes} মিনিট</b> এর জন্য বৈধ। কারো সাথে শেয়ার করবেন না।</p>
      <p>আপনি যদি এই রিকোয়েস্ট না করে থাকেন, তাহলে এই মেইলটি ইগনোর করুন।</p>
    </div>
  `;
  return sendEmail(to, subject, text, html);
}

module.exports = { sendEmail, sendOtpEmail };