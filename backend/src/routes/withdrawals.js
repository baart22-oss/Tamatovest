const express = require('express');
const pool = require('../db/pool');
const { auth } = require('../middleware/auth');
const { MIN_WITHDRAWAL } = require('../utils/constants');

const router = express.Router();

// POST /api/withdrawals - request a withdrawal
router.post('/', auth, async (req, res) => {
  const { amount, bankName, accountHolder, accountNumber, branchCode } = req.body;
  if (!amount || !bankName || !accountHolder || !accountNumber || !branchCode) {
    return res.status(400).json({ error: 'All banking details and amount are required' });
  }
  const withdrawalAmount = parseFloat(amount);
  if (isNaN(withdrawalAmount) || withdrawalAmount < MIN_WITHDRAWAL) {
    return res.status(400).json({ error: `Minimum withdrawal amount is R${MIN_WITHDRAWAL}` });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const userResult = await client.query('SELECT balance FROM users WHERE id = $1', [req.user.id]);
    const user = userResult.rows[0];
    if (!user || user.balance < withdrawalAmount) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Deduct balance immediately (hold it)
    await client.query(
      'UPDATE users SET balance = balance - $1 WHERE id = $2',
      [withdrawalAmount, req.user.id]
    );

    const result = await client.query(
      `INSERT INTO withdrawals (user_id, amount, bank_name, account_holder, account_number, branch_code)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.user.id, withdrawalAmount, bankName, accountHolder, accountNumber, branchCode]
    );

    await client.query(
      `INSERT INTO transactions (user_id, type, amount, status, description)
       VALUES ($1, 'withdrawal', $2, 'pending', 'Withdrawal request')`,
      [req.user.id, withdrawalAmount]
    );

    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Withdrawal error:', err);
    res.status(500).json({ error: 'Failed to process withdrawal' });
  } finally {
    client.release();
  }
});

// GET /api/withdrawals - list user's withdrawals
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM withdrawals WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get withdrawals error:', err);
    res.status(500).json({ error: 'Failed to fetch withdrawals' });
  }
});

// PUT /api/banking - save/update banking details
router.put('/banking', auth, async (req, res) => {
  const { bankName, accountHolder, accountNumber, branchCode } = req.body;
  if (!bankName || !accountHolder || !accountNumber || !branchCode) {
    return res.status(400).json({ error: 'All banking details are required' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO banking_details (user_id, bank_name, account_holder, account_number, branch_code)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id) DO UPDATE
       SET bank_name = $2, account_holder = $3, account_number = $4, branch_code = $5, updated_at = NOW()
       RETURNING *`,
      [req.user.id, bankName, accountHolder, accountNumber, branchCode]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Banking details error:', err);
    res.status(500).json({ error: 'Failed to save banking details' });
  }
});

module.exports = router;
