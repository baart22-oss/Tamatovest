const express = require('express');
const multer = require('multer');
const path = require('path');
const rateLimit = require('express-rate-limit');
const pool = require('../db/pool');
const { auth } = require('../middleware/auth');
const { INVESTMENT_PACKAGES, calculateInvestmentReturns, REFERRAL_RATES } = require('../utils/constants');

const router = express.Router();

// Per-route upload rate limiter (10 uploads/hour per IP)
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many investment submissions, please try again later.' },
});

// Configure multer for POP uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads')),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `pop-${unique}${path.extname(file.originalname)}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|pdf/;
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    if (allowed.test(ext)) return cb(null, true);
    cb(new Error('Only image/pdf files are allowed'));
  },
});

// GET /api/investments/packages
router.get('/packages', (req, res) => {
  const packages = INVESTMENT_PACKAGES.map((pkg) => {
    const { dailyProfit, totalProfit } = calculateInvestmentReturns(pkg.amount);
    return { ...pkg, dailyProfit, totalProfit, durationDays: 60, dailyRate: '5%' };
  });
  res.json(packages);
});

// POST /api/investments - create new investment with POP upload
router.post('/', uploadLimiter, auth, upload.single('pop'), async (req, res) => {
  const { packageName } = req.body;
  if (!packageName) {
    return res.status(400).json({ error: 'Package name is required' });
  }
  if (!req.file) {
    return res.status(400).json({ error: 'Proof of payment image is required' });
  }

  const pkg = INVESTMENT_PACKAGES.find((p) => p.name === packageName);
  if (!pkg) {
    return res.status(400).json({ error: 'Invalid package' });
  }

  const { dailyProfit, totalProfit } = calculateInvestmentReturns(pkg.amount);
  const popImageUrl = `/uploads/${req.file.filename}`;

  try {
    const result = await pool.query(
      `INSERT INTO investments (user_id, package_name, amount, daily_profit, total_profit, pop_image_url, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')
       RETURNING *`,
      [req.user.id, pkg.name, pkg.amount, dailyProfit, totalProfit, popImageUrl]
    );

    // Create a transaction record
    await pool.query(
      `INSERT INTO transactions (user_id, investment_id, type, amount, status, description)
       VALUES ($1, $2, 'investment', $3, 'pending', $4)`,
      [req.user.id, result.rows[0].id, pkg.amount, `Investment in ${pkg.name} package`]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Investment error:', err);
    res.status(500).json({ error: 'Failed to create investment' });
  }
});

// GET /api/investments - list user's investments
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM investments WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get investments error:', err);
    res.status(500).json({ error: 'Failed to fetch investments' });
  }
});

// GET /api/investments/:id - get single investment
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM investments WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Investment not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch investment' });
  }
});

// Internal helper: process referral commissions when investment is approved
const processReferralCommissions = async (client, investorId, investmentId, investmentAmount) => {
  // Find L1 referrer
  const l1Result = await client.query(
    'SELECT id FROM users WHERE id = (SELECT referred_by FROM users WHERE id = $1)',
    [investorId]
  );
  if (l1Result.rows.length === 0) return;

  const l1Id = l1Result.rows[0].id;
  const l1Amount = parseFloat((investmentAmount * REFERRAL_RATES[1]).toFixed(2));

  await client.query(
    `INSERT INTO referral_commissions (beneficiary_id, source_user_id, investment_id, level, rate, amount)
     VALUES ($1, $2, $3, 1, $4, $5)`,
    [l1Id, investorId, investmentId, REFERRAL_RATES[1] * 100, l1Amount]
  );
  await client.query(
    'UPDATE users SET balance = balance + $1, total_earned = total_earned + $1 WHERE id = $2',
    [l1Amount, l1Id]
  );
  await client.query(
    `INSERT INTO transactions (user_id, investment_id, type, amount, status, description)
     VALUES ($1, $2, 'referral_bonus', $3, 'approved', 'Level 1 referral commission (12%)')`,
    [l1Id, investmentId, l1Amount]
  );

  // Find L2 referrer
  const l2Result = await client.query(
    'SELECT id FROM users WHERE id = (SELECT referred_by FROM users WHERE id = $1)',
    [l1Id]
  );
  if (l2Result.rows.length === 0) return;

  const l2Id = l2Result.rows[0].id;
  const l2Amount = parseFloat((investmentAmount * REFERRAL_RATES[2]).toFixed(2));

  await client.query(
    `INSERT INTO referral_commissions (beneficiary_id, source_user_id, investment_id, level, rate, amount)
     VALUES ($1, $2, $3, 2, $4, $5)`,
    [l2Id, investorId, investmentId, REFERRAL_RATES[2] * 100, l2Amount]
  );
  await client.query(
    'UPDATE users SET balance = balance + $1, total_earned = total_earned + $1 WHERE id = $2',
    [l2Amount, l2Id]
  );
  await client.query(
    `INSERT INTO transactions (user_id, investment_id, type, amount, status, description)
     VALUES ($1, $2, 'referral_bonus', $3, 'approved', 'Level 2 referral commission (5%)')`,
    [l2Id, investmentId, l2Amount]
  );

  // Find L3 referrer
  const l3Result = await client.query(
    'SELECT id FROM users WHERE id = (SELECT referred_by FROM users WHERE id = $1)',
    [l2Id]
  );
  if (l3Result.rows.length === 0) return;

  const l3Id = l3Result.rows[0].id;
  const l3Amount = parseFloat((investmentAmount * REFERRAL_RATES[3]).toFixed(2));

  await client.query(
    `INSERT INTO referral_commissions (beneficiary_id, source_user_id, investment_id, level, rate, amount)
     VALUES ($1, $2, $3, 3, $4, $5)`,
    [l3Id, investorId, investmentId, REFERRAL_RATES[3] * 100, l3Amount]
  );
  await client.query(
    'UPDATE users SET balance = balance + $1, total_earned = total_earned + $1 WHERE id = $2',
    [l3Amount, l3Id]
  );
  await client.query(
    `INSERT INTO transactions (user_id, investment_id, type, amount, status, description)
     VALUES ($1, $2, 'referral_bonus', $3, 'approved', 'Level 3 referral commission (1%)')`,
    [l3Id, investmentId, l3Amount]
  );
};

module.exports = { router, processReferralCommissions };
