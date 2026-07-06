 // backend/utils/supabaseAdmin.js
// Uses the SERVICE ROLE key — full access, bypasses RLS.
// ONLY import this in backend code that never runs in the browser.
const { createClient } = require("@supabase/supabase-js");

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

module.exports = supabaseAdmin;