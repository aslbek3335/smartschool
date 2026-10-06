const pool = require('../config/db');

// Helper: Ensure standard classes 1-A to 11-A exist in DB
async function ensureDefaultClasses() {
  const check = await pool.query('SELECT COUNT(*) FROM classes');
  if (parseInt(check.rows[0].count) === 0) {
    const defaultClasses = [
      { name: '1-A', grade: 1, type: 'primary' },
      { name: '2-A', grade: 2, type: 'primary' },
      { name: '3-A', grade: 3, type: 'primary' },
      { name: '4-A', grade: 4, type: 'primary' },
      { name: '5-A', grade: 5, type: 'secondary' },
      { name: '6-A', grade: 6, type: 'secondary' },
      { name: '7-A', grade: 7, type: 'secondary' },
      { name: '8-A', grade: 8, type: 'secondary' },
      { name: '9-A', grade: 9, type: 'secondary' },
      { name: '10-A', grade: 10, type: 'secondary' },
      { name: '11-A', grade: 11, type: 'secondary' },
    ];
    for (let c of defaultClasses) {
      await pool.query(
        `INSERT INTO classes (name, grade_level, class_type) VALUES ($1, $2, $3) ON CONFLICT (name) DO NOTHING`,
        [c.name, c.grade, c.type]
      );
    }
  }
}

// ──────────────────────────────────────────
// GET /api/admin/allocations
// ──────────────────────────────────────────
exports.getAllocations = async (req, res) => {
  try {
    await ensureDefaultClasses();

    const classesQuery = await pool.query(`
      SELECT 
        c.id, c.name, c.grade_level, c.class_type,
        c.primary_teacher_id, pt.full_name as primary_teacher_name, pt.email as primary_teacher_email,
        c.class_leader_id, cl.full_name as class_leader_name, cl.email as class_leader_email,
        c.pe_teacher_id, pe.full_name as pe_teacher_name, pe.email as pe_teacher_email
      FROM classes c
      LEFT JOIN users pt ON c.primary_teacher_id = pt.id
      LEFT JOIN users cl ON c.class_leader_id = cl.id
      LEFT JOIN users pe ON c.pe_teacher_id = pe.id
      ORDER BY c.grade_level ASC, c.name ASC
    `);

    const classAssignments = await pool.query(`
      SELECT 
        cst.class_id, cst.subject_id, cst.teacher_id,
        s.name as subject_name, u.full_name as teacher_name
      FROM class_subject_teachers cst
      JOIN subjects s ON cst.subject_id = s.id
      JOIN users u ON cst.teacher_id = u.id
    `);

    // Group subject teachers by class_id
    const assignmentsMap = {};
    classAssignments.rows.forEach(row => {
      if (!assignmentsMap[row.class_id]) assignmentsMap[row.class_id] = [];
      assignmentsMap[row.class_id].push(row);
    });

    const allocations = classesQuery.rows.map(cls => ({
      ...cls,
      subject_assignments: assignmentsMap[cls.id] || []
    }));

    res.json({ success: true, allocations });
  } catch (err) {
    console.error('getAllocations error:', err);
    res.status(500).json({ success: false, message: 'Server xatosi.' });
  }
};

// ──────────────────────────────────────────
// GET /api/admin/allocations/options
// ──────────────────────────────────────────
exports.getAllocationOptions = async (req, res) => {
  try {
    const teachers = await pool.query(
      `SELECT id, full_name, email, subject, class_name FROM users WHERE role='teacher' AND is_active=TRUE ORDER BY full_name ASC`
    );
    const subjects = await pool.query(
      `SELECT id, name, class_name, icon, color FROM subjects ORDER BY name ASC`
    );
    const classes = await pool.query(
      `SELECT id, name, grade_level FROM classes ORDER BY grade_level ASC, name ASC`
    );

    res.json({
      success: true,
      teachers: teachers.rows,
      subjects: subjects.rows,
      classes: classes.rows
    });
  } catch (err) {
    console.error('getAllocationOptions error:', err);
    res.status(500).json({ success: false, message: 'Server xatosi.' });
  }
};

// ──────────────────────────────────────────
// POST /api/admin/allocations/primary (1-4 Sinflar)
// ──────────────────────────────────────────
exports.savePrimaryAllocation = async (req, res) => {
  try {
    const { class_id, class_name, primary_teacher_id, pe_teacher_id } = req.body;

    if (!class_name || !primary_teacher_id) {
      return res.status(400).json({
        success: false,
        message: "Boshlang'ich sinf uchun asosiy o'qituvchini tanlang."
      });
    }

    const gradeLevel = parseInt(class_name.split('-')[0]) || 1;
    if (gradeLevel > 4) {
      return res.status(400).json({
        success: false,
        message: "1-4 sinflar qoidasi faqat boshlang'ich sinflarga taalluqli."
      });
    }

    // 1. Update or Insert Class
    const classRes = await pool.query(
      `INSERT INTO classes (name, grade_level, class_type, primary_teacher_id, pe_teacher_id, class_teacher_id)
       VALUES ($1, $2, 'primary', $3, $4, $3)
       ON CONFLICT (name) 
       DO UPDATE SET primary_teacher_id = $3, pe_teacher_id = $4, class_teacher_id = $3, class_type = 'primary'
       RETURNING id, name`,
      [class_name, gradeLevel, primary_teacher_id, pe_teacher_id || null]
    );

    const savedClassId = classRes.rows[0].id;

    // 2. Fetch all subjects
    const subjectsRes = await pool.query('SELECT id, name FROM subjects');

    // 3. Assign subjects: PE to pe_teacher_id (or primary_teacher_id), all academic to primary_teacher_id
    for (let subj of subjectsRes.rows) {
      const isPE = subj.name.toLowerCase().includes('jismoniy') || subj.name.toLowerCase().includes('tarbiya');
      const assignedTeacherId = (isPE && pe_teacher_id) ? pe_teacher_id : primary_teacher_id;

      await pool.query(
        `INSERT INTO class_subject_teachers (class_id, subject_id, teacher_id)
         VALUES ($1, $2, $3)
         ON CONFLICT (class_id, subject_id)
         DO UPDATE SET teacher_id = $3`,
        [savedClassId, subj.id, assignedTeacherId]
      );
    }

    res.json({
      success: true,
      message: `${class_name} sinfi uchun dars taqsimoti muvaffaqiyatli saqlandi! (1-4 sinf qoidasi asosida)`
    });
  } catch (err) {
    console.error('savePrimaryAllocation error:', err);
    res.status(500).json({ success: false, message: 'Server xatosi.' });
  }
};

// ──────────────────────────────────────────
// POST /api/admin/allocations/secondary (5-11 Sinflar)
// ──────────────────────────────────────────
exports.saveSecondaryAllocation = async (req, res) => {
  try {
    const { class_name, class_leader_id, subject_assignments } = req.body;

    if (!class_name || !class_leader_id) {
      return res.status(400).json({
        success: false,
        message: "Yuqori sinf uchun Sinf rahbarini tanlang."
      });
    }

    const gradeLevel = parseInt(class_name.split('-')[0]) || 5;

    // 1. Update or Insert Class
    const classRes = await pool.query(
      `INSERT INTO classes (name, grade_level, class_type, class_leader_id, class_teacher_id)
       VALUES ($1, $2, 'secondary', $3, $3)
       ON CONFLICT (name) 
       DO UPDATE SET class_leader_id = $3, class_teacher_id = $3, class_type = 'secondary'
       RETURNING id, name`,
      [class_name, gradeLevel, class_leader_id]
    );

    const savedClassId = classRes.rows[0].id;

    // 2. Assign specialized subject teachers
    if (Array.isArray(subject_assignments)) {
      for (let sa of subject_assignments) {
        if (sa.subject_id && sa.teacher_id) {
          await pool.query(
            `INSERT INTO class_subject_teachers (class_id, subject_id, teacher_id)
             VALUES ($1, $2, $3)
             ON CONFLICT (class_id, subject_id)
             DO UPDATE SET teacher_id = $3`,
            [savedClassId, sa.subject_id, sa.teacher_id]
          );
        }
      }
    }

    res.json({
      success: true,
      message: `${class_name} sinfi uchun dars taqsimoti muvaffaqiyatli saqlandi! (5-11 sinf qoidasi asosida)`
    });
  } catch (err) {
    console.error('saveSecondaryAllocation error:', err);
    res.status(500).json({ success: false, message: 'Server xatosi.' });
  }
};
