 // backend/scripts/create-supabase-auth-users.js
require("dotenv").config({ path: [".env.local", ".env"] });
const { Pool } = require("pg");
const supabaseAdmin = require("../utils/supabaseAdmin");
const crypto = require("crypto");

const pool = new Pool({ connectionString: process.env.SUPABASE_DB_URL });

// Generates a random temporary password (user will reset it later)
function generateTempPassword() {
  return "Temp-" + crypto.randomBytes(6).toString("hex");
}

// Supabase Auth needs a valid "email" field even for phone-based users.
function placeholderEmail(phone) {
  return `${phone}@placeholder.playzo`;
}

// Converts a Bangladeshi local number (01XXXXXXXXX) to E.164 (+880XXXXXXXXXX)
// Returns null if it doesn't look like a real phone number (e.g. "admin1", "01")
function toE164(phone) {
  const digitsOnly = phone.replace(/\D/g, "");
  if (/^01\d{9}$/.test(digitsOnly)) {
    return "+880" + digitsOnly.slice(1);
  }
  return null;
}

async function main() {
  const client = await pool.connect();
  console.log("✅ Connected to Postgres.");

  const { rows: users } = await client.query(
    `SELECT id, phone, name FROM users WHERE auth_user_id IS NULL`
  );

  console.log(`👉 Found ${users.length} users without auth_user_id.`);

  let success = 0;
  let failed = 0;
  const tempPasswords = [];

  for (const user of users) {
    const tempPassword = generateTempPassword();
    const e164Phone = toE164(user.phone);

    const payload = {
      email: placeholderEmail(user.phone),
      password: tempPassword,
      email_confirm: true,
      user_metadata: { name: user.name, migrated: true, original_phone: user.phone },
    };

    if (e164Phone) {
      payload.phone = e164Phone;
      payload.phone_confirm = true;
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser(payload);

    if (error) {
      console.log(`  ⚠️  failed for user ${user.id} (${user.phone}): ${error.message}`);
      failed++;
      continue;
    }

    const authUserId = data.user.id;

    await client.query(`UPDATE users SET auth_user_id = $1 WHERE id = $2`, [
      authUserId,
      user.id,
    ]);

    tempPasswords.push({ phone: user.phone, name: user.name, tempPassword });
    success++;
    console.log(`  ✅ linked user ${user.id} (${user.phone})`);
  }

  console.log(`\n🎉 Done. Success: ${success}, Failed: ${failed}`);

  if (tempPasswords.length > 0) {
    const fs = require("fs");
    fs.writeFileSync(
      "temp-passwords.json",
      JSON.stringify(tempPasswords, null, 2)
    );
    console.log(
      `📄 Temporary passwords saved to temp-passwords.json (DELETE this file after use — do not commit to git!)`
    );
  }

  client.release();
  await pool.end();
}

main().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});