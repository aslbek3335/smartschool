const pool       = require('../config/db');
const { cloudinary } = require('../config/cloudinary');

// ──────────────────────────────────────────
// GET /api/profile/:id
// ──────────────────────────────────────────
exports.getProfile = async (req, res) => {
  try {
    const userId = req.params.id || req.user.id;
    const result = await pool.query(
      `SELECT id, full_name, email, role, avatar_url, class_name, subject, bio, phone, created_at
       FROM users WHERE id = $1`,
      [userId]
    );
    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Foydalanuvchi topilmadi.' });
    }

    // Statistika
    let stats = {};
    const user = result.rows[0];

    // Umumiy maktab statistikasi
    const [lessonsCount, videosCount, tasksCount, quizzesCount] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM lessons'),
      pool.query('SELECT COUNT(*) FROM videos'),
      pool.query('SELECT COUNT(*) FROM tasks'),
      pool.query('SELECT COUNT(*) FROM quizzes'),
    ]);

    const total_lessons = parseInt(lessonsCount.rows[0]?.count) || 0;
    const total_videos  = parseInt(videosCount.rows[0]?.count) || 0;
    const total_tasks   = parseInt(tasksCount.rows[0]?.count) || 0;
    const total_quizzes = parseInt(quizzesCount.rows[0]?.count) || 0;

    stats = {
      total_lessons,
      total_videos,
      total_tasks,
      total_quizzes,
    };

    if (user.role === 'student') {
      const [lessons, videos, tasks, quizzes] = await Promise.all([
        pool.query('SELECT COUNT(*) FROM lesson_progress WHERE student_id=$1 AND is_done=TRUE', [userId]),
        pool.query('SELECT COUNT(*) FROM video_views    WHERE student_id=$1 AND is_done=TRUE', [userId]),
        pool.query('SELECT COUNT(*) FROM task_submissions WHERE student_id=$1',                [userId]),
        pool.query('SELECT COUNT(*) FROM quiz_attempts    WHERE student_id=$1',                [userId]),
      ]);
      stats.lessons_done = parseInt(lessons.rows[0]?.count) || 0;
      stats.videos_done  = parseInt(videos.rows[0]?.count) || 0;
      stats.tasks_done   = parseInt(tasks.rows[0]?.count) || 0;
      stats.quizzes_done = parseInt(quizzes.rows[0]?.count) || 0;
    } else if (user.role === 'teacher') {
      const [lessons, videos, tasks, quizzes] = await Promise.all([
        pool.query('SELECT COUNT(*) FROM lessons WHERE teacher_id=$1', [userId]),
        pool.query('SELECT COUNT(*) FROM videos  WHERE teacher_id=$1', [userId]),
        pool.query('SELECT COUNT(*) FROM tasks   WHERE teacher_id=$1', [userId]),
        pool.query('SELECT COUNT(*) FROM quizzes WHERE teacher_id=$1', [userId]),
      ]);
      stats.lessons_created = parseInt(lessons.rows[0]?.count) || 0;
      stats.videos_created  = parseInt(videos.rows[0]?.count) || 0;
      stats.tasks_created   = parseInt(tasks.rows[0]?.count) || 0;
      stats.quizzes_created = parseInt(quizzes.rows[0]?.count) || 0;
    } else if (user.role === 'admin') {
      stats.lessons_created = total_lessons;
      stats.videos_created  = total_videos;
      stats.tasks_created   = total_tasks;
      stats.quizzes_created = total_quizzes;
    }

    res.json({ success: true, user, stats });
  } catch (err) {
    console.error('getProfile xato:', err);
    res.status(500).json({ success: false, message: 'Server xatosi.' });
  }
};

// ──────────────────────────────────────────
// PUT /api/profile/update
// ──────────────────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    const { full_name, bio, phone, class_name, subject } = req.body;
    const userId = req.user.id;

    // Faqat admin class_name va subject ni o'zgartira oladi
    const updateClassName = req.user.role === 'admin' ? class_name : undefined;
    const updateSubject   = req.user.role === 'admin' ? subject   : undefined;

    const result = await pool.query(
      `UPDATE users
       SET full_name  = COALESCE($1, full_name),
           bio        = COALESCE($2, bio),
           phone      = COALESCE($3, phone),
           class_name = COALESCE($4, class_name),
           subject    = COALESCE($5, subject)
       WHERE id = $6
       RETURNING id, full_name, email, role, avatar_url, class_name, subject, bio, phone`,
      [full_name, bio, phone, updateClassName, updateSubject, userId]
    );

    res.json({ success: true, message: 'Profil yangilandi!', user: result.rows[0] });
  } catch (err) {
    console.error('updateProfile xato:', err);
    res.status(500).json({ success: false, message: 'Server xatosi.' });
  }
};

// ──────────────────────────────────────────
// POST /api/profile/avatar
// (multer uploadAvatar middleware bilan)
// ──────────────────────────────────────────
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Rasm tanlanmadi.' });
    }

    const userId = req.user.id;

    // Convert disk path to web-accessible URL path (/uploads/filename)
    let avatarUrl = req.file.path;
    if (req.file.filename && !avatarUrl.startsWith('http')) {
      avatarUrl = '/uploads/' + req.file.filename;
    } else if (avatarUrl.includes('uploads')) {
      const filename = avatarUrl.split(/uploads[\\/]/).pop();
      avatarUrl = '/uploads/' + filename;
    }

    // Eski avatarni Cloudinary'dan o'chirish (agar bo'lsa)
    try {
      const oldUser = await pool.query('SELECT avatar_public_id FROM users WHERE id=$1', [userId]);
      if (oldUser.rows[0]?.avatar_public_id && cloudinary.uploader) {
        await cloudinary.uploader.destroy(oldUser.rows[0].avatar_public_id);
      }
    } catch (cErr) {
      // Cloudinary key o'rnatilmagan bo'lsa lokal saqlanadi
    }

    const result = await pool.query(
      `UPDATE users
       SET avatar_url = $1, avatar_public_id = $2
       WHERE id = $3
       RETURNING id, full_name, email, role, avatar_url, class_name, subject, bio, phone`,
      [avatarUrl, req.file.filename || null, userId]
    );

    res.json({ success: true, message: 'Avatar bazada muvaffaqiyatli saqlandi!', user: result.rows[0] });
  } catch (err) {
    console.error('uploadAvatar xato:', err);
    res.status(500).json({ success: false, message: 'Server xatosi: Avatarni saqlab bo\'lmadi.' });
  }
};

// ──────────────────────────────────────────
// PUT /api/profile/change-password
// ──────────────────────────────────────────
exports.changePassword = async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const { old_password, new_password } = req.body;
    if (!old_password || !new_password) {
      return res.status(400).json({ success: false, message: 'Eski va yangi parolni kiriting.' });
    }
    if (new_password.length < 6) {
      return res.status(400).json({ success: false, message: 'Yangi parol kamida 6 ta belgi.' });
    }

    const user = await pool.query('SELECT password_hash FROM users WHERE id=$1', [req.user.id]);
    const ok   = await bcrypt.compare(old_password, user.rows[0].password_hash);
    if (!ok) {
      return res.status(400).json({ success: false, message: 'Eski parol noto\'g\'ri.' });
    }

    const hash = await bcrypt.hash(new_password, 12);
    await pool.query('UPDATE users SET password_hash=$1 WHERE id=$2', [hash, req.user.id]);

    res.json({ success: true, message: 'Parol muvaffaqiyatli o\'zgartirildi!' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server xatosi.' });
  }
};
