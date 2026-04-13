const express = require('express');
const pool = require('../db/pool');
const { adminAuth } = require('../middleware/auth');
const { processReferralCommissions } = require('./investments');

const router = express.Router();

// GET /api/admin/stats - overview stats
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const [users, investments, pendingPops, pendingWithdrawals, totalInvested] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users WHERE role = $1', ['user']),
      pool.query('SELECT COUNT(*) FROM investments'),
      pool.query("SELECT COUNT(*) FROM investments WHERE status = 'pending'"),
      pool.query("SELECT COUNT(*) FROM withdrawals WHERE status = 'pending'"),
      pool.query("SELECT COALESCE(SUM(amount), 0) FROM investments WHERE status = 'active' OR status = 'completed'"),
    ]);
    res.json({
      totalUsers: parseInt(users.rows[0].count),
      totalInvestments: parseInt(investments.rows[0].count),
      pendingPops: parseInt(pendingPops.rows[0].count),
      pendingWithdrawals: parseInt(pendingWithdrawals.rows[0].count),
      totalInvested: parseFloat(totalInvested.rows[0].coalesce),
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /api/admin/investments - list all investments with user info
router.get('/investments', adminAuth, async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  try {
    let query = `
      SELECT i.*, u.name as user_name, u.email as user_email
      FROM investments i
      JOIN users u ON u.id = i.user_id
    `;
    const params = [];
    if (status) {
      query += ' WHERE i.status = $1';
      params.push(status);
    }
    query += ` ORDER BY i.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM investments${status ? ' WHERE status = $1' : ''}`,
      status ? [status] : []
    );
    res.json({ investments: result.rows, total: parseInt(countResult.rows[0].count) });
  } catch (err) {
    console.error('Admin investments error:', err);
    res.status(500).json({ error: 'Failed to fetch investments' });
  }
});

// PUT /api/admin/investments/:id/approve - approve POP and activate investment
router.put('/investments/:id/approve', adminAuth, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const investResult = await client.query(
      "SELECT * FROM investments WHERE id = $1 AND status = 'pending'",
      [req.params.id]
    );
    if (investResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Investment not found or not pending' });
    }
    const investment = investResult.rows[0];

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 60 * 24 * 60 * 60 * 1000);

    await client.query(
      `UPDATE investments SET status = 'active', start_date = $1, end_date = $2, updated_at = NOW()
       WHERE id = $3`,
      [startDate, endDate, investment.id]
    );

    // Update transaction status
    await client.query(
      `UPDATE transactions SET status = 'approved', updated_at = NOW()
       WHERE investment_id = $1 AND type = 'investment'`,
      [investment.id]
    );

    // Process referral commissions
    await processReferralCommissions(client, investment.user_id, investment.id, investment.amount);

    await client.query('COMMIT');
    res.json({ message: 'Investment approved', id: investment.id });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Approve investment error:', err);
    res.status(500).json({ error: 'Failed to approve investment' });
  } finally {
    client.release();
  }
});

// PUT /api/admin/investments/:id/reject - reject POP
router.put('/investments/:id/reject', adminAuth, async (req, res) => {
  const { reason } = req.body;
  try {
    const result = await pool.query(
      `UPDATE investments SET status = 'rejected', updated_at = NOW() WHERE id = $1 AND status = 'pending' RETURNING *`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Investment not found or not pending' });
    }
    await pool.query(
      `UPDATE transactions SET status = 'rejected', description = $2, updated_at = NOW()
       WHERE investment_id = $1 AND type = 'investment'`,
      [req.params.id, reason || 'Rejected by admin']
    );
    res.json({ message: 'Investment rejected', id: req.params.id });
  } catch (err) {
    console.error('Reject investment error:', err);
    res.status(500).json({ error: 'Failed to reject investment' });
  }
});

// GET /api/admin/withdrawals - list all withdrawals
router.get('/withdrawals', adminAuth, async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  try {
    let query = `
      SELECT w.*, u.name as user_name, u.email as user_email
      FROM withdrawals w JOIN users u ON u.id = w.user_id
    `;
    const params = [];
    if (status) {
      query += ' WHERE w.status = $1';
      params.push(status);
    }
    query += ` ORDER BY w.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM withdrawals${status ? ' WHERE status = $1' : ''}`,
      status ? [status] : []
    );
    res.json({ withdrawals: result.rows, total: parseInt(countResult.rows[0].count) });
  } catch (err) {
    console.error('Admin withdrawals error:', err);
    res.status(500).json({ error: 'Failed to fetch withdrawals' });
  }
});

// PUT /api/admin/withdrawals/:id/approve
router.put('/withdrawals/:id/approve', adminAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE withdrawals SET status = 'approved', updated_at = NOW()
       WHERE id = $1 AND status = 'pending' RETURNING *`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Withdrawal not found or not pending' });
    }
    await pool.query(
      `UPDATE transactions SET status = 'approved', updated_at = NOW()
       WHERE user_id = $1 AND type = 'withdrawal' AND status = 'pending'`,
      [result.rows[0].user_id]
    );
    res.json({ message: 'Withdrawal approved', id: req.params.id });
  } catch (err) {
    console.error('Approve withdrawal error:', err);
    res.status(500).json({ error: 'Failed to approve withdrawal' });
  }
});

// PUT /api/admin/withdrawals/:id/reject
router.put('/withdrawals/:id/reject', adminAuth, async (req, res) => {
  const { reason } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `UPDATE withdrawals SET status = 'rejected', admin_note = $2, updated_at = NOW()
       WHERE id = $1 AND status = 'pending' RETURNING *`,
      [req.params.id, reason || 'Rejected by admin']
    );
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Withdrawal not found or not pending' });
    }
    // Refund the balance
    await client.query(
      'UPDATE users SET balance = balance + $1 WHERE id = $2',
      [result.rows[0].amount, result.rows[0].user_id]
    );
    await client.query(
      `UPDATE transactions SET status = 'rejected', updated_at = NOW()
       WHERE user_id = $1 AND type = 'withdrawal' AND status = 'pending'`,
      [result.rows[0].user_id]
    );
    await client.query('COMMIT');
    res.json({ message: 'Withdrawal rejected and balance refunded', id: req.params.id });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Reject withdrawal error:', err);
    res.status(500).json({ error: 'Failed to reject withdrawal' });
  } finally {
    client.release();
  }
});

// GET /api/admin/users - list all users
router.get('/users', adminAuth, async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.phone, u.referral_code, u.role,
              u.balance, u.total_earned, u.is_active, u.created_at,
              COUNT(DISTINCT i.id) FILTER (WHERE i.status = 'active') as active_investments,
              COUNT(DISTINCT i.id) as total_investments
       FROM users u
       LEFT JOIN investments i ON i.user_id = u.id
       GROUP BY u.id
       ORDER BY u.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    const countResult = await pool.query('SELECT COUNT(*) FROM users');
    res.json({ users: result.rows, total: parseInt(countResult.rows[0].count) });
  } catch (err) {
    console.error('Admin users error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// PUT /api/admin/users/:id/toggle - toggle user active status
router.put('/users/:id/toggle', adminAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE users SET is_active = NOT is_active, updated_at = NOW() WHERE id = $1 RETURNING id, name, email, is_active',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Toggle user error:', err);
    res.status(500).json({ error: 'Failed to toggle user status' });
  }
});

// POST /api/admin/daily-profits - process daily profits for all active investments
router.post('/daily-profits', adminAuth, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const activeInvestments = await client.query(
      `SELECT * FROM investments WHERE status = 'active' AND days_elapsed < 60`
    );

    let processed = 0;
    for (const inv of activeInvestments.rows) {
      const newDays = inv.days_elapsed + 1;
      const status = newDays >= 60 ? 'completed' : 'active';

      await client.query(
        `UPDATE investments SET days_elapsed = $1, status = $2, updated_at = NOW() WHERE id = $3`,
        [newDays, status, inv.id]
      );

      // Credit daily profit to user balance
      await client.query(
        'UPDATE users SET balance = balance + $1, total_earned = total_earned + $1 WHERE id = $2',
        [inv.daily_profit, inv.user_id]
      );

      await client.query(
        `INSERT INTO transactions (user_id, investment_id, type, amount, status, description)
         VALUES ($1, $2, 'daily_profit', $3, 'approved', $4)`,
        [inv.user_id, inv.id, inv.daily_profit, `Day ${newDays} profit for ${inv.package_name} package`]
      );

      processed++;
    }

    await client.query('COMMIT');
    res.json({ message: `Processed ${processed} investments`, processed });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Daily profits error:', err);
    res.status(500).json({ error: 'Failed to process daily profits' });
  } finally {
    client.release();
  }
});

module.exports = router;
