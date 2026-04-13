const express = require('express');
const pool = require('../db/pool');
const { auth } = require('../middleware/auth');

const router = express.Router();

// GET /api/referrals/stats - get referral stats for current user
router.get('/stats', auth, async (req, res) => {
  try {
    // Level 1: direct referrals
    const l1 = await pool.query(
      `SELECT u.id, u.name, u.email, u.created_at,
              COALESCE(SUM(rc.amount), 0) as commission_earned
       FROM users u
       LEFT JOIN referral_commissions rc ON rc.source_user_id = u.id AND rc.beneficiary_id = $1 AND rc.level = 1
       WHERE u.referred_by = $1
       GROUP BY u.id, u.name, u.email, u.created_at`,
      [req.user.id]
    );

    // Level 2: referrals of referrals
    const l2 = await pool.query(
      `SELECT u.id, u.name, u.email, u.created_at,
              COALESCE(SUM(rc.amount), 0) as commission_earned
       FROM users u
       LEFT JOIN referral_commissions rc ON rc.source_user_id = u.id AND rc.beneficiary_id = $1 AND rc.level = 2
       WHERE u.referred_by IN (SELECT id FROM users WHERE referred_by = $1)
       GROUP BY u.id, u.name, u.email, u.created_at`,
      [req.user.id]
    );

    // Level 3
    const l3 = await pool.query(
      `SELECT u.id, u.name, u.email, u.created_at,
              COALESCE(SUM(rc.amount), 0) as commission_earned
       FROM users u
       LEFT JOIN referral_commissions rc ON rc.source_user_id = u.id AND rc.beneficiary_id = $1 AND rc.level = 3
       WHERE u.referred_by IN (
         SELECT id FROM users WHERE referred_by IN (
           SELECT id FROM users WHERE referred_by = $1
         )
       )
       GROUP BY u.id, u.name, u.email, u.created_at`,
      [req.user.id]
    );

    // Total commissions
    const totals = await pool.query(
      `SELECT level, SUM(amount) as total FROM referral_commissions
       WHERE beneficiary_id = $1 GROUP BY level`,
      [req.user.id]
    );

    const totalByLevel = { 1: 0, 2: 0, 3: 0 };
    totals.rows.forEach((r) => {
      totalByLevel[r.level] = parseFloat(r.total);
    });

    // Get current user's referral code
    const userResult = await pool.query(
      'SELECT referral_code FROM users WHERE id = $1',
      [req.user.id]
    );

    res.json({
      referralCode: userResult.rows[0]?.referral_code,
      levels: {
        1: { referrals: l1.rows, totalCommission: totalByLevel[1], count: l1.rows.length },
        2: { referrals: l2.rows, totalCommission: totalByLevel[2], count: l2.rows.length },
        3: { referrals: l3.rows, totalCommission: totalByLevel[3], count: l3.rows.length },
      },
      totalCommission: totalByLevel[1] + totalByLevel[2] + totalByLevel[3],
    });
  } catch (err) {
    console.error('Referral stats error:', err);
    res.status(500).json({ error: 'Failed to fetch referral stats' });
  }
});

module.exports = router;
