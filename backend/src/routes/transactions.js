const express = require('express');
const pool = require('../db/pool');
const { auth } = require('../middleware/auth');

const router = express.Router();

// GET /api/transactions - list user's transactions
router.get('/', auth, async (req, res) => {
  const { type, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  try {
    let query = 'SELECT * FROM transactions WHERE user_id = $1';
    const params = [req.user.id];
    if (type) {
      query += ' AND type = $2';
      params.push(type);
    }
    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    const result = await pool.query(query, params);
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM transactions WHERE user_id = $1${type ? ' AND type = $2' : ''}`,
      type ? [req.user.id, type] : [req.user.id]
    );
    res.json({ transactions: result.rows, total: parseInt(countResult.rows[0].count) });
  } catch (err) {
    console.error('Transactions error:', err);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

module.exports = router;
