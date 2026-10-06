const pool = require('../config/db');

/**
 * GET /api/teacher/my-class
 * Sinf rahbarligi mantiqi:
 * Faqat o'sha o'qituvchi classes jadvalida class_teacher_id (yoki class_leader_id)
 * sifatida ko'rsatilgan bo'lsagina ma'lumot qaytaradi, aks holda has_class: false va class_info: null qaytaradi.
 */
exports.getMyClass = async (req, res) => {
  try {
    const teacherId = req.user.id;

    // 1. O'qituvchi sinf rahbari bo'lgan sinfni qidirish
    const classRes = await pool.query(
      `SELECT c.id, c.name, c.grade_level, c.class_type, c.class_teacher_id, c.class_leader_id, c.primary_teacher_id,
              u.full_name AS class_teacher_name, u.email AS class_teacher_email
       FROM classes c
       LEFT JOIN users u ON u.id = $1
       WHERE c.class_teacher_id = $1 
          OR c.class_leader_id = $1 
          OR (c.primary_teacher_id = $1 AND c.class_type = 'primary')
       LIMIT 1`,
      [teacherId]
    );

    // Agar o'qituvchi hech qaysi sinfga sinf rahbari etib biriktirilmagan bo'lsa:
    if (!classRes.rows.length) {
      return res.json({
        success: true,
        has_class: false,
        class_info: null,
        students: [],
        total: 0,
        active: 0,
        message: "Sizga hozircha sinf rahbari sifatida hech qanday sinf biriktirilmagan."
      });
    }

    const classRow = classRes.rows[0];
    const gradeNum = classRow.grade_level ? String(classRow.grade_level) : '';

    // 2. Ushbu sinfga mansub o'quvchilarni olish
    const studentsRes = await pool.query(
      `SELECT id, full_name, email, role, class_name, is_active, avatar_url, phone, created_at
       FROM users
       WHERE role = 'student' AND (
         LOWER(class_name) = LOWER($1)
         OR class_id = $2
         OR (REGEXP_REPLACE(class_name, '[^0-9]', '', 'g') = $3 AND $3 != '')
       )
       ORDER BY full_name ASC`,
      [classRow.name.trim(), classRow.id, gradeNum]
    );

    const students = studentsRes.rows;
    const activeCount = students.filter(s => s.is_active).length;

    return res.json({
      success: true,
      has_class: true,
      class_info: {
        id: classRow.id,
        name: classRow.name,
        grade_level: classRow.grade_level,
        class_type: classRow.class_type,
        class_teacher_id: classRow.class_teacher_id || classRow.class_leader_id,
        class_teacher_name: classRow.class_teacher_name || req.user.full_name
      },
      students,
      total: students.length,
      active: activeCount
    });
  } catch (err) {
    console.error('teacherController.getMyClass error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server xatosi: Sinf ma\'lumotlarini yuklashda xatolik.'
    });
  }
};
