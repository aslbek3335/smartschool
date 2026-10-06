const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// Tokenni tekshirish
const authenticate = async (req, res, next) => {
  try {
    console.log("Qabul qilingan header:", req.headers.authorization);

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Token topilmadi. Iltimos tizimga kiring.' });
    }

    const token = authHeader.split(' ')[1];
    if (!token || token === 'null' || token === 'undefined' || token === 'demo_token') {
      return res.status(401).json({ success: false, message: 'Token yaroqsiz. Iltimos qaytadan kiring.' });
    }

    const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (jwtErr) {
      console.error("JWT verify xatosi:", jwtErr.message);
      return res.status(401).json({ success: false, message: 'Token yaroqsiz yoki muddati o\'tgan.' });
    }

    const result = await pool.query(
      'SELECT id, full_name, email, role, avatar_url, class_name, class_id, subject, is_active FROM users WHERE id = $1',
      [decoded.id]
    );

    if (!result.rows.length || !result.rows[0].is_active) {
      return res.status(401).json({ success: false, message: 'Foydalanuvchi topilmadi yoki bloklangan.' });
    }

    req.user = result.rows[0];
    next();
  } catch (err) {
    console.error("Auth middleware server xatosi:", err);
    return res.status(500).json({ success: false, message: 'Autentifikatsiya server xatosi.' });
  }
};

// Rol tekshirish
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Bu amalni bajarish uchun ruxsat yo\'q.' });
  }
  next();
};

module.exports = { authenticate, authorize };
