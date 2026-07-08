 // reset-admin-password.js
// এই script টা একবার চালিয়ে admin এর password reset করা যাবে।
// চালানোর পর এই file টা delete করে দিন (নিরাপত্তার জন্য)।

require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

// ⚠️ এখানে বসান
const TARGET_EMAIL = "admin1@placeholder.playzo"; // যেই admin এর password change করবেন
const NEW_PASSWORD = "SUPERaDMIN123456@247"; // নতুন password (কমপক্ষে ৬ ক্যারেক্টার)

async function resetPassword() {
  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY // ⚠️ service role key লাগবে, anon key না
  );

  try {
    // ১. প্রথমে সব user list করে target email খুঁজে বের করি
    const { data: usersList, error: listError } = await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      console.error("❌ Users list করতে সমস্যা:", listError.message);
      return;
    }

    const targetUser = usersList.users.find((u) => u.email === TARGET_EMAIL);

    if (!targetUser) {
      console.error(`❌ Email "${TARGET_EMAIL}" এর কোনো user পাওয়া যায়নি।`);
      console.log("সব users এর email list:");
      usersList.users.forEach((u) => console.log(" -", u.email));
      return;
    }

    // ২. Password update করি
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      targetUser.id,
      { password: NEW_PASSWORD }
    );

    if (error) {
      console.error("❌ Password update ব্যর্থ হয়েছে:", error.message);
      return;
    }

    console.log("✅ Password সফলভাবে পরিবর্তন হয়েছে!");
    console.log("User ID:", data.user.id);
    console.log("Email:", data.user.email);
    console.log("নতুন password দিয়ে এখন login করতে পারবেন।");
  } catch (err) {
    console.error("❌ Unexpected error:", err.message);
  }
}

resetPassword();