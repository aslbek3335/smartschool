const pool = require('../config/db');

// ──────────────────────────────────────────
// POST /api/grades (yoki /api/teacher/grades) - Baho qo'yish
// ──────────────────────────────────────────
exports.submitGrade = async (req, res) => {
  try {
    const { student_id, subject_id, score, grade_type, comment } = req.body;
    const teacherId = req.user.id;

    if (!student_id || !subject_id || score === undefined) {
      return res.status(400).json({
        success: false,
        message: "O'quvchi, fan va baho kiritilishi shart."
      });
    }

    const numScore = parseInt(score);
    if (isNaN(numScore) || numScore < 0 || numScore > 100) {
      return res.status(400).json({
        success: false,
        message: "Baho 0 dan 100 gacha bo'lishi kerak."
      });
    }

    // O'quvchi mavjudligini tekshirish
    const studentCheck = await pool.query(
      `SELECT u.id, u.full_name, u.class_name
       FROM users u
       WHERE u.id = $1 AND u.role = 'student'`,
      [student_id]
    );
    if (!studentCheck.rows.length) {
      return res.status(404).json({ success: false, message: "O'quvchi topilmadi." });
    }
    const student = studentCheck.rows[0];

    // O'qituvchi bo'lsa: o'quvchining sinfiga va fanga dars berishini qat'iy tekshirish
    if (req.user.role === 'teacher') {
      const permCheck = await pool.query(
        `SELECT c.id, c.name FROM classes c
         WHERE (
           LOWER(c.name) = LOWER($1)
           OR LOWER(c.name) = LOWER(REPLACE($1, '-A', ' sinf'))
           OR LOWER(c.name) = LOWER(REPLACE($1, '-A', '-sinf'))
           OR LOWER($1) LIKE LOWER(c.name || '%')
         )
         AND (
           c.id IN (SELECT class_id FROM teacher_classes WHERE teacher_id = $2)
           OR c.id IN (SELECT class_id FROM class_subject_teachers WHERE teacher_id = $2)
           OR c.id IN (SELECT class_id FROM schedules WHERE teacher_id = $2)
         )`,
        [student.class_name || '', teacherId]
      );

      if (permCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: "Ruxsat berilmadi: Siz bu o'quvchining sinfiga dars bermaysiz va uni baholay olmaysiz!"
        });
      }

      // Fan bo'yicha dars berishini tekshirish
      const subjectCheck = await pool.query(
        `SELECT 1 FROM subjects s
         WHERE s.id = $1 AND (
           s.teacher_id = $2
           OR s.id IN (SELECT subject_id FROM class_subject_teachers WHERE teacher_id = $2)
           OR s.id IN (SELECT subject_id FROM teacher_subjects WHERE teacher_id = $2)
           OR s.id IN (SELECT subject_id FROM teacher_classes WHERE teacher_id = $2 AND subject_id IS NOT NULL)
           OR s.id IN (SELECT subject_id FROM schedules WHERE teacher_id = $2)
         )`,
        [subject_id, teacherId]
      );

      if (subjectCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: "Ruxsat berilmadi: Sizga ushbu fan bo'yicha baholash huquqi biriktirilmagan!"
        });
      }
    }

    const type = grade_type || 'faollik';

    const insertResult = await pool.query(
      `INSERT INTO grades (student_id, teacher_id, subject_id, score, grade_type, comment)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, student_id, teacher_id, subject_id, score, grade_type, comment, created_at`,
      [student_id, teacherId, subject_id, numScore, type, comment || null]
    );

    // Baholangan ma'lumotni to'liq nomlari bilan qaytarish
    const fullGrade = await pool.query(
      `SELECT g.id, g.score, g.grade_type, g.comment, g.created_at,
              u.full_name as student_name,
              t.full_name as teacher_name,
              s.name as subject_name
       FROM grades g
       JOIN users u ON g.student_id = u.id
       JOIN users t ON g.teacher_id = t.id
       JOIN subjects s ON g.subject_id = s.id
       WHERE g.id = $1`,
      [insertResult.rows[0].id]
    );

    res.status(201).json({
      success: true,
      message: "Baho muvaffaqiyatli qo'yildi!",
      grade: fullGrade.rows[0]
    });
  } catch (err) {
    console.error('submitGrade error:', err);
    res.status(500).json({ success: false, message: 'Server xatosi: Bahoni saqlashda xatolik.' });
  }
};

// ──────────────────────────────────────────
// GET /api/student/grades - O'quvchining shaxsiy baholari
// ──────────────────────────────────────────
exports.getStudentGrades = async (req, res) => {
  try {
    const studentId = req.user.id;

    const result = await pool.query(
      `SELECT 
         g.id,
         g.score,
         g.grade_type,
         g.comment,
         g.created_at AS grade_date,
         s.id AS subject_id,
         s.name AS subject_name,
         COALESCE(s.icon, '📚') AS subject_icon,
         t.id AS teacher_id,
         t.full_name AS teacher_name
       FROM grades g
       JOIN subjects s ON g.subject_id = s.id
       JOIN users t ON g.teacher_id = t.id
       WHERE g.student_id = $1
       ORDER BY g.created_at DESC`,
      [studentId]
    );

    // O'rtacha baholarni ham hisoblash
    const avgQuery = await pool.query(
      `SELECT s.id as subject_id, s.name as subject_name, COALESCE(s.icon, '📚') as icon,
              ROUND(AVG(g.score), 1) as avg_score,
              COUNT(g.id) as total
       FROM grades g
       JOIN subjects s ON g.subject_id = s.id
       WHERE g.student_id = $1
       GROUP BY s.id, s.name, s.icon
       ORDER BY s.name ASC`,
      [studentId]
    );

    res.json({
      success: true,
      count: result.rows.length,
      grades: result.rows,
      averages: avgQuery.rows
    });
  } catch (err) {
    console.error('getStudentGrades error:', err);
    res.status(500).json({ success: false, message: 'Server xatosi: Baholarni olishda xatolik.' });
  }
};

// ──────────────────────────────────────────
// GET /api/teacher/classes - O'qituvchi dars beradigan sinflar
// ──────────────────────────────────────────
exports.getTeacherClasses = async (req, res) => {
  try {
    const user = req.user;
    let targetTeacherId = user.id;

    // Admin bo'lsa va teacher_id so'rovda ko'rsatilgan bo'lsa
    if (user.role === 'admin' && req.query.teacher_id) {
      targetTeacherId = parseInt(req.query.teacher_id);
    } else if (user.role === 'admin' && !req.query.teacher_id) {
      // Admin uchun barcha sinflar
      const allCls = await pool.query('SELECT id, name, grade_level FROM classes ORDER BY grade_level ASC, name ASC');
      return res.json({
        success: true,
        count: allCls.rows.length,
        classes: allCls.rows
      });
    }

    // O'qituvchi uchun: FAQAT o'sha teacher_id biriktirilgan sinflar!
    const result = await pool.query(
      `SELECT DISTINCT c.id, c.name, c.grade_level
       FROM classes c
       WHERE c.id IN (
         SELECT class_id FROM teacher_classes WHERE teacher_id = $1
         UNION
         SELECT class_id FROM class_subject_teachers WHERE teacher_id = $1
         UNION
         SELECT class_id FROM schedules WHERE teacher_id = $1
       )
       ORDER BY c.grade_level ASC, c.name ASC`,
      [targetTeacherId]
    );

    // O'qituvchiga sinf biriktirilmagan bo'lsa, qat'iy ravishda bo'sh ro'yxat [] qaytariladi
    res.json({
      success: true,
      count: result.rows.length,
      classes: result.rows
    });
  } catch (err) {
    console.error('getTeacherClasses error:', err);
    res.status(500).json({ success: false, message: 'O\'qituvchi sinflarini yuklashda xatolik.' });
  }
};

// ──────────────────────────────────────────
// GET /api/teacher/students?class_id=... - Sinf o'quvchilari ro'yxati
// ──────────────────────────────────────────
exports.getTeacherStudents = async (req, res) => {
  try {
    const { class_id } = req.query;
    const user = req.user;

    if (!class_id) {
      return res.status(400).json({ success: false, message: "class_id ko'rsatilishi shart." });
    }

    const classIdNum = parseInt(class_id);

    // Sinf nomini olish
    const classRes = await pool.query('SELECT id, name FROM classes WHERE id = $1', [classIdNum]);
    if (!classRes.rows.length) {
      return res.status(404).json({ success: false, message: 'Sinf topilmadi.' });
    }
    const className = classRes.rows[0].name;

    // O'qituvchi ushbu sinfga dars berishini qat'iy tekshirish
    if (user.role === 'teacher') {
      const authCheck = await pool.query(
        `SELECT 1 FROM classes c
         WHERE c.id = $1 AND (
           c.id IN (SELECT class_id FROM teacher_classes WHERE teacher_id = $2)
           OR c.id IN (SELECT class_id FROM class_subject_teachers WHERE teacher_id = $2)
           OR c.id IN (SELECT class_id FROM schedules WHERE teacher_id = $2)
         )`,
        [classIdNum, user.id]
      );

      if (authCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: "Ruxsat etilmagan: Siz bu sinfga dars bermaysiz va uning o'quvchilarini ko'ra olmaysiz!"
        });
      }
    }

    // Shu sinfdagi barcha o'quvchilarni olish
    const studentsRes = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.avatar_url, u.class_name,
              COUNT(g.id) as total_grades,
              ROUND(AVG(g.score), 1) as avg_score
       FROM users u
       LEFT JOIN grades g ON g.student_id = u.id
       WHERE u.role = 'student'
         AND (
           LOWER(u.class_name) = LOWER($1)
           OR LOWER(u.class_name) = LOWER(REPLACE($1, '-A', ' sinf'))
           OR LOWER(u.class_name) = LOWER(REPLACE($1, '-A', '-sinf'))
           OR LOWER(u.class_name) LIKE LOWER($1 || '%')
         )
       GROUP BY u.id, u.full_name, u.email, u.avatar_url, u.class_name
       ORDER BY u.full_name ASC`,
      [className]
    );

    res.json({
      success: true,
      class_id: classIdNum,
      class_name: className,
      count: studentsRes.rows.length,
      students: studentsRes.rows
    });
  } catch (err) {
    console.error('getTeacherStudents error:', err);
    res.status(500).json({ success: false, message: 'O\'quvchilarni yuklashda server xatosi.' });
  }
};

// ──────────────────────────────────────────
// GET /api/grades - Umumiy baholar (Frontend loadGrades uchun)
// ──────────────────────────────────────────
exports.getGrades = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    const { subject_id, class_id } = req.query;

    let where = 'WHERE 1=1';
    const params = [];

    if (role === 'student') {
      params.push(userId);
      where += ` AND g.student_id = $${params.length}`;
    } else if (role === 'teacher') {
      params.push(userId);
      where += ` AND g.teacher_id = $${params.length}`;
    }

    if (subject_id) {
      params.push(subject_id);
      where += ` AND g.subject_id = $${params.length}`;
    }

    const result = await pool.query(
      `SELECT g.id, g.score, g.grade_type, g.comment, g.created_at as grade_date,
              u.full_name as student_name, u.class_name as student_class,
              s.name as subject_name, COALESCE(s.icon, '📚') as subject_icon,
              t.full_name as teacher_name
       FROM grades g
       JOIN users u ON g.student_id = u.id
       JOIN subjects s ON g.subject_id = s.id
       JOIN users t ON g.teacher_id = t.id
       ${where}
       ORDER BY g.created_at DESC
       LIMIT 100`,
      params
    );

    let avgWhere = role === 'student' ? 'WHERE g.student_id = $1' : (role === 'teacher' ? 'WHERE g.teacher_id = $1' : '');
    let avgParams = (role === 'student' || role === 'teacher') ? [userId] : [];

    const avgQuery = await pool.query(
      `SELECT s.id as subject_id, s.name as subject_name, COALESCE(s.icon, '📚') as icon,
              ROUND(AVG(g.score), 1) as avg_score,
              COUNT(g.id) as total
       FROM grades g
       JOIN subjects s ON g.subject_id = s.id
       ${avgWhere}
       GROUP BY s.id, s.name, s.icon
       ORDER BY s.name ASC`,
      avgParams
    );

    res.json({
      success: true,
      count: result.rows.length,
      grades: result.rows,
      averages: avgQuery.rows
    });
  } catch (err) {
    console.error('getGrades error:', err);
    res.status(500).json({ success: false, message: 'Server xatosi: Baholarni olishda xatolik.' });
  }
};
