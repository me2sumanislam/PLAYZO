 // backend/utils/sendEmail.js
// -----------------------------------------------------------------------
// Gmail দিয়ে OTP/transactional email পাঠানোর জন্য। Nodemailer + Gmail SMTP
// ব্যবহার করছে। Gmail account এ 2-Step Verification চালু করে একটা
// "App Password" বানিয়ে সেটা .env এ দিন (আপনার আসল Gmail পাসওয়ার্ড না)।
//
// .env এ যোগ করুন:
//   GMAIL_USER=youraccount@gmail.com
//   GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx   (Google Account > Security > App Passwords)
//
// ⚠️ Gmail personal account দিয়ে bulk/production sending করলে
// deliverability কম হতে পারে ও account সাময়িকভাবে lock হতে পারে।
// scale বাড়লে Resend / SendGrid / Amazon SES এ move করা ভালো —
// তখন শুধু এই ফাইলের ভেতরের transporter অংশ বদলালেই চলবে,
// বাকি কোডে কোনো পরিবর্তন লাগবে না।
// -----------------------------------------------------------------------

const nodemailer = require("nodemailer");

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    console.error("❌ GMAIL_USER / GMAIL_APP_PASSWORD .env এ সেট করা নেই — email পাঠানো যাবে না।");
    return null;
  }

  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  return transporter;
}

/**
 * @param {string} to - প্রাপকের email
 * @param {string} subject
 * @param {string} text - plain text body
 * @param {string} [html] - optional HTML body
 * @returns {Promise<boolean>} success হলে true
 */
async function sendEmail(to, subject, text, html) {
  try {
    const t = getTransporter();
    if (!t) return false;

    await t.sendMail({
      from: `"uthiYO" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      text,
      html: html || undefined,
    });

    return true;
  } catch (err) {
    console.error("Email send failed:", err.message);
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