const pool = require('../config/db');

// ──────────────────────────────────────────
// Helper: O'quvchining sinf ma'lumotlarini aniqlash (class_id, grade_level, name)
// ──────────────────────────────────────────
async function getStudentClassInfo(user) {
  let classId = user.class_id;
  let className = user.class_name ? user.class_name.trim() : null;
  let gradeLevel = null;

  if (classId) {
    const res = await pool.query('SELECT id, name, grade_level, class_type FROM classes WHERE id = $1', [classId]);
    if (res.rows.length) {
      return res.rows[0];
    }
  }

  if (className) {
    const digitMatch = className.replace(/[^0-9]/g, '');
    const num = parseInt(digitMatch) || null;
    const res = await pool.query(
      `SELECT id, name, grade_level, class_type 
       FROM classes 
       WHERE LOWER(name) = LOWER($1) 
          OR LOWER(name) = LOWER(REPLACE($1, 'sinf', '-A'))
          OR LOWER(name) = LOWER(REPLACE($1, '-sinf', '-A'))
          OR (grade_level = $2 AND $2 IS NOT NULL)
       ORDER BY id ASC
       LIMIT 1`,
      [className, num]
    );
    if (res.rows.length) {
      // Userdagi class_id ni ham bazada to'g'rilab qo'yamiz
      if (!classId && user.id) {
        pool.query('UPDATE users SET class_id = $1 WHERE id = $2', [res.rows[0].id, user.id]).catch(() => {});
      }
      return res.rows[0];
    }
    if (num) {
      return { id: num, name: `${num}-sinf`, grade_level: num, class_type: num <= 4 ? 'primary' : 'secondary' };
    }
  }

  return { id: 1, name: '1-sinf', grade_level: 1, class_type: 'primary' };
}

exports.getStudentClassInfo = getStudentClassInfo;

// ──────────────────────────────────────────
// GET /api/student/info
// ──────────────────────────────────────────
exports.getStudentInfo = async (req, res) => {
  try {
    const studentClass = await getStudentClassInfo(req.user);
    res.json({
      success: true,
      student: {
        id: req.user.id,
        full_name: req.user.full_name,
        email: req.user.email,
        class_name: studentClass.name,
        class_id: studentClass.id,
        grade_level: studentClass.grade_level,
        is_primary: studentClass.grade_level <= 4
      }
    });
  } catch (err) {
    console.error('getStudentInfo xato:', err);
    res.status(500).json({ success: false, message: 'Server xatosi.' });
  }
};

// ──────────────────────────────────────────
// GET /api/student/subjects
// O'quvchi sinfiga tegishli fanlar (1-4 sinf uchun faqat boshlang'ich, 5-11 uchun yuqori sinf fanlari)
// ──────────────────────────────────────────
exports.getStudentSubjects = async (req, res) => {
  try {
    const studentClass = await getStudentClassInfo(req.user);
    const gradeLevel = studentClass.grade_level;
    const classId = studentClass.id;
    const isPrimary = gradeLevel <= 4;

    const query = `
      SELECT DISTINCT s.id, s.name, s.description, s.icon, s.color, s.class_name,
             s.is_primary, s.grade_range,
             COALESCE(cst_u.id, s_u.id) AS teacher_id,
             COALESCE(cst_u.full_name, s_u.full_name, 'Biriktirilgan o''qituvchi') AS teacher_name,
             COALESCE(cst_u.avatar_url, s_u.avatar_url) AS teacher_avatar,
             (SELECT COUNT(*) FROM lessons l 
              WHERE l.subject_id = s.id 
                AND l.is_published = TRUE
                AND (l.target_class_id = $1 OR l.class_id = $1 OR l.grade_level = $2 OR (l.target_class_id IS NULL AND l.class_id IS NULL AND l.grade_level IS NULL))
             ) AS lesson_count,
             (SELECT COUNT(*) FROM videos v 
              WHERE v.subject_id = s.id 
                AND v.is_published = TRUE
                AND (v.target_class_id = $1 OR v.class_id = $1 OR v.grade_level = $2 OR (v.target_class_id IS NULL AND v.class_id IS NULL AND v.grade_level IS NULL))
             ) AS video_count
      FROM subjects s
      LEFT JOIN users s_u ON s_u.id = s.teacher_id
      LEFT JOIN class_subject_teachers cst ON (cst.class_id = $1 AND cst.subject_id = s.id)
      LEFT JOIN users cst_u ON cst_u.id = cst.teacher_id
      WHERE (
        s.id IN (SELECT subject_id FROM class_subject_teachers WHERE class_id = $1)
        OR LOWER(s.class_name) = LOWER($3)
        OR (REGEXP_REPLACE(s.class_name, '[^0-9]', '', 'g') = $2::text AND $2::text != '')
        OR s.class_name IS NULL OR s.class_name = ''
      )
      ${isPrimary 
        ? `AND (s.is_primary = TRUE OR s.grade_range IN ('primary', 'both'))
           AND LOWER(s.name) NOT IN ('fizika', 'kimyo', 'biologiya', 'geometriya', 'algebra', 'astronomiya', 'robototexnika', 'geografiya')` 
        : `AND (s.grade_range IN ('secondary', 'both') OR s.is_primary = FALSE)
           AND LOWER(s.name) NOT IN ('o''qish', 'tabiatshunoslik', 'boshlang''ich ta''lim fanlari')`}
      ORDER BY s.name ASC;
    `;

    const result = await pool.query(query, [classId, gradeLevel, studentClass.name]);

    res.json({
      success: true,
      student_class: studentClass.name,
      grade_level: gradeLevel,
      is_primary: isPrimary,
      count: result.rows.length,
      subjects: result.rows
    });
  } catch (err) {
    console.error('getStudentSubjects xato:', err);
    res.status(500).json({ success: false, message: 'Server xatosi: fanlarni yuklab bo\'lmadi.' });
  }
};

// ──────────────────────────────────────────
// GET /api/student/videos
// Faqat o'quvchining sinfiga tegishli va mos videodarslar
// ──────────────────────────────────────────
exports.getStudentVideos = async (req, res) => {
  try {
    const studentClass = await getStudentClassInfo(req.user);
    const gradeLevel = studentClass.grade_level;
    const classId = studentClass.id;
    const isPrimary = gradeLevel <= 4;

    const { subject_id, search, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const params = [req.user.id, classId, gradeLevel];
    let extraWhere = '';

    if (subject_id) {
      params.push(parseInt(subject_id));
      extraWhere += ` AND v.subject_id = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      extraWhere += ` AND (v.title ILIKE $${params.length} OR v.description ILIKE $${params.length})`;
    }

    const query = `
      SELECT v.*, 
             s.name AS subject_name, s.icon AS subject_icon, s.color AS subject_color,
             u.full_name AS teacher_name, u.avatar_url AS teacher_avatar,
             COALESCE(c.name, CONCAT(v.grade_level, '-sinf'), 'Umumiy') AS target_class_name,
             COALESCE(vv.is_done, false) AS is_watched,
             COALESCE(vv.watched_sec, 0) AS watched_sec
      FROM videos v
      JOIN subjects s ON s.id = v.subject_id
      LEFT JOIN users u ON u.id = v.teacher_id
      LEFT JOIN classes c ON (c.id = v.target_class_id OR c.id = v.class_id)
      LEFT JOIN video_views vv ON (vv.video_id = v.id AND vv.student_id = $1)
      WHERE v.is_published = TRUE
        -- 1. Qat'iy sinf filtri (faqat shu sinf yoki daraja uchun):
        AND (
          v.target_class_id = $2
          OR v.class_id = $2
          OR v.grade_level = $3
          OR (v.target_class_id IS NULL AND v.class_id IS NULL AND v.grade_level IS NULL)
        )
        -- 2. Fan darajasi filtri (1-4 sinflarga yuqori sinf fanlari ko'rinmasin):
        ${isPrimary
          ? `AND (s.is_primary = TRUE OR s.grade_range IN ('primary', 'both'))
             AND LOWER(s.name) NOT IN ('fizika', 'kimyo', 'biologiya', 'geometriya', 'algebra', 'astronomiya', 'robototexnika', 'geografiya')`
          : `AND (s.grade_range IN ('secondary', 'both') OR s.is_primary = FALSE)
             AND LOWER(s.name) NOT IN ('o''qish', 'tabiatshunoslik', 'boshlang''ich ta''lim fanlari')`}
        ${extraWhere}
      ORDER BY v.created_at DESC
      LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)};
    `;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      student_class: studentClass.name,
      grade_level: gradeLevel,
      count: result.rows.length,
      videos: result.rows
    });
  } catch (err) {
    console.error('getStudentVideos xato:', err);
    res.status(500).json({ success: false, message: 'Server xatosi: videolarni yuklab bo\'lmadi.' });
  }
};

// ──────────────────────────────────────────
// GET /api/student/lessons
// Faqat o'quvchining sinfiga tegishli va mos matnli/PDF darsliklar
// ──────────────────────────────────────────
exports.getStudentLessons = async (req, res) => {
  try {
    const studentClass = await getStudentClassInfo(req.user);
    const gradeLevel = studentClass.grade_level;
    const classId = studentClass.id;
    const isPrimary = gradeLevel <= 4;

    const { subject_id, search, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const params = [req.user.id, classId, gradeLevel];
    let extraWhere = '';

    if (subject_id) {
      params.push(parseInt(subject_id));
      extraWhere += ` AND l.subject_id = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      extraWhere += ` AND (l.title ILIKE $${params.length} OR l.description ILIKE $${params.length})`;
    }

    const query = `
      SELECT l.*, 
             s.name AS subject_name, s.icon AS subject_icon, s.color AS subject_color,
             u.full_name AS teacher_name, u.avatar_url AS teacher_avatar,
             COALESCE(c.name, CONCAT(l.grade_level, '-sinf'), 'Umumiy') AS target_class_name,
             COALESCE(lp.is_done, false) AS is_completed
      FROM lessons l
      JOIN subjects s ON s.id = l.subject_id
      LEFT JOIN users u ON u.id = l.teacher_id
      LEFT JOIN classes c ON (c.id = l.target_class_id OR c.id = l.class_id)
      LEFT JOIN lesson_progress lp ON (lp.lesson_id = l.id AND lp.student_id = $1)
      WHERE l.is_published = TRUE
        -- 1. Qat'iy sinf filtri:
        AND (
          l.target_class_id = $2
          OR l.class_id = $2
          OR l.grade_level = $3
          OR (l.target_class_id IS NULL AND l.class_id IS NULL AND l.grade_level IS NULL)
        )
        -- 2. Fan darajasi filtri (1-4 sinflarga yuqori sinf fanlari ko'rinmasin):
        ${isPrimary
          ? `AND (s.is_primary = TRUE OR s.grade_range IN ('primary', 'both'))
             AND LOWER(s.name) NOT IN ('fizika', 'kimyo', 'biologiya', 'geometriya', 'algebra', 'astronomiya', 'robototexnika', 'geografiya')`
          : `AND (s.grade_range IN ('secondary', 'both') OR s.is_primary = FALSE)
             AND LOWER(s.name) NOT IN ('o''qish', 'tabiatshunoslik', 'boshlang''ich ta''lim fanlari')`}
        ${extraWhere}
      ORDER BY l.order_num ASC, l.created_at DESC
      LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)};
    `;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      student_class: studentClass.name,
      grade_level: gradeLevel,
      count: result.rows.length,
      lessons: result.rows
    });
  } catch (err) {
    console.error('getStudentLessons xato:', err);
    res.status(500).json({ success: false, message: 'Server xatosi: darsliklarni yuklab bo\'lmadi.' });
  }
};
