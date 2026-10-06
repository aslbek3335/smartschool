const express = require('express');
const cors    = require('cors');
const path    = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();

// ── Middleware ──
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Routes ──
app.use('/api/auth',              require('./routes/auth'));
app.use('/api/profile',           require('./routes/profile'));
app.use('/api/subjects',          require('./routes/subjects'));
app.use('/api/lessons',           require('./routes/lessons'));
app.use('/api/videos',            require('./routes/videos'));
app.use('/api/video-lessons',     require('./routes/videos'));
app.use('/api/quizzes',           require('./routes/quizzes'));
app.use('/api/tasks',             require('./routes/tasks'));
app.use('/api/admin',             require('./routes/admin'));
app.use('/api/admin/allocations', require('./routes/allocations'));
app.use('/api/attendance',        require('./routes/attendance'));
app.use('/api/news',              require('./routes/news'));
app.use('/api/schedules',         require('./routes/schedules'));
app.use('/api/classes',           require('./routes/classes'));
app.use('/api/student',           require('./routes/student'));
app.use('/api/teacher',           require('./routes/teacher'));
app.use('/api/grades',            require('./routes/grades'));
app.use('/api/chat',              require('./routes/chat'));
app.use('/api/public',            require('./routes/public'));

// ── Health check & Root ──
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'SmartSchool Backend API ishlamoqda. Sayt interfeysiga kirish uchun http://localhost:3000 ga oling.',
    frontend_url: 'http://localhost:3000',
    health_check: '/api/health'
  });
});

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'SmartSchool API ishlayapti ✅', time: new Date() });
});

// ── 404 handler ──
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Endpoint topilmadi: ${req.method} ${req.url}` });
});

// ── Global error handler ──
app.use((err, req, res, next) => {
  console.error('Global xato:', err);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: 'Fayl hajmi juda katta.' });
  }
  res.status(500).json({ success: false, message: 'Kutilmagan server xatosi.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════════════════╗
  ║   🎓 SmartSchool Backend API           ║
  ║   Server: http://localhost:${PORT}       ║
  ║   ENV:    ${process.env.NODE_ENV || 'development'}                  ║
  ╚════════════════════════════════════════╝
  `);
});
