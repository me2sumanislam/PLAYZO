 // routes/paymentNumbers.js
// (Postgres/Supabase version — converted from Mongoose)
//
// ⚠️ নিরাপত্তা ফিক্স: আগে create/update/delete এ কোনো auth ছিল না — যে কেউ
// payment number বদলে/মুছে দিতে পারত। এখন create/update/delete এ adminOnly যোগ হলো।
// GET (list) সবার জন্য খোলা রাখা হলো (deposit page এ ব্যবহার হয়)।

const express = require("express");
const router = express.Router();
const { Pool } = require("pg");
const { protect, adminOnly } = require("../middleware/auth");

const pool = require("../utils/db");

function toPaymentNumberJson(row) {
  if (!row) return row;
  return {
    _id: row.id,
    id: row.id,
    method: row.method,
    number: row.number,
    limit: row.limit,
    active: row.active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// GET all
router.get("/", async (req, res) => {
  try {
    const { activeOnly } = req.query;
    const where = activeOnly === "true" ? "WHERE active = true" : "";
    const { rows } = await pool.query(
      `SELECT * FROM payment_numbers ${where} ORDER BY created_at DESC`
    );
    res.json(rows.map(toPaymentNumberJson));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST create
router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const { method, number, limit, active } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO payment_numbers (method, number, "limit", active)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [method, number, limit ?? null, active !== false]
    );
    res.json({ success: true, data: toPaymentNumberJson(rows[0]) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update
router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    const { method, number, limit, active } = req.body;
    const { rows } = await pool.query(
      `UPDATE payment_numbers
       SET method = COALESCE($1, method),
           number = COALESCE($2, number),
           "limit" = COALESCE($3, "limit"),
           active = COALESCE($4, active),
           updated_at = now()
       WHERE id = $5
       RETURNING *`,
      [method ?? null, number ?? null, limit ?? null, active ?? null, req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Not found" });
    }
    res.json({ success: true, data: toPaymentNumberJson(rows[0]) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    await pool.query(`DELETE FROM payment_numbers WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;