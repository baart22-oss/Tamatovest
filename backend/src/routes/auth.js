const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const pool = require('../db/pool');
const { generateReferralCode } = require('../utils/constants');

const router = express.Router();

// Strict rate limiter for auth endpoints (20 requests per 15 min per IP)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts, please try again later.' },
});

// POST /api/auth/register
router.post('/register', authLimiter, async (req, res) => {
  const { name, email, password, phone, referralCode } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required' });
  }
  try {
    // Check email uniqueness
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Resolve referrer
    let referrerId = null;
    if (referralCode) {
      const ref = await pool.query('SELECT id FROM users WHERE referral_code = $1', [referralCode]);
      if (ref.rows.length > 0) {
        referrerId = ref.rows[0].id;
      }
    }

    const hashed = await bcrypt.hash(password, 12);
    let myCode;
    let attempts = 0;
    do {
      myCode = generateReferralCode();
      const check = await pool.query('SELECT id FROM users WHERE referral_code = $1', [myCode]);
      if (check.rows.length === 0) break;
      attempts++;
    } while (attempts < 10);

    const result = await pool.query(
      `INSERT INTO users (name, email, password, phone, referral_code, referred_by, role)
       VALUES ($1, $2, $3, $4, $5, $6, 'user')
       RETURNING id, name, email, phone, referral_code, role, balance, created_at`,
      [name, email, hashed, phone || null, myCode, referrerId]
    );

    const user = result.rows[0];
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ token, user });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', authLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const user = result.rows[0];
    if (!user.is_active) {
      return res.status(403).json({ error: 'Account disabled' });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    const { password: _pw, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/auth/me
router.get('/me', require('../middleware/auth').auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.phone, u.referral_code, u.referred_by,
              u.role, u.balance, u.total_earned, u.is_active, u.created_at,
              bd.bank_name, bd.account_holder, bd.account_number, bd.branch_code
       FROM users u
       LEFT JOIN banking_details bd ON bd.user_id = u.id
       WHERE u.id = $1`,
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

module.exports = router;
