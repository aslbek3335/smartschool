const pool = require('../config/db');

// ──────────────────────────────────────────
// GET /api/subjects
// ──────────────────────────────────────────
exports.getSubjects = async (req, res) => {
  try {
    const user = req.user;
    const { class_name, all } = req.query;
    const rawType = (req.query.type || req.query.category || '').toLowerCase().trim();

    // Sinif nomi berilgan bo'lsa va type ko'rsatilmagan bo'lsa, sinf darajasiga qarab aniqlash
    let effectiveType = rawType;
    if (!effectiveType && class_name) {
      const num = parseInt(String(class_name).replace(/[^0-9]/g, ''));
      if (num >= 1 && num <= 4) {
        effectiveType = 'primary';
      } else if (num >= 5) {
        effectiveType = 'secondary';
      }
    }

    // 1. PRIMARY yoki SECONDARY parametri bo'lsa (yoki all=true bilan birga so'ralsa)
    if (effectiveType === 'primary' || effectiveType === 'secondary' || effectiveType === 'senior') {
      let filterSql = '';
      if (effectiveType === 'primary') {
        filterSql = `
          WHERE (s.is_primary = TRUE OR s.grade_range IN ('primary', 'both'))
            AND LOWER(s.name) NOT IN ('fizika', 'kimyo', 'biologiya', 'geometriya', 'algebra', 'astronomiya', 'robototexnika', 'geografiya')
        `;
      } else {
        filterSql = `
          WHERE (s.grade_range IN ('secondary', 'both') OR s.is_primary = FALSE)
            AND LOWER(s.name) NOT IN ('o''qish', 'tabiatshunoslik', 'boshlang''ich ta''lim fanlari')
        `;
      }

      const query = `
        SELECT s.*,
               u.full_name AS teacher_name, u.avatar_url AS teacher_avatar,
               (SELECT COUNT(*) FROM lessons l WHERE l.subject_id=s.id AND l.is_published=TRUE) AS lesson_count,
               (SELECT COUNT(*) FROM videos v WHERE v.subject_id=s.id AND v.is_published=TRUE) AS video_count
        FROM subjects s
        LEFT JOIN users u ON u.id = s.teacher_id
        ${filterSql}
        ORDER BY s.name ASC;
      `;
      const result = await pool.query(query);
      return res.json({ success: true, count: result.rows.length, subjects: result.rows });
    }

    // 2. Barcha faol fanlarni qaytarish (Filtrlarsiz)
    if (all === 'true' || rawType === 'all') {
      const allQuery = `
        SELECT s.*,
               u.full_name AS teacher_name, u.avatar_url AS teacher_avatar,
               (SELECT COUNT(*) FROM lessons l WHERE l.subject_id=s.id AND l.is_published=TRUE) AS lesson_count,
               (SELECT COUNT(*) FROM videos v WHERE v.subject_id=s.id AND v.is_published=TRUE) AS video_count
        FROM subjects s
        LEFT JOIN users u ON u.id = s.teacher_id
        ORDER BY s.name ASC;
      `;
      const allResult = await pool.query(allQuery);
      return res.json({ success: true, count: allResult.rows.length, subjects: allResult.rows });
    }

    if (user?.role === 'teacher') {
      const teacherSubject = (user.subject || '').toLowerCase().trim();
      const teacherSubId = user.subject_id;

      const params = [user.id];
      let whereConditions = [
        `s.teacher_id = $1`,
        `s.id IN (SELECT subject_id FROM class_subject_teachers WHERE teacher_id = $1)`,
        `s.id IN (SELECT subject_id FROM teacher_classes WHERE teacher_id = $1 AND subject_id IS NOT NULL)`,
        `s.id IN (SELECT subject_id FROM teacher_subjects WHERE teacher_id = $1)`
      ];
      
      if (teacherSubId) {
        params.push(teacherSubId);
        whereConditions.push(`s.id = $${params.length}`);
      }
      
      if (teacherSubject && !teacherSubject.includes('boshlang')) {
        params.push(teacherSubject);
        whereConditions.push(`LOWER(s.name) = LOWER($${params.length})`);
      }

      const query = `
        SELECT DISTINCT s.id, s.name, s.description, s.icon, s.color, s.class_name, s.teacher_id, s.created_at,
               s.is_primary, s.grade_range,
               u.full_name AS teacher_name, u.avatar_url AS teacher_avatar,
               (SELECT COUNT(*) FROM lessons l WHERE l.subject_id=s.id AND l.is_published=TRUE) AS lesson_count,
               (SELECT COUNT(*) FROM videos v WHERE v.subject_id=s.id AND v.is_published=TRUE) AS video_count
        FROM subjects s
        LEFT JOIN users u ON u.id = s.teacher_id
        WHERE (${whereConditions.join(' OR ')})
        ORDER BY s.name;
      `;

      const result = await pool.query(query, params);
      return res.json({ success: true, count: result.rows.length, subjects: result.rows });
    } 
    
    if (user?.role === 'student') {
      const studentCtrl = require('./studentController');
      return studentCtrl.getStudentSubjects(req, res);
    }

    // ADMIN (va boshqa foydalanuvchilar umumiy so'rovi)
    const params = [];
    let where = 'WHERE 1=1';

    if (class_name) {
      params.push(class_name.trim());
      where += ` AND (
        LOWER(s.class_name) = LOWER($1)
        OR (REGEXP_REPLACE(s.class_name, '[^0-9]', '', 'g') = REGEXP_REPLACE($1, '[^0-9]', '', 'g'))
      )`;
    }

    const query = `
      SELECT s.*,
             u.full_name AS teacher_name, u.avatar_url AS teacher_avatar,
             (SELECT COUNT(*) FROM lessons l WHERE l.subject_id=s.id AND l.is_published=TRUE) AS lesson_count,
             (SELECT COUNT(*) FROM videos v WHERE v.subject_id=s.id AND v.is_published=TRUE) AS video_count
      FROM subjects s
      LEFT JOIN users u ON u.id=s.teacher_id
      ${where}
      ORDER BY s.name;
    `;

    const result = await pool.query(query, params);
    res.json({ success: true, count: result.rows.length, subjects: result.rows });
  } catch (err) {
    console.error('getSubjects error:', err);
    res.status(500).json({ success: false, message: 'Server xatosi.' });
  }
};

// ──────────────────────────────────────────
// GET /api/student/subjects
// ──────────────────────────────────────────
exports.getStudentSubjects = async (req, res) => {
  const studentCtrl = require('./studentController');
  return studentCtrl.getStudentSubjects(req, res);
};

exports.createSubject = async (req, res) => {
  try {
    const { name, description, icon, color, class_name, teacher_id, is_primary, grade_range } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Fan nomi majburiy.' });

    const isPrimaryVal = (is_primary === true || is_primary === 'true');
    const gradeRangeVal = grade_range || (isPrimaryVal ? 'primary' : 'secondary');

    const result = await pool.query(
      `INSERT INTO subjects (name, description, icon, color, class_name, teacher_id, is_primary, grade_range)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [name, description, icon || '📚', color || '#3b82f6', class_name, teacher_id, isPrimaryVal, gradeRangeVal]
    );
    res.status(201).json({ success: true, subject: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server xatosi.' });
  }
};

exports.updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, icon, color, class_name, teacher_id } = req.body;
    const result = await pool.query(
      `UPDATE subjects SET
        name        = COALESCE($1,name),
        description = COALESCE($2,description),
        icon        = COALESCE($3,icon),
        color       = COALESCE($4,color),
        class_name  = COALESCE($5,class_name),
        teacher_id  = COALESCE($6,teacher_id)
       WHERE id=$7 RETURNING *`,
      [name, description, icon, color, class_name, teacher_id, id]
    );
    res.json({ success: true, subject: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server xatosi.' });
  }
};

exports.deleteSubject = async (req, res) => {
  try {
    await pool.query('DELETE FROM subjects WHERE id=$1', [req.params.id]);
    res.json({ success: true, message: 'Fan o\'chirildi.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server xatosi.' });
  }
};

// ──────────────────────────────────────────
// GET /api/teacher/subjects
// O'qituvchiga tegishli barcha fanlarni topib qaytaruvchi SQL JOIN so'rovi
// ──────────────────────────────────────────
exports.getTeacherSubjects = async (req, res) => {
  try {
    const teacherId = req.query.teacher_id || req.user.id;

    const result = await pool.query(
      `SELECT DISTINCT s.id, s.name, s.icon, s.color, s.class_name
       FROM subjects s
       JOIN teacher_subjects ts ON s.id = ts.subject_id
       WHERE ts.teacher_id = $1
       ORDER BY s.name ASC`,
      [teacherId]
    );

    res.json({
      success: true,
      count: result.rows.length,
      subjects: result.rows
    });
  } catch (err) {
    console.error('getTeacherSubjects error:', err);
    res.status(500).json({ success: false, message: 'Server xatosi: Fanlarni yuklab bo\'lmadi.' });
  }
};

