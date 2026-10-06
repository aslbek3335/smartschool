const pool           = require('../config/db');
const { cloudinary } = require('../config/cloudinary');
const { getStudentClassInfo } = require('./studentController');

// ──────────────────────────────────────────
// GET /api/lessons?subject_id=&class_name=
// ──────────────────────────────────────────
exports.getLessons = async (req, res) => {
  try {
    const { subject_id, class_name, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const params = [];
    let where = 'WHERE 1=1';

    if (req.user?.role === 'student') {
      where += ' AND l.is_published = TRUE';
      const studentClassInfo = await getStudentClassInfo(req.user);
      const sClassId = studentClassInfo.id;
      const sGrade = studentClassInfo.grade_level;
      const isPrimary = sGrade <= 4;

      params.push(sClassId, sGrade);
      const pClassIdIdx = params.length - 1;
      const pGradeIdx = params.length;

      where += ` AND (
        l.target_class_id = $${pClassIdIdx}
        OR l.class_id = $${pClassIdIdx}
        OR l.grade_level = $${pGradeIdx}
        OR (l.target_class_id IS NULL AND l.class_id IS NULL AND l.grade_level IS NULL)
      )`;

      if (isPrimary) {
        where += ` AND (s.is_primary = TRUE OR s.grade_range IN ('primary', 'both'))
                   AND LOWER(s.name) NOT IN ('fizika', 'kimyo', 'biologiya', 'geometriya', 'algebra', 'astronomiya', 'robototexnika', 'geografiya')`;
      } else {
        where += ` AND (s.grade_range IN ('secondary', 'both') OR s.is_primary = FALSE)
                   AND LOWER(s.name) NOT IN ('o''qish', 'tabiatshunoslik', 'boshlang''ich ta''lim fanlari')`;
      }
    } else if (req.user?.role === 'teacher') {
      params.push(req.user.id);
      where += ` AND (l.teacher_id = $${params.length})`;
    }

    if (subject_id) { params.push(subject_id); where += ` AND l.subject_id = $${params.length}`; }
    if (class_name)  { params.push(class_name);  where += ` AND s.class_name = $${params.length}`; }

    params.push(limit, offset);
    const result = await pool.query(
      `SELECT l.*, s.name AS subject_name, s.icon AS subject_icon,
              u.full_name AS teacher_name, u.avatar_url AS teacher_avatar
       FROM lessons l
       LEFT JOIN subjects s ON s.id = l.subject_id
       LEFT JOIN users    u ON u.id = l.teacher_id
       ${where}
       ORDER BY l.order_num ASC, l.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const countParams = params.slice(0, -2);
    const total = await pool.query(`SELECT COUNT(*) FROM lessons l LEFT JOIN subjects s ON s.id=l.subject_id ${where}`, countParams);

    res.json({ success: true, lessons: result.rows, total: parseInt(total.rows[0].count), page: parseInt(page) });
  } catch (err) {
    console.error('getLessons xato:', err);
    res.status(500).json({ success: false, message: 'Server xatosi.' });
  }
};

// ──────────────────────────────────────────
// GET /api/lessons/:id
// ──────────────────────────────────────────
exports.getLessonById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT l.*, s.name AS subject_name, s.icon AS subject_icon,
              u.full_name AS teacher_name, u.avatar_url AS teacher_avatar
       FROM lessons l
       LEFT JOIN subjects s ON s.id = l.subject_id
       LEFT JOIN users    u ON u.id = l.teacher_id
       WHERE l.id = $1`,
      [id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Dars topilmadi.' });
    }

    // Ko'rishlar sonini oshirish
    await pool.query('UPDATE lessons SET views = views + 1 WHERE id = $1', [id]);

    // O'quvchi progressini tekshirish
    let progress = null;
    if (req.user?.role === 'student') {
      const p = await pool.query(
        'SELECT * FROM lesson_progress WHERE student_id=$1 AND lesson_id=$2',
        [req.user.id, id]
      );
      progress = p.rows[0] || null;
    }

    res.json({ success: true, lesson: result.rows[0], progress });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server xatosi.' });
  }
};

// ──────────────────────────────────────────
// POST /api/lessons   (teacher/admin)
// ──────────────────────────────────────────
exports.createLesson = async (req, res) => {
  try {
    const { title, description, subject_id, content, order_num, file_type, target_class_id, class_id, grade_level } = req.body;
    if (!title || !subject_id) {
      return res.status(400).json({ success: false, message: 'Sarlavha va fan majburiy.' });
    }

    let file_url = null, file_public_id = null;
    if (req.file) {
      const path = require('path');
      file_url       = req.file.path.startsWith('http') ? req.file.path : `/uploads/${path.basename(req.file.path)}`;
      file_public_id = req.file.filename;
    }

    const isPublished = req.body.is_published !== undefined ? req.body.is_published : true;

    // Sinf va darajani aniqlash
    const targetClassIdVal = (target_class_id || class_id) ? parseInt(target_class_id || class_id) : null;
    let gradeLevelVal = grade_level ? parseInt(grade_level) : null;
    if (targetClassIdVal && !gradeLevelVal) {
      const cRes = await pool.query('SELECT grade_level FROM classes WHERE id = $1', [targetClassIdVal]);
      if (cRes.rows.length) {
        gradeLevelVal = cRes.rows[0].grade_level;
      }
    }

    const result = await pool.query(
      `INSERT INTO lessons (title, description, subject_id, teacher_id, content, order_num, file_type, file_url, file_public_id, is_published, target_class_id, class_id, grade_level)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [title, description, subject_id, req.user.id, content, order_num || 0, file_type || 'pdf', file_url, file_public_id, isPublished, targetClassIdVal, targetClassIdVal, gradeLevelVal]
    );

    res.status(201).json({ success: true, message: 'Dars yaratildi!', lesson: result.rows[0] });
  } catch (err) {
    console.error('createLesson xato:', err);
    res.status(500).json({ success: false, message: 'Server xatosi.' });
  }
};

// ──────────────────────────────────────────
// PUT /api/lessons/:id
// ──────────────────────────────────────────
exports.updateLesson = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, content, order_num, is_published, target_class_id, class_id, grade_level } = req.body;

    // Faqat o'z darsi yoki admin
    const check = await pool.query('SELECT teacher_id FROM lessons WHERE id=$1', [id]);
    if (!check.rows.length) return res.status(404).json({ success: false, message: 'Dars topilmadi.' });
    if (req.user.role !== 'admin' && check.rows[0].teacher_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Ruxsat yo\'q.' });
    }

    let file_url = undefined, file_public_id = undefined;
    if (req.file) {
      // Eski faylni o'chirish
      const old = await pool.query('SELECT file_public_id FROM lessons WHERE id=$1', [id]);
      if (old.rows[0]?.file_public_id) {
        await cloudinary.uploader.destroy(old.rows[0].file_public_id, { resource_type: 'raw' });
      }
      file_url       = req.file.path;
      file_public_id = req.file.filename;
    }

    const targetClassIdVal = (target_class_id !== undefined || class_id !== undefined)
      ? (target_class_id || class_id ? parseInt(target_class_id || class_id) : null)
      : undefined;
    let gradeLevelVal = grade_level !== undefined ? (grade_level ? parseInt(grade_level) : null) : undefined;

    if (targetClassIdVal && gradeLevelVal === undefined) {
      const cRes = await pool.query('SELECT grade_level FROM classes WHERE id = $1', [targetClassIdVal]);
      if (cRes.rows.length) {
        gradeLevelVal = cRes.rows[0].grade_level;
      }
    }

    const result = await pool.query(
      `UPDATE lessons SET
        title        = COALESCE($1, title),
        description  = COALESCE($2, description),
        content      = COALESCE($3, content),
        order_num    = COALESCE($4, order_num),
        is_published = COALESCE($5, is_published),
        file_url     = COALESCE($6, file_url),
        file_public_id = COALESCE($7, file_public_id),
        target_class_id = COALESCE($8, target_class_id),
        class_id        = COALESCE($9, class_id),
        grade_level     = COALESCE($10, grade_level)
       WHERE id = $11 RETURNING *`,
      [title, description, content, order_num, is_published, file_url, file_public_id, targetClassIdVal, targetClassIdVal, gradeLevelVal, id]
    );

    res.json({ success: true, message: 'Dars yangilandi!', lesson: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server xatosi.' });
  }
};

// ──────────────────────────────────────────
// DELETE /api/lessons/:id
// ──────────────────────────────────────────
exports.deleteLesson = async (req, res) => {
  try {
    const { id } = req.params;
    const lesson = await pool.query('SELECT * FROM lessons WHERE id=$1', [id]);
    if (!lesson.rows.length) return res.status(404).json({ success: false, message: 'Dars topilmadi.' });
    if (req.user.role !== 'admin' && lesson.rows[0].teacher_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Ruxsat yo\'q.' });
    }
    if (lesson.rows[0].file_public_id) {
      await cloudinary.uploader.destroy(lesson.rows[0].file_public_id, { resource_type: 'raw' });
    }
    await pool.query('DELETE FROM lessons WHERE id=$1', [id]);
    res.json({ success: true, message: 'Dars o\'chirildi.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server xatosi.' });
  }
};

// ──────────────────────────────────────────
// POST /api/lessons/:id/complete  (student)
// ──────────────────────────────────────────
exports.markComplete = async (req, res) => {
  try {
    await pool.query(
      `INSERT INTO lesson_progress (student_id, lesson_id, is_done, done_at)
       VALUES ($1,$2,TRUE,NOW())
       ON CONFLICT (student_id, lesson_id) DO UPDATE SET is_done=TRUE, done_at=NOW()`,
      [req.user.id, req.params.id]
    );
    res.json({ success: true, message: 'Dars bajarildi deb belgilandi!' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server xatosi.' });
  }
};
