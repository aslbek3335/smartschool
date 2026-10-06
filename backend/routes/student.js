const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/student/schedule - Faqat joriy o'quvchining sinfiga tegishli dars jadvali
router.get('/schedule', authenticate, authorize('student'), async (req, res) => {
  try {
    const studentId = req.user.id;

    // 1. O'quvchining haqiqiy profil ma'lumotlarini olish
    const userResult = await pool.query(
      'SELECT id, full_name, class_name FROM users WHERE id = $1',
      [studentId]
    );

    if (!userResult.rows.length) {
      return res.status(404).json({ success: false, message: 'O\'quvchi topilmadi.' });
    }

    const student = userResult.rows[0];
    const studentClassName = student.class_name;

    if (!studentClassName) {
      return res.status(400).json({
        success: false,
        message: 'Sizga hali sinf biriktirilmagan.'
      });
    }

    // 2. Sinf mosligini tekshirish (1-A, 1-sinf va h.k.)
    const classResult = await pool.query(
      `SELECT id, name, grade_level 
       FROM classes 
       WHERE LOWER(name) = LOWER($1) 
          OR LOWER(name) = LOWER(REPLACE($1, 'sinf', '-A'))
          OR LOWER(name) = LOWER(REPLACE($1, '-sinf', '-A'))
          OR LOWER(name) LIKE LOWER($1 || '%')
       LIMIT 1`,
      [studentClassName]
    );

    const targetClassId = classResult.rows[0]?.id;

    // 3. Faqat joriy o'quvchi sinfiga tegishli haftalik dars jadvalini qaytarish
    const scheduleQuery = await pool.query(
      `SELECT s.id, s.class_id, c.name as class_name,
              s.subject_id, sub.name as subject_name,
              s.teacher_id, u.full_name as teacher_name,
              s.day_of_week, s.lesson_number
       FROM schedules s
       JOIN classes c ON s.class_id = c.id
       JOIN subjects sub ON s.subject_id = sub.id
       JOIN users u ON s.teacher_id = u.id
       WHERE s.class_id = $1 OR LOWER(c.name) = LOWER($2)
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
      [targetClassId || 0, studentClassName]
    );

    res.json({
      success: true,
      student_name: student.full_name,
      class_name: classResult.rows[0]?.name || studentClassName,
      count: scheduleQuery.rows.length,
      schedules: scheduleQuery.rows
    });
  } catch (err) {
    console.error('getStudentSchedule error:', err);
    res.status(500).json({ success: false, message: 'Server xatosi: Dars jadvalini yuklab bo\'lmadi.' });
  }
});

// GET /api/student/grades - O'quvchining shaxsiy baholari (Electronic Kundalik)
const gradeCtrl   = require('../controllers/gradeController');
const studentCtrl = require('../controllers/studentController');

router.get('/grades',   authenticate, authorize('student'), gradeCtrl.getStudentGrades);
router.get('/info',     authenticate, authorize('student'), studentCtrl.getStudentInfo);
router.get('/subjects', authenticate, authorize('student'), studentCtrl.getStudentSubjects);
router.get('/videos',   authenticate, authorize('student'), studentCtrl.getStudentVideos);
router.get('/lessons',  authenticate, authorize('student'), studentCtrl.getStudentLessons);

module.exports = router;
