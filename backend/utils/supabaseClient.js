 // backend/utils/supabaseClient.js
// Uses the ANON key — same permission level as a logged-out frontend user.
// Used for signUp / signInWithPassword calls from the backend.
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

module.exports = supabase;