 // controllers/withdrawController.js
// (Postgres/Supabase version — converted from Mongoose)
const { Pool } = require("pg");
const axios = require("axios");
const { sendToUser } = require("../utils/sendNotification");

const pool = new Pool({ connectionString: process.env.SUPABASE_DB_URL });

// ─── SMS helper ───────────────────────────────────────────────────────────
const sendSMS = async (phone, message) => {
  try {
    const apiKey = process.env.SMS_API_KEY;
    const sender = process.env.SMS_SENDER_ID || "YourApp";
    if (!apiKey) return;

    await axios.get("https://api.greenweb.com.bd/api.php", {
      params: { token: apiKey, to: phone, message, sender },
    });
  } catch (err) {
    console.error("SMS failed:", err.message);
  }
};

// ─── Withdraw approve/reject notification (push + in-app) ────────────────
const sendWithdrawNotification = async ({ userId, title, message, category = "withdraw" }) => {
  try {
    // 1) DB তে save (bell dropdown / unread count এর জন্য)
    const { rows: notifRows } = await pool.query(
      `INSERT INTO notifications (title, message, category) VALUES ($1,$2,$3) RETURNING id`,
      [title, message, category]
    );
    await pool.query(
      `INSERT INTO user_notifications (notification_id, user_id, is_read) VALUES ($1,$2,false)`,
      [notifRows[0].id, userId]
    );

    // 2) Push notification (OneSignal)
    await sendToUser({ userId, title, message, url: "/app?tab=wallet", category });
  } catch (err) {
    console.error("❌ sendWithdrawNotification error:", err.message);
  }
};

function toWithdrawJson(row) {
  if (!row) return row;
  return {
    _id: row.id,
    id: row.id,
    user: row.user_id,
    amount: row.amount,
    method: row.method,
    accountNo: row.account_no,
    status: row.status,
    trxId: row.trx_id,
    note: row.note,
    approvedBy: row.approved_by,
    rejectedBy: row.rejected_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ─── USER: submit request ─────────────────────────────────────────────────
exports.createWithdraw = async (req, res) => {
  const client = await pool.connect();
  try {
    const { amount, method, accountNo } = req.body;
    const userId = req.user.id;

    if (amount < 100) {
      client.release();
      return res.status(400).json({ message: "Minimum ৳100" });
    }

    await client.query("BEGIN");

    const { rows: userRows } = await client.query(
      `SELECT * FROM users WHERE id = $1 FOR UPDATE`,
      [userId]
    );
    const user = userRows[0];
    if (!user) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "User not found" });
    }

    if (Number(user.balance) < Number(amount)) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Insufficient balance" });
    }

    const { rows: pendingRows } = await client.query(
      `SELECT id FROM withdraws WHERE user_id = $1 AND status = 'pending'`,
      [userId]
    );
    if (pendingRows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "You already have a pending request" });
    }

    // ✅ Balance কাটো (immediately, request submit করার সময়ই)
    await client.query(`UPDATE users SET balance = balance - $1 WHERE id = $2`, [amount, userId]);

    const { rows: withdrawRows } = await client.query(
      `INSERT INTO withdraws (user_id, amount, method, account_no)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [userId, amount, method, accountNo]
    );

    await client.query("COMMIT");

    res.json({ message: "Request submitted", withdraw: toWithdrawJson(withdrawRows[0]) });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};

// ─── USER: my history ─────────────────────────────────────────────────────
exports.myWithdraw = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM withdraws WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json(rows.map(toWithdrawJson));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── ADMIN: all requests ──────────────────────────────────────────────────
exports.getAllWithdraw = async (req, res) => {
  try {
    const { status } = req.query;
    const params = [];
    let where = "";
    if (status) {
      params.push(status);
      where = `WHERE w.status = $${params.length}`;
    }

    const { rows } = await pool.query(
      `SELECT w.*, u.phone AS user_phone, u.name AS user_name, u.balance AS user_balance
       FROM withdraws w
       LEFT JOIN users u ON u.id = w.user_id
       ${where}
       ORDER BY w.created_at DESC`,
      params
    );

    const mapped = rows.map((w) => ({
      ...toWithdrawJson(w),
      user: { phone: w.user_phone, name: w.user_name, balance: w.user_balance },
    }));

    res.json(mapped);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── ADMIN: approve ───────────────────────────────────────────────────────
exports.approveWithdraw = async (req, res) => {
  const client = await pool.connect();
  try {
    const { trxId, note, adminName } = req.body;

    await client.query("BEGIN");

    const { rows: witRows } = await client.query(
      `SELECT w.*, u.phone AS user_phone
       FROM withdraws w
       LEFT JOIN users u ON u.id = w.user_id
       WHERE w.id = $1
       FOR UPDATE`,
      [req.params.id]
    );
    const withdraw = witRows[0];
    if (!withdraw) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Not found" });
    }
    if (withdraw.status !== "pending") {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Already processed" });
    }

    // ✅ Balance আগেই কাটা হয়ে গেছে (submit করার সময়), এখন শুধু status update
    const { rows: updatedRows } = await client.query(
      `UPDATE withdraws
       SET status = 'approved', trx_id = $1, note = $2, approved_by = $3, updated_at = now()
       WHERE id = $4
       RETURNING *`,
      [trxId || "", note || "Payment sent", adminName, withdraw.id]
    );

    await client.query("COMMIT");

    const smsText = `আপনার ৳${withdraw.amount} উইথড্র রিকোয়েস্ট অনুমোদিত হয়েছে। ${withdraw.method}: ${withdraw.account_no}${trxId ? `. TrxID: ${trxId}` : ""}`;
    await sendSMS(withdraw.user_phone, smsText);

    // ✅ Push + in-app notification
    await sendWithdrawNotification({
      userId: withdraw.user_id,
      title: "✅ উইথড্র সফল হয়েছে!",
      message: `আপনার ৳${withdraw.amount} উইথড্র Approved হয়েছে।${trxId ? ` TrxID: ${trxId}` : ""}`,
    });

    res.json({ message: "Approved", withdraw: toWithdrawJson(updatedRows[0]) });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};

// ─── ADMIN: reject ────────────────────────────────────────────────────────
exports.rejectWithdraw = async (req, res) => {
  const client = await pool.connect();
  try {
    const { note, adminName } = req.body;

    await client.query("BEGIN");

    const { rows: witRows } = await client.query(
      `SELECT w.*, u.phone AS user_phone
       FROM withdraws w
       LEFT JOIN users u ON u.id = w.user_id
       WHERE w.id = $1
       FOR UPDATE`,
      [req.params.id]
    );
    const withdraw = witRows[0];
    if (!withdraw) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Not found" });
    }
    if (withdraw.status !== "pending") {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Already processed" });
    }

    // ✅ Reject হলে balance ফেরত দাও
    await client.query(`UPDATE users SET balance = balance + $1 WHERE id = $2`, [
      withdraw.amount,
      withdraw.user_id,
    ]);

    const { rows: updatedRows } = await client.query(
      `UPDATE withdraws
       SET status = 'rejected', note = $1, rejected_by = $2, updated_at = now()
       WHERE id = $3
       RETURNING *`,
      [note || "Rejected by admin", adminName, withdraw.id]
    );

    await client.query("COMMIT");

    const smsText = `আপনার ৳${withdraw.amount} উইথড্র রিকোয়েস্ট বাতিল হয়েছে। কারণ: ${note || "Admin কর্তৃক বাতিল"}`;
    await sendSMS(withdraw.user_phone, smsText);

    // ✅ Push + in-app notification
    await sendWithdrawNotification({
      userId: withdraw.user_id,
      title: "❌ উইথড্র Reject হয়েছে",
      message: `আপনার ৳${withdraw.amount} উইথড্র বাতিল হয়েছে। কারণ: ${note || "Admin কর্তৃক বাতিল"}। টাকা ব্যালেন্সে ফেরত দেওয়া হয়েছে।`,
    });

    res.json({ message: "Rejected", withdraw: toWithdrawJson(updatedRows[0]) });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};