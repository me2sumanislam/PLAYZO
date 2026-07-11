 // routes/notifications.js
// (Postgres/Supabase version — converted from Mongoose)
const express = require("express");
const router = express.Router();
const { Pool } = require("pg");
const { protect } = require("../middleware/auth");
const { sendToAll } = require("../utils/sendNotification");

const pool = require("../utils/db");

// GET /api/notifications
router.get("/", protect, async (req, res) => {
  const client = await pool.connect();
  try {
    const { isRead, limit = 20, category } = req.query;

    const params = [req.user.id];
    const conditions = [`un.user_id = $1`];
    if (isRead === "false") conditions.push(`un.is_read = false`);
    if (isRead === "true") conditions.push(`un.is_read = true`);
    if (category) {
      params.push(category);
      conditions.push(`n.category = $${params.length}`);
    }
    params.push(Number(limit));

    const { rows } = await client.query(
      `SELECT un.*, n.title, n.message, n.category, n.match_id, n.created_at AS notif_created_at
       FROM user_notifications un
       JOIN notifications n ON n.id = un.notification_id
       WHERE ${conditions.join(" AND ")}
       ORDER BY un.created_at DESC
       LIMIT $${params.length}`,
      params
    );

    const { rows: countRows } = await client.query(
      `SELECT COUNT(*)::int AS count FROM user_notifications WHERE user_id = $1 AND is_read = false`,
      [req.user.id]
    );

    const notifications = rows.map((n) => ({
      _id: n.id,
      id: n.id,
      isRead: n.is_read,
      createdAt: n.created_at,
      notificationId: {
        _id: n.notification_id,
        title: n.title,
        message: n.message,
        category: n.category,
        matchId: n.match_id,
        createdAt: n.notif_created_at,
      },
    }));

    res.json({
      success: true,
      notifications,
      unreadCount: countRows[0].count,
      count: notifications.length,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
});

// PATCH /api/notifications/read-all
router.patch("/read-all", protect, async (req, res) => {
  try {
    await pool.query(
      `UPDATE user_notifications SET is_read = true, updated_at = now()
       WHERE user_id = $1 AND is_read = false`,
      [req.user.id]
    );
    res.json({ success: true, message: "All marked as read" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/notifications/read/:id
router.patch("/read/:id", protect, async (req, res) => {
  try {
    await pool.query(
      `UPDATE user_notifications SET is_read = true, updated_at = now()
       WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    res.json({ success: true, message: "Marked as read" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/notifications/clear
router.delete("/clear", protect, async (req, res) => {
  try {
    await pool.query(`DELETE FROM user_notifications WHERE user_id = $1`, [req.user.id]);
    res.json({ success: true, message: "All notifications cleared" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Internal helper — matchRoutes.js ও ludoMatchRoutes.js এই ফাংশন ব্যবহার করে
router.sendMatchNotification = async (match, category = "general") => {
  const client = await pool.connect();
  try {
    const isLudo = category === "ludo";
    const emoji = isLudo ? "🎲" : "🎮";
    const gameLabel = isLudo ? "Ludo Match" : "Free Fire Match";
    const url = isLudo
      ? `/app?tab=ludo`
      : `/app?tab=results&matchId=${match._id || match.id}`;

    const notifTitle = `${emoji} নতুন ${gameLabel} তৈরি হয়েছে!`;
    const notifMessage = `${match.title} — Entry: ৳${match.entryFee} | Prize: ৳${match.winPrize}`;

    const { rows: notifRows } = await client.query(
      `INSERT INTO notifications (title, message, match_id, category)
       VALUES ($1,$2,$3,$4) RETURNING id`,
      [notifTitle, notifMessage, isLudo ? null : (match._id || match.id), category]
      // ⚠️ notifications.match_id শুধু `matches` টেবিলের সাথে FK link (ludo_tournaments না),
      // তাই ludo ম্যাচের ক্ষেত্রে NULL রাখা হলো (message এ ম্যাচের title আছে)
    );
    const notifId = notifRows[0].id;

    // ✅ সব ইউজারের জন্য এক কোয়েরিতে bulk insert (loop এড়িয়ে)
    const { rows: countRows } = await client.query(
      `INSERT INTO user_notifications (notification_id, user_id, is_read)
       SELECT $1, id, false FROM users
       RETURNING id`,
      [notifId]
    );

    await sendToAll({
      title: notifTitle,
      message: notifMessage,
      url,
      matchId: isLudo ? null : (match._id || match.id),
      category,
    });

    console.log(`📨 [${category}] Match notification sent to ${countRows.length} users`);
    return { success: true, count: countRows.length };
  } catch (err) {
    console.error("❌ sendMatchNotification error:", err.message);
    return { success: false, message: err.message };
  } finally {
    client.release();
  }
};

module.exports = router;