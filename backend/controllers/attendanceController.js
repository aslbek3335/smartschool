const pool = require('../config/db');

function getGradeNumber(rawName) {
  if (!rawName) return '';
  return rawName.replace(/[^0-9]/g, '');
}

// ──────────────────────────────────────────
// GET /api/attendance/classes & /api/teacher/attendance-classes
// Faqatgina dars jadvali yoki teacher_classes orqali joriy o'qituvchiga biriktirilgan sinflar
// ──────────────────────────────────────────
exports.getTeacherClasses = async (req, res) => {
  try {
    const teacherId = req.user.id;

    const result = await pool.query(
      `SELECT DISTINCT c.id, c.name, c.grade_level
       FROM classes c
       INNER JOIN schedules s ON c.id = s.class_id
       WHERE s.teacher_id = $1
       UNION
       SELECT DISTINCT c.id, c.name, c.grade_level
       FROM classes c
       INNER JOIN teacher_classes tc ON c.id = tc.class_id
       WHERE tc.teacher_id = $1
       ORDER BY grade_level ASC, name ASC`,
      [teacherId]
    );

    res.json({ success: true, classes: result.rows });
  } catch (err) {
    console.error('getTeacherClasses error:', err);
    res.status(500).json({ success: false, message: 'Server xatosi: Sinflarni yuklab bo\'lmadi.' });
  }
};

// ──────────────────────────────────────────
// GET /api/attendance (Teacher/Admin)
// ──────────────────────────────────────────
exports.getAttendance = async (req, res) => {
  try {
    const user = req.user;
    const { class_name, date } = req.query;
    const reqDate = date || new Date().toISOString().split('T')[0];

    // Default class_name for teacher if not specified
    let targetClass = class_name;
    if (!targetClass && user.role === 'teacher') {
      targetClass = user.class_name || '1-sinf';
    }

    if (!targetClass) {
      return res.status(400).json({ success: false, message: 'Sinf nomini ko\'rsating.' });
    }

    const gradeNum = getGradeNumber(targetClass);

    // 2. O'qituvchiga faqat o'z o'quvchilarini va sinflarini ko'rsatish
    if (user.role === 'teacher') {
      const allowedRes = await pool.query(`
        SELECT DISTINCT c.id, c.name
        FROM classes c
        LEFT JOIN class_subject_teachers cst ON cst.class_id = c.id
        WHERE c.primary_teacher_id = $1
           OR c.class_leader_id = $1
           OR c.pe_teacher_id = $1
           OR cst.teacher_id = $1
           OR LOWER(c.name) = (SELECT LOWER(class_name) FROM users WHERE id = $1)
           OR LOWER(c.name) = LOWER($2)
           OR (REGEXP_REPLACE(c.name, '[^0-9]', '', 'g') = $3 AND $3 != '')
      `, [user.id, targetClass.trim(), gradeNum]);

      const isTeacherOwnClass = user.class_name && (
        user.class_name.toLowerCase().trim() === targetClass.toLowerCase().trim() ||
        (getGradeNumber(user.class_name) === gradeNum && gradeNum !== '')
      );

      if (allowedRes.rows.length === 0 && !isTeacherOwnClass) {
        return res.status(403).json({ success: false, message: 'Siz ushbu sinfga biriktirilmagansiz.' });
      }
    }

    // 1. Fetch all students in exact target class / grade
    const studentsRes = await pool.query(
      `SELECT id, full_name, email, avatar_url, class_name
       FROM users
       WHERE role = 'student' AND (
         LOWER(class_name) = LOWER($1)
         OR (REGEXP_REPLACE(class_name, '[^0-9]', '', 'g') = $2 AND $2 != '')
       )
       ORDER BY full_name ASC`,
      [targetClass.trim(), gradeNum]
    );

    // 2. Fetch existing attendance for the specified date
    const attendanceRes = await pool.query(
      `SELECT student_id, status FROM attendance WHERE date = $1`,
      [reqDate]
    );

    const attMap = {};
    attendanceRes.rows.forEach(r => { attMap[r.student_id] = r.status; });

    const list = studentsRes.rows.map(st => ({
      ...st,
      status: attMap[st.id] || 'unmarked'
    }));

    res.json({
      success: true,
      class_name: targetClass,
      date: reqDate,
      students: list
    });
  } catch (err) {
    console.error('getAttendance error:', err);
    res.status(500).json({ success: false, message: 'Server xatosi.' });
  }
};

// ──────────────────────────────────────────
// POST /api/attendance (Teacher/Admin)
// ──────────────────────────────────────────
exports.saveAttendance = async (req, res) => {
  try {
    const { class_id, class_name, date, records } = req.body;
    const teacherId = req.user.id;
    const reqDate = date || new Date().toISOString().split('T')[0];

    if ((!class_name && !class_id) || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ success: false, message: 'Sinf va davomat ma\'lumotlarini yuboring.' });
    }

    let targetClassName = class_name;
    if (!targetClassName && class_id) {
      const cls = await pool.query('SELECT name FROM classes WHERE id = $1', [class_id]);
      if (cls.rows.length) targetClassName = cls.rows[0].name;
    }
    targetClassName = targetClassName || 'Sinf';

    for (let rec of records) {
      if (rec.student_id && rec.status) {
        let dbStatus = rec.status;
        if (dbStatus === 'Keldi') dbStatus = 'present';
        else if (dbStatus === 'Kelmadi') dbStatus = 'absent';
        else if (dbStatus === 'Sababli') dbStatus = 'excused';

        await pool.query(
          `INSERT INTO attendance (student_id, class_name, date, status, marked_by_teacher_id, updated_at)
           VALUES ($1, $2, $3, $4, $5, NOW())
           ON CONFLICT (student_id, date)
           DO UPDATE SET status = EXCLUDED.status, marked_by_teacher_id = EXCLUDED.marked_by_teacher_id, updated_at = NOW()`,
          [rec.student_id, targetClassName, reqDate, dbStatus, teacherId]
        );
      }
    }

    res.json({
      success: true,
      message: `${reqDate} sana uchun davomat muvaffaqiyatli saqlandi!`
    });
  } catch (err) {
    console.error('saveAttendance error:', err);
    res.status(500).json({ success: false, message: 'Server xatosi: Davomatni saqlab bo\'lmadi.' });
  }
};

// ──────────────────────────────────────────
// 1. GET /api/teacher/attendance-classes
// Faqatgina dars jadvali yoki teacher_classes orqali biriktirilgan sinflar
// ──────────────────────────────────────────
exports.getTeacherAttendanceClasses = async (req, res) => {
  try {
    const teacherId = req.user.id;

    const result = await pool.query(
      `SELECT DISTINCT c.id, c.name, c.grade_level
       FROM classes c
       INNER JOIN schedules s ON c.id = s.class_id
       WHERE s.teacher_id = $1
       UNION
       SELECT DISTINCT c.id, c.name, c.grade_level
       FROM classes c
       INNER JOIN teacher_classes tc ON c.id = tc.class_id
       WHERE tc.teacher_id = $1
       ORDER BY grade_level ASC, name ASC`,
      [teacherId]
    );

    res.json({
      success: true,
      classes: result.rows
    });
  } catch (err) {
    console.error('getTeacherAttendanceClasses error:', err);
    res.status(500).json({ success: false, message: 'Sinflarni yuklashda xatolik yuz berdi.' });
  }
};

// ──────────────────────────────────────────
// 2. GET /api/teacher/attendance-students?class_id=...&date=...
// Sinf o'quvchilari va ularning davomat holati
// ──────────────────────────────────────────
exports.getTeacherAttendanceStudents = async (req, res) => {
  try {
    const { class_id, date } = req.query;
    const reqDate = date || new Date().toISOString().split('T')[0];

    if (!class_id) {
      return res.status(400).json({ success: false, message: "class_id ko'rsatilishi shart." });
    }

    const classRes = await pool.query('SELECT id, name FROM classes WHERE id = $1', [class_id]);
    if (!classRes.rows.length) {
      return res.status(404).json({ success: false, message: 'Sinf topilmadi.' });
    }
    const className = classRes.rows[0].name;

    // Shu sinfga tegishli o'quvchilar
    const studentsRes = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.avatar_url, u.class_name
       FROM users u
       WHERE u.role = 'student'
         AND (
           LOWER(u.class_name) = LOWER($1)
           OR LOWER(u.class_name) = LOWER(REPLACE($1, '-A', ' sinf'))
           OR LOWER(u.class_name) = LOWER(REPLACE($1, '-A', '-sinf'))
           OR LOWER(u.class_name) LIKE LOWER($1 || '%')
         )
       ORDER BY u.full_name ASC`,
      [className]
    );

    // Tanlangan sana bo'yicha davomat holati
    const attRes = await pool.query(
      `SELECT student_id, status FROM attendance WHERE date = $1`,
      [reqDate]
    );

    const attMap = {};
    attRes.rows.forEach(r => {
      let st = r.status;
      if (st === 'present') st = 'Keldi';
      else if (st === 'absent') st = 'Kelmadi';
      else if (st === 'excused') st = 'Sababli';
      attMap[r.student_id] = st;
    });

    const students = studentsRes.rows.map(st => ({
      id: st.id,
      full_name: st.full_name,
      email: st.email,
      avatar_url: st.avatar_url,
      class_name: st.class_name,
      status: attMap[st.id] || 'Keldi' // Default holatda hammasi 'Keldi'
    }));

    res.json({
      success: true,
      class_id: parseInt(class_id),
      class_name: className,
      date: reqDate,
      students
    });
  } catch (err) {
    console.error('getTeacherAttendanceStudents error:', err);
    res.status(500).json({ success: false, message: 'O\'quvchilarni yuklashda xatolik yuz berdi.' });
  }
};

// ──────────────────────────────────────────
// GET /api/attendance/my-class (O'quvchilar uchun)
// ──────────────────────────────────────────
exports.getMyClass = async (req, res) => {
  try {
    const studentId = req.user.id;
    const studentRes = await pool.query('SELECT id, class_name FROM users WHERE id = $1', [studentId]);
    if (!studentRes.rows.length) {
      return res.status(404).json({ success: false, message: 'O\'quvchi topilmadi.' });
    }

    const studentClass = studentRes.rows[0].class_name || '1-sinf';
    const gradeNum = getGradeNumber(studentClass);
    const isPrimaryGrade = (parseInt(gradeNum) >= 1 && parseInt(gradeNum) <= 4);
    const todayDate = new Date().toISOString().split('T')[0];

    // 1. Find Homeroom / Primary Teacher
    let homeroomTeacher = null;

    if (isPrimaryGrade) {
      const primaryTeacherRes = await pool.query(
        `SELECT u.id, u.full_name, u.email, u.avatar_url, u.subject, u.phone
         FROM classes c
         JOIN users u ON c.primary_teacher_id = u.id
         WHERE c.grade_level = $1 OR LOWER(c.name) = LOWER($2)
         LIMIT 1`,
        [parseInt(gradeNum) || 1, studentClass]
      );

      if (primaryTeacherRes.rows.length) {
        homeroomTeacher = primaryTeacherRes.rows[0];
      } else {
        const fallbackRes = await pool.query(
          `SELECT id, full_name, email, avatar_url, subject, phone
           FROM users
           WHERE role = 'teacher' AND (
             LOWER(class_name) = LOWER($1)
             OR (REGEXP_REPLACE(class_name, '[^0-9]', '', 'g') = $2 AND $2 != '')
           ) AND (subject IS NULL OR LOWER(subject) NOT LIKE '%tarix%' AND LOWER(subject) NOT LIKE '%fizika%' AND LOWER(subject) NOT LIKE '%kimyo%')
           LIMIT 1`,
          [studentClass, gradeNum]
        );
        if (fallbackRes.rows.length) {
          homeroomTeacher = fallbackRes.rows[0];
        }
      }
    } else {
      const leaderRes = await pool.query(
        `SELECT u.id, u.full_name, u.email, u.avatar_url, u.subject, u.phone
         FROM classes c
         JOIN users u ON c.class_leader_id = u.id
         WHERE c.grade_level = $1 OR LOWER(c.name) = LOWER($2)
         LIMIT 1`,
        [parseInt(gradeNum) || 5, studentClass]
      );

      if (leaderRes.rows.length) {
        homeroomTeacher = leaderRes.rows[0];
      } else {
        const fallbackRes = await pool.query(
          `SELECT id, full_name, email, avatar_url, subject, phone
           FROM users
           WHERE role = 'teacher' AND (
             LOWER(class_name) = LOWER($1)
             OR (REGEXP_REPLACE(class_name, '[^0-9]', '', 'g') = $2 AND $2 != '')
           )
           LIMIT 1`,
          [studentClass, gradeNum]
        );
        if (fallbackRes.rows.length) {
          homeroomTeacher = fallbackRes.rows[0];
        }
      }
    }

    // 2. Fetch ONLY exact classmates for this grade
    const classmatesRes = await pool.query(
      `SELECT u.id, u.full_name, u.avatar_url, COALESCE(a.status, 'unmarked') as today_status
       FROM users u
       LEFT JOIN attendance a ON u.id = a.student_id AND a.date = $1
       WHERE u.role = 'student' AND (
         LOWER(u.class_name) = LOWER($2)
         OR (REGEXP_REPLACE(u.class_name, '[^0-9]', '', 'g') = $3 AND $3 != '')
       )
       ORDER BY u.full_name ASC`,
      [todayDate, studentClass.trim(), gradeNum]
    );

    res.json({
      success: true,
      class_name: studentClass,
      homeroom_teacher: homeroomTeacher,
      classmates: classmatesRes.rows
    });
  } catch (err) {
    console.error('getMyClass error:', err);
    res.status(500).json({ success: false, message: 'Server xatosi.' });
  }
};
