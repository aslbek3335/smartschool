const pool    = require('../config/db');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';

// Token generatsiya
const signToken = (id) =>
  jwt.sign({ id }, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// ──────────────────────────────────────────
// POST /api/auth/register
// ──────────────────────────────────────────
exports.register = async (req, res) => {
  return res.status(403).json({
    success: false,
    message: "Ommaviy ro'yxatdan o'tish yopilgan. Foydalanuvchilar faqat Admin tomonidan yaratiladi."
  });
};

// ──────────────────────────────────────────
// POST /api/auth/login
// ──────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email va parol kiritish shart.' });
    }

    const result = await pool.query(
      'SELECT * FROM users WHERE (email = $1 OR username = $1) AND is_active = TRUE',
      [email]
    );
    if (!result.rows.length) {
      return res.status(401).json({ success: false, message: 'Email/login yoki parol noto\'g\'ri.' });
    }

    const user    = result.rows[0];
    const userHash = user.password_hash || user.password;
    const isMatch = userHash ? await bcrypt.compare(password, userHash) : false;
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Email yoki parol noto\'g\'ri.' });
    }

    const token = signToken(user.id);
    const { password_hash, ...safeUser } = user;

    res.json({ success: true, message: 'Muvaffaqiyatli kirdingiz!', token, user: safeUser });
  } catch (err) {
    console.error('Login xato:', err);
    res.status(500).json({ success: false, message: 'Server xatosi.' });
  }
};

// ──────────────────────────────────────────
// GET /api/auth/me   (token bilan)
// ──────────────────────────────────────────
exports.getMe = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, full_name, email, role, avatar_url, class_name, subject, bio, phone, created_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );
    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server xatosi.' });
  }
};
