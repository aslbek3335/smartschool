const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET /api/classes - Real mavjud sinflar ro'yxati
router.get('/', async (req, res) => {
  try {
    // 1. Agar classes jadvalida yozuvlar bo'lsa
    let classesQuery = await pool.query(
      `SELECT id, name, grade_level, class_type, class_teacher_id, class_leader_id 
       FROM classes 
       ORDER BY grade_level ASC, name ASC`
    );

    if (classesQuery.rows.length === 0) {
      // Standart sinflarni bazaga yozish
      await pool.query(`
        INSERT INTO classes (name, grade_level, class_type) VALUES
        ('1-sinf', 1, 'primary'),
        ('2-sinf', 2, 'primary'),
        ('3-sinf', 3, 'primary'),
        ('4-sinf', 4, 'primary'),
        ('5-sinf', 5, 'secondary'),
        ('6-sinf', 6, 'secondary'),
        ('7-sinf', 7, 'secondary'),
        ('8-sinf', 8, 'secondary'),
        ('9-sinf', 9, 'secondary'),
        ('10-sinf', 10, 'secondary'),
        ('11-sinf', 11, 'secondary')
        ON CONFLICT (name) DO NOTHING;
      `);

      classesQuery = await pool.query(
        `SELECT id, name, grade_level, class_type, class_teacher_id, class_leader_id 
         FROM classes 
         ORDER BY grade_level ASC, name ASC`
      );
    }

    return res.json({
      success: true,
      count: classesQuery.rows.length,
      classes: classesQuery.rows
    });
  } catch (err) {
    console.error('getClasses error:', err);
    res.status(500).json({ success: false, message: 'Sinflarni yuklashda server xatosi.' });
  }
});

module.exports = router;
