 /**
 * migrate-mongo-to-supabase.js
 * -----------------------------------------------------------------------
 * PLAYZO — one-time data migration: MongoDB (mongoose) → Supabase (Postgres)
 *
 * SETUP (run these once, in your backend project folder):
 *   npm install mongodb pg dotenv
 *
 * .env (add these two lines — reuse your existing MONGO_URI):
 *   MONGO_URI=mongodb+srv://...                       (your current Mongo URI)
 *   SUPABASE_DB_URL=postgresql://postgres:PASSWORD@db.xxxx.supabase.co:5432/postgres
 *     (Get this from Supabase Dashboard → Project Settings → Database →
 *      Connection string → URI. Use the "Session" pooler or direct
 *      connection — NOT the pgbouncer transaction pooler, since this
 *      script needs a stable session.)
 *
 * RUN THE POSTGRES SCHEMA FIRST — supabase_schema.sql must already be
 * applied to your Supabase project (Dashboard → SQL Editor → paste → run)
 * before you run this script.
 *
 * RUN:
 *   node migrate-mongo-to-supabase.js
 *
 * The script is idempotent-ish for re-runs ONLY if you truncate the
 * Postgres tables first (it does plain INSERTs, no upsert). If a run
 * fails partway, either fix the issue and re-truncate + re-run, or
 * comment out the steps that already completed successfully.
 * -----------------------------------------------------------------------
 */

require("dotenv").config();
const { MongoClient } = require("mongodb");
const { Client } = require("pg");
const crypto = require("crypto");

const MONGO_URI = process.env.MONGO_URI;
const PG_URL = process.env.SUPABASE_DB_URL;

if (!MONGO_URI || !PG_URL) {
  console.error("❌ MONGO_URI বা SUPABASE_DB_URL .env এ পাওয়া যায়নি।");
  process.exit(1);
}

// If your mongoose models used custom collection names, fix them here.
const COLLECTIONS = {
  users: "users",
  admins: "admins",
  matches: "matches",
  ludoTournaments: "ludotournaments",
  deposits: "deposits",
  withdraws: "withdraws",
  resultSubmissions: "resultsubmissions",
  ludoResultSubmissions: "ludoresultsubmissions",
  notifications: "notifications",
  userNotifications: "usernotifications",
  pushSubscriptions: "pushsubscriptions",
  paymentNumbers: "paymentnumbers",
  activityLogs: "activitylogs",
  pointConvertRequests: "pointconvertrequests",
};

const mongoClient = new MongoClient(MONGO_URI);
const pg = new Client({ connectionString: PG_URL });

// mongoId(string) -> new uuid(string)
const userIdMap = new Map();
const adminIdMap = new Map();
const matchIdMap = new Map();
const ludoIdMap = new Map();
const resultSubmissionIdMap = new Map();
const ludoResultSubmissionIdMap = new Map();
const notificationIdMap = new Map();

const newId = () => crypto.randomUUID();
const idStr = (v) => (v ? v.toString() : null);
const mapGet = (map, v) => (v ? map.get(idStr(v)) || null : null);

let errorCount = 0;

async function insertRow(table, data) {
  const columns = Object.keys(data);
  const values = Object.values(data);
  const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ");
  const sql = `insert into ${table} (${columns
    .map((c) => `"${c}"`)
    .join(", ")}) values (${placeholders})`;
  try {
    await pg.query(sql, values);
  } catch (err) {
    errorCount++;
    console.error(`  ⚠️  insert failed on ${table}:`, err.message);
  }
}

// Collection might not exist in an older DB — fail gracefully.
async function safeFind(db, collName) {
  try {
    const exists = await db.listCollections({ name: collName }).hasNext();
    if (!exists) {
      console.log(`  (collection "${collName}" not found — skipping)`);
      return null;
    }
    return db.collection(collName).find({});
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────
// STEP 0 — build id maps for every collection that gets referenced
// ─────────────────────────────────────────────────────────────────────
async function buildIdMaps(db) {
  console.log("🔗 Building ID maps...");
  const targets = [
    [COLLECTIONS.users, userIdMap],
    [COLLECTIONS.admins, adminIdMap],
    [COLLECTIONS.matches, matchIdMap],
    [COLLECTIONS.ludoTournaments, ludoIdMap],
    [COLLECTIONS.resultSubmissions, resultSubmissionIdMap],
    [COLLECTIONS.ludoResultSubmissions, ludoResultSubmissionIdMap],
    [COLLECTIONS.notifications, notificationIdMap],
  ];

  for (const [collName, map] of targets) {
    const cursor = await safeFind(db, collName);
    if (!cursor) continue;
    let count = 0;
    for await (const doc of cursor) {
      map.set(idStr(doc._id), newId());
      count++;
    }
    console.log(`  mapped ${count} ids → ${collName}`);
  }
}

// ─────────────────────────────────────────────────────────────────────
// STEP 1 — users (main row only; nested arrays migrated later in step 9)
// ─────────────────────────────────────────────────────────────────────
async function migrateUsers(db) {
  console.log("👤 Migrating users...");
  const cursor = await safeFind(db, COLLECTIONS.users);
  if (!cursor) return;
  let count = 0;
  for await (const u of cursor) {
    const id = mapGet(userIdMap, u._id);
    await insertRow("users", {
      id,
      name: u.name || "",
      in_game_name: u.inGameName || "",
      email: u.email || "",
      phone: u.phone,
      password: u.password,
      role: u.role || "user",
      balance: u.balance || 0,
      total_deposit: u.totalDeposit || 0,
      total_withdraw: u.totalWithdraw || 0,
      total_matches_played: u.totalMatchesPlayed || 0,
      total_wins: u.totalWins || 0,
      is_blocked: !!u.isBlocked,
      last_login: u.lastLogin || null,
      referral_code: u.referralCode || null,
      referred_by: mapGet(userIdMap, u.referredBy),
      referral_points: u.referralPoints || 0,
      referral_count: u.referralCount || 0,
      created_at: u.createdAt || new Date(),
      updated_at: u.updatedAt || new Date(),
    });
    count++;
  }
  console.log(`  ✅ ${count} users`);
}

// ─────────────────────────────────────────────────────────────────────
// STEP 2 — admins
// ─────────────────────────────────────────────────────────────────────
async function migrateAdmins(db) {
  console.log("🛡️  Migrating admins...");
  const cursor = await safeFind(db, COLLECTIONS.admins);
  if (!cursor) return;
  let count = 0;
  for await (const a of cursor) {
    const id = mapGet(adminIdMap, a._id);
    await insertRow("admins", {
      id,
      name: a.name || "",
      phone: a.phone,
      password: a.password,
      role: a.role || "admin",
      created_at: a.createdAt || new Date(),
      updated_at: a.updatedAt || new Date(),
    });
    count++;
  }
  console.log(`  ✅ ${count} admins`);
}

// ─────────────────────────────────────────────────────────────────────
// STEP 3 — matches (+ nested joinedUsers[], results[])
// result_submission_id is intentionally left NULL here and backfilled
// in step 10, to avoid an FK error (result_submissions row doesn't
// exist in Postgres yet at this point).
// ─────────────────────────────────────────────────────────────────────
async function migrateMatches(db) {
  console.log("🎮 Migrating matches...");
  const cursor = await safeFind(db, COLLECTIONS.matches);
  if (!cursor) return;
  let count = 0;
  for await (const m of cursor) {
    const id = mapGet(matchIdMap, m._id);
    await insertRow("matches", {
      id,
      title: m.title,
      category: m.category,
      match_type: m.matchType || "solo",
      team_size: m.teamSize || 1,
      entry_fee: m.entryFee || 0,
      win_prize: m.winPrize || 0,
      prize_first: m.prizes?.first || 0,
      prize_second: m.prizes?.second || 0,
      prize_third: m.prizes?.third || 0,
      prize_fourth: m.prizes?.fourth || 0,
      per_kill: m.perKill || 0,
      prize_pool: m.prizePool || 0,
      map: m.map || "Bermuda",
      device: m.device || "Mobile",
      image: m.image || "",
      start_time: m.startTime || null,
      total_players: m.totalPlayers || 48,
      joined_players: m.joinedPlayers || 0,
      room_id: m.roomId || "",
      room_password: m.roomPassword || "",
      is_room_open: !!m.isRoomOpen,
      winner_team: m.winnerTeam || "",
      result_submission_id: null, // backfilled in step 10
      completed_at: m.completedAt || null,
      delete_at: m.deleteAt || null,
      status: m.status || "upcoming",
      created_at: m.createdAt || new Date(),
      updated_at: m.updatedAt || new Date(),
    });

    for (const ju of m.joinedUsers || []) {
      await insertRow("match_participants", {
        id: newId(),
        match_id: id,
        user_id: mapGet(userIdMap, ju.userId),
        in_game_name: ju.inGameName || "",
        game_name: ju.gameName || "",
        slot_number: ju.slotNumber ?? null,
        team: ju.team || "A",
        joined_at: ju.joinedAt || new Date(),
      });
    }

    for (const r of m.results || []) {
      await insertRow("match_results", {
        id: newId(),
        match_id: id,
        user_id: mapGet(userIdMap, r.userId),
        in_game_name: r.inGameName || null,
        position: r.position ?? null,
        kills: r.kills || 0,
        prize: r.prize || 0,
        rank: r.rank ?? null,
        team: r.team || null,
      });
    }
    count++;
  }
  console.log(`  ✅ ${count} matches`);
}

// ─────────────────────────────────────────────────────────────────────
// STEP 4 — ludo tournaments (+ nested joinedUsers[], results[])
// ─────────────────────────────────────────────────────────────────────
async function migrateLudoTournaments(db) {
  console.log("🎲 Migrating ludo tournaments...");
  const cursor = await safeFind(db, COLLECTIONS.ludoTournaments);
  if (!cursor) return;
  let count = 0;
  for await (const t of cursor) {
    const id = mapGet(ludoIdMap, t._id);
    await insertRow("ludo_tournaments", {
      id,
      title: t.title,
      mode: t.mode || "4player",
      entry_fee: t.entryFee || 0,
      win_prize: t.winPrize || 0,
      total_slots: t.totalSlots || 4,
      joined_players: t.joinedPlayers || 0,
      room_code: t.roomCode || "",
      is_room_open: !!t.isRoomOpen,
      map: t.map || "Classic",
      device: t.device || "Mobile",
      image: t.image || "",
      status: t.status || "upcoming",
      start_time: t.startTime || null,
      expires_at: t.expiresAt || null,
      winning_team: t.winningTeam || "",
      prize_first: t.prizes?.first || 0,
      prize_second: t.prizes?.second || 0,
      prize_third: t.prizes?.third || 0,
      prize_fourth: t.prizes?.fourth || 0,
      created_at: t.createdAt || new Date(),
      updated_at: t.updatedAt || new Date(),
    });

    for (const ju of t.joinedUsers || []) {
      await insertRow("ludo_participants", {
        id: newId(),
        tournament_id: id,
        user_id: mapGet(userIdMap, ju.userId),
        slot_number: ju.slotNumber ?? null,
        in_game_name: ju.inGameName || "",
        team_id: ju.teamId || "",
      });
    }

    for (const r of t.results || []) {
      await insertRow("ludo_results", {
        id: newId(),
        tournament_id: id,
        user_id: mapGet(userIdMap, r.userId),
        rank: r.rank ?? null,
        prize: r.prize || 0,
        kills: r.kills || 0,
      });
    }
    count++;
  }
  console.log(`  ✅ ${count} ludo tournaments`);
}

// ─────────────────────────────────────────────────────────────────────
// STEP 5 — deposits
// ─────────────────────────────────────────────────────────────────────
async function migrateDeposits(db) {
  console.log("💰 Migrating deposits...");
  const cursor = await safeFind(db, COLLECTIONS.deposits);
  if (!cursor) return;
  let count = 0;
  for await (const d of cursor) {
    await insertRow("deposits", {
      id: newId(),
      method: d.method,
      amount: d.amount,
      trx_id: d.trxId,
      payment_number: d.paymentNumber || null,
      user_id: mapGet(userIdMap, d.userId),
      status: d.status || "pending",
      approved_by: d.approvedBy || null,
      rejected_by: d.rejectedBy || null,
      created_at: d.createdAt || new Date(),
      updated_at: d.updatedAt || d.createdAt || new Date(),
    });
    count++;
  }
  console.log(`  ✅ ${count} deposits`);
}

// ─────────────────────────────────────────────────────────────────────
// STEP 6 — withdraws
// ─────────────────────────────────────────────────────────────────────
async function migrateWithdraws(db) {
  console.log("🏦 Migrating withdraws...");
  const cursor = await safeFind(db, COLLECTIONS.withdraws);
  if (!cursor) return;
  let count = 0;
  for await (const w of cursor) {
    await insertRow("withdraws", {
      id: newId(),
      user_id: mapGet(userIdMap, w.user),
      amount: w.amount,
      method: w.method,
      account_no: w.accountNo,
      status: w.status || "pending",
      trx_id: w.trxId || null,
      note: w.note || null,
      approved_by: w.approvedBy || null,
      rejected_by: w.rejectedBy || null,
      created_at: w.createdAt || new Date(),
      updated_at: w.updatedAt || w.createdAt || new Date(),
    });
    count++;
  }
  console.log(`  ✅ ${count} withdraws`);
}

// ─────────────────────────────────────────────────────────────────────
// STEP 7 — result submissions (+ nested finalPlayers[])
// ─────────────────────────────────────────────────────────────────────
async function migrateResultSubmissions(db) {
  console.log("📸 Migrating result submissions...");
  const cursor = await safeFind(db, COLLECTIONS.resultSubmissions);
  if (!cursor) return;
  let count = 0;
  for await (const rs of cursor) {
    const id = mapGet(resultSubmissionIdMap, rs._id);
    await insertRow("result_submissions", {
      id,
      match_id: mapGet(matchIdMap, rs.match),
      submitted_by: mapGet(userIdMap, rs.submittedBy),
      screenshot_url: rs.screenshot?.url,
      screenshot_public_id: rs.screenshot?.publicId,
      status: rs.status || "pending_review",
      admin_note: rs.adminNote || "",
      reviewed_by: mapGet(userIdMap, rs.reviewedBy),
      reviewed_at: rs.reviewedAt || null,
      created_at: rs.createdAt || new Date(),
      updated_at: rs.updatedAt || new Date(),
    });

    for (const p of rs.finalPlayers || []) {
      await insertRow("result_submission_players", {
        id: newId(),
        submission_id: id,
        in_game_name: p.inGameName || null,
        kills: p.kills ?? null,
        prize_awarded: p.prizeAwarded ?? null,
        position: p.position ?? null,
      });
    }
    count++;
  }
  console.log(`  ✅ ${count} result submissions`);
}

// ─────────────────────────────────────────────────────────────────────
// STEP 8 — ludo result submissions
// ─────────────────────────────────────────────────────────────────────
async function migrateLudoResultSubmissions(db) {
  console.log("📸 Migrating ludo result submissions...");
  const cursor = await safeFind(db, COLLECTIONS.ludoResultSubmissions);
  if (!cursor) return;
  let count = 0;
  for await (const rs of cursor) {
    await insertRow("ludo_result_submissions", {
      id: mapGet(ludoResultSubmissionIdMap, rs._id),
      match_id: mapGet(ludoIdMap, rs.match), // "match" field points to LudoTournament
      submitted_by: mapGet(userIdMap, rs.submittedBy),
      screenshot_url: rs.screenshot?.url,
      screenshot_public_id: rs.screenshot?.publicId,
      status: rs.status || "pending_review",
      admin_note: rs.adminNote || "",
      reviewed_by: mapGet(userIdMap, rs.reviewedBy),
      reviewed_at: rs.reviewedAt || null,
      created_at: rs.createdAt || new Date(),
      updated_at: rs.updatedAt || new Date(),
    });
    count++;
  }
  console.log(`  ✅ ${count} ludo result submissions`);
}

// ─────────────────────────────────────────────────────────────────────
// STEP 9 — nested user data: transactions[], referralHistory[], joinHistory[]
// Run only after matches are in Postgres, since transactions/joinHistory
// reference match_id.
// ─────────────────────────────────────────────────────────────────────
async function migrateUserNestedData(db) {
  console.log("🧾 Migrating user transactions / referral history / join history...");
  const cursor = await safeFind(db, COLLECTIONS.users);
  if (!cursor) return;
  let tCount = 0, rCount = 0, jCount = 0;
  for await (const u of cursor) {
    const userId = mapGet(userIdMap, u._id);
    if (!userId) continue;

    for (const t of u.transactions || []) {
      await insertRow("transactions", {
        id: newId(),
        user_id: userId,
        type: t.type || null,
        amount: t.amount || null,
        match_id: mapGet(matchIdMap, t.matchId),
        match_title: t.matchTitle || null,
        txn_date: t.date || new Date(),
        created_at: t.date || new Date(),
      });
      tCount++;
    }

    for (const r of u.referralHistory || []) {
      await insertRow("referral_history", {
        id: newId(),
        referrer_id: userId,
        referred_user_id: mapGet(userIdMap, r.userId),
        name: r.name || null,
        phone: r.phone || null,
        deposited: !!r.deposited,
        point_given: !!r.pointGiven,
        joined_at: r.joinedAt || new Date(),
      });
      rCount++;
    }

    for (const j of u.joinHistory || []) {
      await insertRow("match_join_history", {
        id: newId(),
        user_id: userId,
        match_id: mapGet(matchIdMap, j.matchId),
        match_title: j.matchTitle || null,
        entry_fee: j.entryFee || null,
        joined_at: j.joinedAt || new Date(),
      });
      jCount++;
    }
  }
  console.log(`  ✅ ${tCount} transactions, ${rCount} referral entries, ${jCount} join-history entries`);
}

// ─────────────────────────────────────────────────────────────────────
// STEP 10 — backfill matches.result_submission_id (set to NULL in step 3)
// ─────────────────────────────────────────────────────────────────────
async function backfillMatchResultSubmissionId(db) {
  console.log("🔧 Backfilling matches.result_submission_id...");
  const cursor = await safeFind(db, COLLECTIONS.matches);
  if (!cursor) return;
  let count = 0;
  for await (const m of cursor) {
    if (!m.resultSubmissionId) continue;
    const matchId = mapGet(matchIdMap, m._id);
    const rsId = mapGet(resultSubmissionIdMap, m.resultSubmissionId);
    if (!matchId || !rsId) continue;
    try {
      await pg.query(
        `update matches set result_submission_id = $1 where id = $2`,
        [rsId, matchId]
      );
      count++;
    } catch (err) {
      errorCount++;
      console.error("  ⚠️  backfill failed:", err.message);
    }
  }
  console.log(`  ✅ backfilled ${count} matches`);
}

// ─────────────────────────────────────────────────────────────────────
// STEP 11 — notifications
// ─────────────────────────────────────────────────────────────────────
async function migrateNotifications(db) {
  console.log("🔔 Migrating notifications...");
  const cursor = await safeFind(db, COLLECTIONS.notifications);
  if (!cursor) return;
  let count = 0;
  for await (const n of cursor) {
    await insertRow("notifications", {
      id: mapGet(notificationIdMap, n._id),
      title: n.title,
      message: n.message,
      match_id: mapGet(matchIdMap, n.matchId),
      category: n.category || "general",
      created_at: n.createdAt || new Date(),
      updated_at: n.updatedAt || new Date(),
    });
    count++;
  }
  console.log(`  ✅ ${count} notifications`);
}

// ─────────────────────────────────────────────────────────────────────
// STEP 12 — per-user notification read status
// ─────────────────────────────────────────────────────────────────────
async function migrateUserNotifications(db) {
  console.log("🔔 Migrating user notifications...");
  const cursor = await safeFind(db, COLLECTIONS.userNotifications);
  if (!cursor) return;
  let count = 0;
  for await (const un of cursor) {
    await insertRow("user_notifications", {
      id: newId(),
      notification_id: mapGet(notificationIdMap, un.notificationId),
      user_id: mapGet(userIdMap, un.userId),
      is_read: !!un.isRead,
      created_at: un.createdAt || new Date(),
      updated_at: un.updatedAt || new Date(),
    });
    count++;
  }
  console.log(`  ✅ ${count} user notifications`);
}

// ─────────────────────────────────────────────────────────────────────
// STEP 13 — push subscriptions
// ─────────────────────────────────────────────────────────────────────
async function migratePushSubscriptions(db) {
  console.log("📲 Migrating push subscriptions...");
  const cursor = await safeFind(db, COLLECTIONS.pushSubscriptions);
  if (!cursor) return;
  let count = 0;
  for await (const p of cursor) {
    await insertRow("push_subscriptions", {
      id: newId(),
      endpoint: p.endpoint,
      user_id: mapGet(userIdMap, p.userId),
      subscription: JSON.stringify(p.subscription || {}),
      created_at: p.createdAt || new Date(),
      updated_at: p.updatedAt || new Date(),
    });
    count++;
  }
  console.log(`  ✅ ${count} push subscriptions`);
}

// ─────────────────────────────────────────────────────────────────────
// STEP 14 — payment numbers (no FKs)
// ─────────────────────────────────────────────────────────────────────
async function migratePaymentNumbers(db) {
  console.log("💳 Migrating payment numbers...");
  const cursor = await safeFind(db, COLLECTIONS.paymentNumbers);
  if (!cursor) return;
  let count = 0;
  for await (const p of cursor) {
    await insertRow("payment_numbers", {
      id: newId(),
      method: p.method,
      number: p.number,
      limit: p.limit ?? null,
      active: p.active !== false,
      created_at: p.createdAt || new Date(),
      updated_at: p.updatedAt || new Date(),
    });
    count++;
  }
  console.log(`  ✅ ${count} payment numbers`);
}

// ─────────────────────────────────────────────────────────────────────
// STEP 15 — activity logs (no FKs)
// ─────────────────────────────────────────────────────────────────────
async function migrateActivityLogs(db) {
  console.log("📋 Migrating activity logs...");
  const cursor = await safeFind(db, COLLECTIONS.activityLogs);
  if (!cursor) return;
  let count = 0;
  for await (const a of cursor) {
    await insertRow("activity_logs", {
      id: newId(),
      admin_name: a.adminName || null,
      action: a.action || null,
      target: a.target || null,
      type: a.type || null,
      created_at: a.createdAt || new Date(),
      updated_at: a.updatedAt || new Date(),
    });
    count++;
  }
  console.log(`  ✅ ${count} activity logs`);
}

// ─────────────────────────────────────────────────────────────────────
// STEP 16 — point convert requests
// ─────────────────────────────────────────────────────────────────────
async function migratePointConvertRequests(db) {
  console.log("🔁 Migrating point convert requests...");
  const cursor = await safeFind(db, COLLECTIONS.pointConvertRequests);
  if (!cursor) return;
  let count = 0;
  for await (const p of cursor) {
    await insertRow("point_convert_requests", {
      id: newId(),
      user_id: mapGet(userIdMap, p.userId),
      points: p.points,
      taka: p.taka,
      status: p.status || "pending",
      admin_note: p.adminNote || "",
      created_at: p.createdAt || new Date(),
      updated_at: p.updatedAt || new Date(),
    });
    count++;
  }
  console.log(`  ✅ ${count} point convert requests`);
}

// ─────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("Connecting to MongoDB and Supabase...");
  await mongoClient.connect();
  await pg.connect();
  const db = mongoClient.db(); // uses the db name embedded in MONGO_URI
  console.log("✅ Connected.\n");

  await buildIdMaps(db);

  await migrateUsers(db);
  await migrateAdmins(db);
  await migrateMatches(db);
  await migrateLudoTournaments(db);
  await migrateDeposits(db);
  await migrateWithdraws(db);
  await migrateResultSubmissions(db);
  await migrateLudoResultSubmissions(db);
  await migrateUserNestedData(db);
  await backfillMatchResultSubmissionId(db);
  await migrateNotifications(db);
  await migrateUserNotifications(db);
  await migratePushSubscriptions(db);
  await migratePaymentNumbers(db);
  await migrateActivityLogs(db);
  await migratePointConvertRequests(db);

  console.log(`\n🎉 Migration finished. Errors: ${errorCount}`);
  if (errorCount > 0) {
    console.log("⚠️  উপরে যত warning দেখাচ্ছে, সেগুলো একবার চেক করে দেখুন — কিছু row skip হতে পারে।");
  }

  await mongoClient.close();
  await pg.end();
}

main().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});