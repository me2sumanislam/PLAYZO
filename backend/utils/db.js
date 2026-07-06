 // backend/utils/db.js
const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.SUPABASE_DB_URL });

module.exports = pool;