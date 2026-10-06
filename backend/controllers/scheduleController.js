const pool = require('../config/db');

// ──────────────────────────────────────────
// POST /api/admin/schedules
// ──────────────────────────────────────────
exports.createSchedule = async (req, res) => {
  try {
    const { class_id, teacher_id, subject_id, day_of_week, lesson_number } = req.body;

    // Majburiy maydonlar tekshiruvi
    if (!class_id || !teacher_id || !subject_id || !day_of_week || !lesson_number) {
      return res.status(400).json({
        success: false,
        message: "Barcha maydonlar (sinf, o'qituvchi, fan, kun, dars soati) to'ldirilishi shart."
      });
    }

    const lessonNum = parseInt(lesson_number);
    if (isNaN(lessonNum) || lessonNum < 1 || lessonNum > 7) {
      return res.status(400).json({
        success: false,
        message: "Dars soati 1 dan 7 gacha bo'lishi kerak."
      });
    }

    const validDays = ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
    if (!validDays.includes(day_of_week)) {
      return res.status(400).json({
        success: false,
        message: "Noto'g'ri hafta kuni tanlandi."
      });
    }

    // 0. O'qituvchi ushbu sinfga biriktirilganligini qat'iy tekshirish
    const assignmentCheck = await pool.query(
      `SELECT 1 FROM teacher_classes WHERE teacher_id = $1 AND class_id = $2
       UNION
       SELECT 1 FROM class_subject_teachers WHERE teacher_id = $1 AND class_id = $2`,
      [teacher_id, class_id]
    );

    if (assignmentCheck.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Xatolik: Tanlangan o'qituvchi ushbu sinfga biriktirilmagan! Dars jadvaliga kiritishdan oldin o'qituvchini sinfga biriktiring."
      });
    }

    // 1. Conflict Prevention: Sinf bandligini tekshirish
    const classConflict = await pool.query(
      `SELECT s.id, sub.name as subject_name, u.full_name as teacher_name
       FROM schedules s
       JOIN subjects sub ON s.subject_id = sub.id
       JOIN users u ON s.teacher_id = u.id
       WHERE s.class_id = $1 AND s.day_of_week = $2 AND s.lesson_number = $3`,
      [class_id, day_of_week, lessonNum]
    );

    if (classConflict.rows.length > 0) {
      const existing = classConflict.rows[0];
      return res.status(409).json({
        success: false,
        message: `Konflikt: Ushbu sinfda ${day_of_week} kuni ${lessonNum}-soatga allaqachon "${existing.subject_name}" fani (${existing.teacher_name}) qo'yilgan.`
      });
    }

    // 2. Conflict Prevention: O'qituvchi bandligini tekshirish
    const teacherConflict = await pool.query(
      `SELECT s.id, c.name as class_name, sub.name as subject_name
       FROM schedules s
       JOIN classes c ON s.class_id = c.id
       JOIN subjects sub ON s.subject_id = sub.id
       WHERE s.teacher_id = $1 AND s.day_of_week = $2 AND s.lesson_number = $3`,
      [teacher_id, day_of_week, lessonNum]
    );

    if (teacherConflict.rows.length > 0) {
      const existing = teacherConflict.rows[0];
      return res.status(409).json({
        success: false,
        message: `Konflikt: Tanlangan o'qituvchi ${day_of_week} kuni ${lessonNum}-soatda ${existing.class_name} sinfida darsda!`
      });
    }

    // 3. Jadvalga kiritish
    const insertRes = await pool.query(
      `INSERT INTO schedules (class_id, teacher_id, subject_id, day_of_week, lesson_number)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [class_id, teacher_id, subject_id, day_of_week, lessonNum]
    );

    // To'liq ma'lumotlarni qaytarish
    const fullSchedule = await pool.query(
      `SELECT s.id, s.class_id, c.name as class_name,
              s.teacher_id, u.full_name as teacher_name,
              s.subject_id, sub.name as subject_name,
              s.day_of_week, s.lesson_number, s.created_at
       FROM schedules s
       JOIN classes c ON s.class_id = c.id
       JOIN users u ON s.teacher_id = u.id
       JOIN subjects sub ON s.subject_id = sub.id
       WHERE s.id = $1`,
      [insertRes.rows[0].id]
    );

    res.status(201).json({
      success: true,
      message: "Dars jadvali muvaffaqiyatli saqlandi!",
      schedule: fullSchedule.rows[0]
    });
  } catch (err) {
    console.error('createSchedule xatosi:', err);
    res.status(500).json({ success: false, message: 'Server xatosi: Dars jadvalini saqlashda xatolik.' });
  }
};

// ──────────────────────────────────────────
// GET /api/schedules/class/:class_id
// O'quvchilar va sinf uchun haftalik dars jadvali
// ──────────────────────────────────────────
exports.getClassSchedule = async (req, res) => {
  try {
    const { class_id } = req.params;

    const result = await pool.query(
      `SELECT s.id, s.class_id, c.name as class_name,
              s.teacher_id, u.full_name as teacher_name,
              s.subject_id, sub.name as subject_name,
              s.day_of_week, s.lesson_number
       FROM schedules s
       JOIN classes c ON s.class_id = c.id
       JOIN users u ON s.teacher_id = u.id
       JOIN subjects sub ON s.subject_id = sub.id
       WHERE s.class_id = $1
       ORDER BY 
         CASE s.day_of_week
           WHEN 'Dushanba'   THEN 1
           WHEN 'Seshanba'   THEN 2
           WHEN 'Chorshanba' THEN 3
           WHEN 'Payshanba'  THEN 4
           WHEN 'Juma'       THEN 5
           WHEN 'Shanba'     THEN 6
           ELSE 7
         END,
         s.lesson_number ASC`,
      [class_id]
    );

    res.json({
      success: true,
      count: result.rows.length,
      schedules: result.rows
    });
  } catch (err) {
    console.error('getClassSchedule xatosi:', err);
    res.status(500).json({ success: false, message: 'Server xatosi: Sinf jadvalini olishda xatolik.' });
  }
};

// ──────────────────────────────────────────
// GET /api/schedules/teacher/:teacher_id
// O'qituvchining haftalik dars jadvali
// ──────────────────────────────────────────
exports.getTeacherSchedule = async (req, res) => {
  try {
    const { teacher_id } = req.params;

    const result = await pool.query(
      `SELECT s.id, s.class_id, c.name as class_name,
              s.teacher_id, u.full_name as teacher_name,
              s.subject_id, sub.name as subject_name,
              s.day_of_week, s.lesson_number
       FROM schedules s
       JOIN classes c ON s.class_id = c.id
       JOIN users u ON s.teacher_id = u.id
       JOIN subjects sub ON s.subject_id = sub.id
       WHERE s.teacher_id = $1
       ORDER BY 
         CASE s.day_of_week
           WHEN 'Dushanba'   THEN 1
           WHEN 'Seshanba'   THEN 2
           WHEN 'Chorshanba' THEN 3
           WHEN 'Payshanba'  THEN 4
           WHEN 'Juma'       THEN 5
           WHEN 'Shanba'     THEN 6
           ELSE 7
         END,
         s.lesson_number ASC`,
      [teacher_id]
    );

    res.json({
      success: true,
      count: result.rows.length,
      schedules: result.rows
    });
  } catch (err) {
    console.error('getTeacherSchedule xatosi:', err);
    res.status(500).json({ success: false, message: 'Server xatosi: O\'qituvchi jadvalini olishda xatolik.' });
  }
};

// ──────────────────────────────────────────
// DELETE /api/admin/schedules/:id
// Dars jadvalidan darsni o'chirish
// ──────────────────────────────────────────
exports.deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM schedules WHERE id = $1', [id]);
    res.json({ success: true, message: "Dars jadvaldan o'chirildi." });
  } catch (err) {
    console.error('deleteSchedule xatosi:', err);
    res.status(500).json({ success: false, message: 'Server xatosi: Darsni o\'chirishda xatolik.' });
  }
};
