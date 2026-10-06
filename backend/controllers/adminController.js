const pool = require('../config/db');
const bcrypt = require('bcryptjs');

const PRIMARY_SUBJECTS = [
  'Matematika', 'Ona tili', "O'qish", 'Tabiatshunoslik',
  "Tasviriy san'at", 'Texnologiya', 'Musiqa', 'Tarbiya'
];

// ──────────────────────────────────────────
// GET /api/admin/users
// ──────────────────────────────────────────
exports.getUsers = async (req, res) => {
  try {
    let { role, search, page = 1, limit = 50 } = req.query;
    limit = parseInt(limit) || 50;
    const offset = (parseInt(page) - 1) * limit;
    const params = [];
    let where = 'WHERE 1=1';

    if (req.user && req.user.role === 'teacher' && !role) {
      role = 'student';
    }

    if (role)   { params.push(role);          where += ` AND role=$${params.length}`; }
    if (search) { params.push(`%${search}%`); where += ` AND (full_name ILIKE $${params.length} OR email ILIKE $${params.length})`; }

    params.push(limit, offset);
    const result = await pool.query(
      `SELECT id, full_name, email, role, avatar_url, class_name, subject, is_active, COALESCE(plain_password, '123456') AS plain_password, created_at
       FROM users ${where}
       ORDER BY created_at DESC
       LIMIT $${params.length-1} OFFSET $${params.length}`,
      params
    );
    const total = await pool.query(`SELECT COUNT(*) FROM users ${where}`, params.slice(0,-2));
    res.json({ success: true, users: result.rows, total: parseInt(total.rows[0].count) });
  } catch (err) {
    console.error('getUsers xato:', err);
    res.status(500).json({ success: false, message: 'Server xatosi.' });
  }
};

// ──────────────────────────────────────────
// PUT /api/admin/users/:id/toggle-active
// ──────────────────────────────────────────
exports.toggleActive = async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE users SET is_active = NOT is_active WHERE id=$1 RETURNING id, full_name, is_active',
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Foydalanuvchi topilmadi.' });
    const u = result.rows[0];
    res.json({ success: true, message: `${u.full_name} ${u.is_active ? 'faollashtirildi' : 'bloklandi'}.`, user: u });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server xatosi.' });
  }
};

// ──────────────────────────────────────────
// DELETE /api/admin/users/:id
// ──────────────────────────────────────────
exports.deleteUser = async (req, res) => {
  try {
    if (req.params.id == req.user.id) {
      return res.status(400).json({ success: false, message: 'O\'zingizni o\'chira olmaysiz.' });
    }
    await pool.query('DELETE FROM users WHERE id=$1', [req.params.id]);
    res.json({ success: true, message: 'Foydalanuvchi o\'chirildi.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server xatosi.' });
  }
};

// ──────────────────────────────────────────
// GET /api/admin/stats
// ──────────────────────────────────────────
exports.getStats = async (req, res) => {
  try {
    const [users, students, teachers, lessons, videos, tasks, views] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM users WHERE is_active=TRUE"),
      pool.query("SELECT COUNT(*) FROM users WHERE role='student' AND is_active=TRUE"),
      pool.query("SELECT COUNT(*) FROM users WHERE role='teacher' AND is_active=TRUE"),
      pool.query("SELECT COUNT(*) FROM lessons WHERE is_published=TRUE"),
      pool.query("SELECT COUNT(*) FROM videos  WHERE is_published=TRUE"),
      pool.query("SELECT COUNT(*) FROM tasks"),
      pool.query("SELECT COALESCE(SUM(views),0) AS total_views FROM videos"),
    ]);

    // So'nggi 7 kun foydalanuvchi registratsiyasi
    const newUsers = await pool.query(
      `SELECT DATE(created_at) AS date, COUNT(*) AS count
       FROM users
       WHERE created_at >= NOW() - INTERVAL '7 days'
       GROUP BY DATE(created_at) ORDER BY date`
    );

    const viewsVal = views.rows[0]?.total_views || views.rows[0]?.coalesce || views.rows[0]?.sum || 0;

    res.json({
      success: true,
      stats: {
        total_users:    parseInt(users.rows[0].count) || 0,
        total_students: parseInt(students.rows[0].count) || 0,
        total_teachers: parseInt(teachers.rows[0].count) || 0,
        total_lessons:  parseInt(lessons.rows[0].count) || 0,
        total_videos:   parseInt(videos.rows[0].count) || 0,
        total_tasks:    parseInt(tasks.rows[0].count) || 0,
        total_views:    parseInt(viewsVal) || 0,
      },
      newUsers: newUsers.rows,
    });
  } catch (err) {
    console.error('getStats xato:', err);
    res.status(500).json({ success: false, message: 'Server xatosi.' });
  }
};

// Helper: Resolve class IDs from array or single value
async function resolveClassIds(input) {
  if (!input) return [];
  const items = Array.isArray(input) ? input : [input];
  const ids = new Set();
  for (const item of items) {
    if (typeof item === 'number' || (typeof item === 'string' && /^\d+$/.test(item.trim()))) {
      ids.add(parseInt(item));
    } else if (typeof item === 'string' && item.trim()) {
      const trimmed = item.trim();
      const res = await pool.query(
        'SELECT id FROM classes WHERE LOWER(name) = LOWER($1) OR LOWER(name) = LOWER($2) OR id = $3',
        [trimmed, trimmed.replace(' sinf', '-sinf'), parseInt(trimmed) || -1]
      );
      if (res.rows.length) {
        ids.add(res.rows[0].id);
      }
    }
  }
  return Array.from(ids);
}

// Helper: Resolve or create subject ID
async function resolveSubjectId(subjectNameOrId, teacherId) {
  if (!subjectNameOrId) return null;
  if (typeof subjectNameOrId === 'number' || (typeof subjectNameOrId === 'string' && /^\d+$/.test(subjectNameOrId.trim()))) {
    return parseInt(subjectNameOrId);
  }
  const sName = String(subjectNameOrId).trim();
  const sCheck = await pool.query('SELECT id FROM subjects WHERE LOWER(name) = LOWER($1)', [sName]);
  if (sCheck.rows.length) {
    const sId = sCheck.rows[0].id;
    if (teacherId) {
      await pool.query('UPDATE subjects SET teacher_id = COALESCE(teacher_id, $1) WHERE id = $2', [teacherId, sId]);
    }
    return sId;
  } else {
    const newSub = await pool.query(
      `INSERT INTO subjects (name, description, icon, color, teacher_id)
       VALUES ($1, $2, '📚', '#3b82f6', $3) RETURNING id`,
      [sName, `${sName} fani darsliklari va materiallari`, teacherId || null]
    );
    return newSub.rows[0].id;
  }
}

// ──────────────────────────────────────────
// POST /api/admin/users
// ──────────────────────────────────────────
exports.createUser = async (req, res) => {
  try {
    const { full_name, email, password, role, class_name, class_ids, class_id, subject, subjects, subject_ids, is_primary_teacher, is_primary_pe, is_class_leader, class_leader_of } = req.body;
    const incomingSubjects = Array.isArray(subjects) ? subjects : (Array.isArray(subject_ids) ? subject_ids : []);

    if (!full_name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Barcha majburiy maydonlarni to\'ldiring.' });
    }
    if (!['student', 'teacher', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Noto\'g\'ri rol tanlandi.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak.' });
    }

    // Login/Email mavjudligini tekshirish
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1 OR username = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Ushbu login/email allaqachon ro'yxatdan o'tgan. Boshqa login tanlang."
      });
    }

    const hash = await bcrypt.hash(password, 12);
    let finalSubject = is_primary_pe 
      ? 'Jismoniy tarbiya' 
      : (is_primary_teacher ? (subject || "Boshlang'ich ta'lim fanlari") : (subject || null));

    const result = await pool.query(
      `INSERT INTO users (full_name, email, username, password_hash, password, plain_password, role, class_name, subject)
       VALUES ($1, $2, $2, $3, $3, $4, $5, $6, $7)
       RETURNING id, full_name, email, username, role, class_name, subject, is_active, plain_password, created_at`,
      [full_name, email, hash, password, role, class_name || null, finalSubject]
    );

    const newUser = result.rows[0];

    if (role === 'teacher') {
      const targetClassIds = await resolveClassIds(class_ids || class_id || class_name);
      const subId = await resolveSubjectId(finalSubject, newUser.id);

      // Fanlar to'plamini aniqlash (boshlang'ich o'qituvchi yoki tanlangan fanlar)
      const subjectsToAssign = incomingSubjects.length > 0 
        ? incomingSubjects 
        : (is_primary_teacher ? PRIMARY_SUBJECTS : (finalSubject ? [finalSubject] : []));

      const resolvedSubIds = new Set();
      for (const subItem of subjectsToAssign) {
        const sId = await resolveSubjectId(subItem, newUser.id);
        if (sId) resolvedSubIds.add(sId);
      }
      if (resolvedSubIds.size === 0 && subId) {
        resolvedSubIds.add(subId);
      }

      // 1. teacher_subjects jadvaliga barcha fanlarni yozish
      for (const sId of resolvedSubIds) {
        await pool.query(
          `INSERT INTO teacher_subjects (teacher_id, subject_id)
           VALUES ($1, $2)
           ON CONFLICT (teacher_id, subject_id) DO NOTHING`,
          [newUser.id, sId]
        );
      }

      // 2. teacher_classes va class_subject_teachers ga to'liq yozish
      const primarySubId = Array.from(resolvedSubIds)[0] || subId || null;
      for (const cId of targetClassIds) {
        await pool.query(
          `INSERT INTO teacher_classes (teacher_id, class_id, subject_id)
           VALUES ($1, $2, $3)
           ON CONFLICT (teacher_id, class_id)
           DO UPDATE SET subject_id = COALESCE(EXCLUDED.subject_id, teacher_classes.subject_id)`,
          [newUser.id, cId, primarySubId]
        );

        for (const sId of resolvedSubIds) {
          await pool.query(
            `INSERT INTO class_subject_teachers (class_id, subject_id, teacher_id)
             VALUES ($1, $2, $3)
             ON CONFLICT (class_id, subject_id)
             DO UPDATE SET teacher_id = EXCLUDED.teacher_id`,
            [cId, sId, newUser.id]
          );
        }
      }

      // 3. Boshlang'ich sinflar asosiy o'qituvchisi (primary_teacher_id)
      if (is_primary_teacher) {
        for (const cId of targetClassIds) {
          await pool.query(`UPDATE classes SET primary_teacher_id = $1 WHERE id = $2 AND grade_level <= 4`, [newUser.id, cId]);
        }
      }

      // 4. Boshlang'ich jismoniy tarbiya o'qituvchisi
      if (is_primary_pe) {
        await pool.query(`UPDATE classes SET pe_teacher_id = $1 WHERE grade_level <= 4`, [newUser.id]);
      }

      // 5. Sinf rahbarligi (Homeroom Leadership): FAQAT bitta tanlangan sinfga yoziladi
      if (is_class_leader && class_leader_of) {
        const leaderClassIds = await resolveClassIds(class_leader_of);
        if (leaderClassIds.length > 0) {
          const leaderCId = leaderClassIds[0];
          await pool.query(
            `UPDATE classes SET class_teacher_id = NULL, class_leader_id = NULL 
             WHERE (class_teacher_id = $1 OR class_leader_id = $1) AND id != $2`,
            [newUser.id, leaderCId]
          );
          await pool.query(
            `UPDATE classes SET class_teacher_id = $1, class_leader_id = $1 WHERE id = $2`,
            [newUser.id, leaderCId]
          );
        }
      }
    }

    res.status(201).json({
      success: true,
      message: 'Foydalanuvchi muvaffaqiyatli yaratildi!',
      user: newUser
    });
  } catch (err) {
    console.error('createUser xato:', err);
    if (err.code === '23505') {
      return res.status(400).json({
        success: false,
        message: "Ushbu login/email allaqachon ro'yxatdan o'tgan. Boshqa login tanlang."
      });
    }
    res.status(500).json({ success: false, message: 'Server xatosi.' });
  }
};

// ──────────────────────────────────────────
// PUT /api/admin/users/:id
// ──────────────────────────────────────────
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, email, role, class_name, class_ids, class_id, subject, subjects, subject_ids, is_primary_teacher, is_primary_pe, is_class_leader, class_leader_of } = req.body;
    const incomingSubjects = Array.isArray(subjects) ? subjects : (Array.isArray(subject_ids) ? subject_ids : null);

    if (!full_name || !email || !role) {
      return res.status(400).json({ success: false, message: 'Ism, email va rol talab etiladi.' });
    }

    if (email) {
      const existingUser = await pool.query(
        'SELECT id FROM users WHERE (email = $1 OR username = $1) AND id != $2',
        [email, id]
      );
      if (existingUser.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Ushbu login/email allaqachon ro'yxatdan o'tgan. Boshqa login tanlang."
        });
      }
    }

    let finalSubject = is_primary_pe 
      ? 'Jismoniy tarbiya' 
      : (is_primary_teacher ? (subject || "Boshlang'ich ta'lim fanlari") : (subject || null));

    const result = await pool.query(
      `UPDATE users SET
        full_name  = COALESCE($1, full_name),
        email      = COALESCE($2, email),
        username   = COALESCE($2, username),
        role       = COALESCE($3, role),
        class_name = $4,
        subject    = $5
       WHERE id = $6
       RETURNING id, full_name, email, username, role, class_name, subject, is_active, plain_password, created_at`,
      [full_name, email, role, class_name || null, finalSubject, id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Foydalanuvchi topilmadi.' });
    }

    const updatedUser = result.rows[0];

    if (role === 'teacher') {
      const targetClassIds = (class_ids !== undefined || class_id !== undefined || class_name !== undefined)
        ? await resolveClassIds(class_ids || class_id || class_name)
        : null;
      const subId = await resolveSubjectId(finalSubject, id);

      // Fanlar to'plamini aniqlash
      const allSubjectNames = (incomingSubjects !== null && incomingSubjects.length > 0)
        ? incomingSubjects
        : (is_primary_teacher ? PRIMARY_SUBJECTS : (finalSubject ? [finalSubject] : []));

      const shouldUpdateSubjects = (incomingSubjects !== null || is_primary_teacher !== undefined || subject !== undefined);

      let resolvedSubIds = new Set();
      if (shouldUpdateSubjects) {
        for (const subItem of allSubjectNames) {
          const sId = await resolveSubjectId(subItem, id);
          if (sId) resolvedSubIds.add(sId);
        }
        if (resolvedSubIds.size === 0 && subId) {
          resolvedSubIds.add(subId);
        }

        // 1. teacher_subjects ni yangilash
        await pool.query('DELETE FROM teacher_subjects WHERE teacher_id = $1', [id]);
        for (const sId of resolvedSubIds) {
          await pool.query(
            `INSERT INTO teacher_subjects (teacher_id, subject_id)
             VALUES ($1, $2)
             ON CONFLICT (teacher_id, subject_id) DO NOTHING`,
            [id, sId]
          );
        }
      } else {
        // Mavjud fanlarni olish
        const existingSubs = await pool.query('SELECT subject_id FROM teacher_subjects WHERE teacher_id = $1', [id]);
        existingSubs.rows.forEach(r => resolvedSubIds.add(r.subject_id));
        if (subId) resolvedSubIds.add(subId);
      }

      // 2. teacher_classes va class_subject_teachers ni sinxronlashtirish
      if (targetClassIds !== null) {
        await pool.query('DELETE FROM teacher_classes WHERE teacher_id = $1', [id]);
        await pool.query('DELETE FROM class_subject_teachers WHERE teacher_id = $1', [id]);

        const primarySubId = Array.from(resolvedSubIds)[0] || subId || null;
        for (const cId of targetClassIds) {
          await pool.query(
            `INSERT INTO teacher_classes (teacher_id, class_id, subject_id)
             VALUES ($1, $2, $3)
             ON CONFLICT (teacher_id, class_id)
             DO UPDATE SET subject_id = COALESCE(EXCLUDED.subject_id, teacher_classes.subject_id)`,
            [id, cId, primarySubId]
          );

          for (const sId of resolvedSubIds) {
            await pool.query(
              `INSERT INTO class_subject_teachers (class_id, subject_id, teacher_id)
               VALUES ($1, $2, $3)
               ON CONFLICT (class_id, subject_id)
               DO UPDATE SET teacher_id = EXCLUDED.teacher_id`,
              [cId, sId, id]
            );
          }
        }
      }

      // 3. Boshlang'ich sinflar asosiy o'qituvchisi (primary_teacher_id)
      if (is_primary_teacher && targetClassIds) {
        for (const cId of targetClassIds) {
          await pool.query(`UPDATE classes SET primary_teacher_id = $1 WHERE id = $2 AND grade_level <= 4`, [id, cId]);
        }
      } else if (is_primary_teacher === false) {
        await pool.query(`UPDATE classes SET primary_teacher_id = NULL WHERE primary_teacher_id = $1`, [id]);
      }

      // 4. Boshlang'ich jismoniy tarbiya o'qituvchisi
      if (is_primary_pe) {
        await pool.query(`UPDATE classes SET pe_teacher_id = $1 WHERE grade_level <= 4`, [id]);
      }

      // 5. Sinf rahbarligi
      if (is_class_leader && class_leader_of) {
        const leaderClassIds = await resolveClassIds(class_leader_of);
        if (leaderClassIds.length > 0) {
          const leaderCId = leaderClassIds[0];
          await pool.query(
            `UPDATE classes SET class_teacher_id = NULL, class_leader_id = NULL 
             WHERE (class_teacher_id = $1 OR class_leader_id = $1) AND id != $2`,
            [id, leaderCId]
          );
          await pool.query(
            `UPDATE classes SET class_teacher_id = $1, class_leader_id = $1 WHERE id = $2`,
            [id, leaderCId]
          );
        }
      } else if (is_class_leader === false) {
        await pool.query(
          `UPDATE classes SET class_teacher_id = NULL, class_leader_id = NULL WHERE class_teacher_id = $1 OR class_leader_id = $1`,
          [id]
        );
      }
    }

    res.json({
      success: true,
      message: 'Foydalanuvchi ma\'lumotlari muvaffaqiyatli yangilandi!',
      user: updatedUser
    });
  } catch (err) {
    console.error('updateUser xato:', err);
    if (err.code === '23505') {
      return res.status(400).json({
        success: false,
        message: "Ushbu login/email allaqachon ro'yxatdan o'tgan. Boshqa login tanlang."
      });
    }
    res.status(500).json({ success: false, message: 'Server xatosi.' });
  }
};

// ──────────────────────────────────────────
// GET /api/admin/teachers/:id/teaching-info
// O'qituvchining biriktirilgan sinflari va fani
// ──────────────────────────────────────────
exports.getTeacherTeachingInfo = async (req, res) => {
  try {
    const teacherId = parseInt(req.params.id);
    if (!teacherId) {
      return res.status(400).json({ success: false, message: "O'qituvchi ID ko'rsatilmadi." });
    }

    const teacherRes = await pool.query(
      "SELECT id, full_name, email, role, subject, class_name FROM users WHERE id = $1 AND role = 'teacher'",
      [teacherId]
    );
    if (!teacherRes.rows.length) {
      return res.status(404).json({ success: false, message: "O'qituvchi topilmadi." });
    }
    const teacher = teacherRes.rows[0];

    // O'qituvchiga biriktirilgan sinflar
    const classesRes = await pool.query(
      `SELECT DISTINCT c.id, c.name, c.grade_level
       FROM classes c
       WHERE c.id IN (
         SELECT class_id FROM teacher_classes WHERE teacher_id = $1
         UNION
         SELECT class_id FROM class_subject_teachers WHERE teacher_id = $1
         UNION
         SELECT id FROM classes WHERE primary_teacher_id = $1 OR class_leader_id = $1 OR class_teacher_id = $1 OR pe_teacher_id = $1
       )
       ORDER BY c.grade_level ASC, c.name ASC`,
      [teacherId]
    );

    let assignedClasses = classesRes.rows;
    if (assignedClasses.length === 0 && teacher.class_name) {
      const resolvedIds = await resolveClassIds(teacher.class_name);
      if (resolvedIds.length > 0) {
        const fallbackRes = await pool.query(
          `SELECT id, name, grade_level FROM classes WHERE id = ANY($1::int[]) ORDER BY grade_level ASC, name ASC`,
          [resolvedIds]
        );
        assignedClasses = fallbackRes.rows;
      }
    }

    // O'qituvchiga tegishli fanlar
    const subjectsRes = await pool.query(
      `SELECT DISTINCT s.id, s.name, COALESCE(s.icon, '📚') AS icon, COALESCE(s.color, '#3b82f6') AS color
       FROM subjects s
       WHERE s.id IN (
         SELECT subject_id FROM teacher_classes WHERE teacher_id = $1 AND subject_id IS NOT NULL
         UNION
         SELECT subject_id FROM class_subject_teachers WHERE teacher_id = $1
         UNION
         SELECT subject_id FROM teacher_subjects WHERE teacher_id = $1
       )
       OR s.teacher_id = $1
       OR (LOWER(s.name) = LOWER($2) AND $2 != '')
       ORDER BY s.name ASC`,
      [teacherId, (teacher.subject || '').trim()]
    );

    // Sinf rahbarligi
    const homeroomRes = await pool.query(
      `SELECT id, name, grade_level FROM classes WHERE class_teacher_id = $1 OR class_leader_id = $1 LIMIT 1`,
      [teacherId]
    );

    // Boshlang'ich sinf o'qituvchisi ekanligini tekshirish
    const primaryCheck = await pool.query(
      `SELECT 1 FROM classes WHERE primary_teacher_id = $1 LIMIT 1`,
      [teacherId]
    );
    const isPrimaryTeacher = primaryCheck.rows.length > 0 || (teacher.subject || '').toLowerCase().includes('boshlang');

    res.json({
      success: true,
      teacher: {
        id: teacher.id,
        full_name: teacher.full_name,
        email: teacher.email,
        subject: teacher.subject
      },
      is_primary_teacher: isPrimaryTeacher,
      classes: assignedClasses,
      has_assigned_classes: assignedClasses.length > 0,
      subjects: subjectsRes.rows,
      homeroom_class: homeroomRes.rows[0] || null
    });
  } catch (err) {
    console.error('getTeacherTeachingInfo xato:', err);
    res.status(500).json({ success: false, message: 'Server xatosi.' });
  }
};

// ──────────────────────────────────────────
// PUT /api/admin/users/:id/reset-password
// ──────────────────────────────────────────
exports.resetPassword = async (req, res) => {
  try {
    const { new_password } = req.body;
    if (!new_password || new_password.length < 6) {
      return res.status(400).json({ success: false, message: 'Yangi parol kamida 6 ta belgidan iborat bo\'lishi kerak.' });
    }

    const hash = await bcrypt.hash(new_password, 12);
    const result = await pool.query(
      `UPDATE users SET password_hash = $1, plain_password = $2 WHERE id = $3 RETURNING id, full_name, email`,
      [hash, new_password, req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Foydalanuvchi topilmadi.' });
    }

    res.json({
      success: true,
      message: `${result.rows[0].full_name} ning paroli muvaffaqiyatli o'zgartirildi!`
    });
  } catch (err) {
    console.error('resetPassword xato:', err);
    res.status(500).json({ success: false, message: 'Server xatosi.' });
  }
};

// ──────────────────────────────────────────
// POST /api/admin/assign-class
// ──────────────────────────────────────────
exports.assignClass = async (req, res) => {
  const client = await pool.connect();
  try {
    const { teacher_id, class_ids, class_id, subject_id, subject_name } = req.body;

    const rawIds = Array.isArray(class_ids) ? class_ids : (class_id ? [class_id] : []);
    const targetClassIds = rawIds.map(id => parseInt(id)).filter(id => !isNaN(id) && id > 0);

    if (!teacher_id || targetClassIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "O'qituvchi (teacher_id) va kamida bitta sinf (class_ids) tanlanishi shart."
      });
    }

    // 1. O'qituvchi mavjudligini tekshirish
    const teacherCheck = await client.query(
      "SELECT id, full_name, email, role, subject FROM users WHERE id = $1 AND role = 'teacher'",
      [teacher_id]
    );
    if (!teacherCheck.rows.length) {
      return res.status(404).json({
        success: false,
        message: "Ko'rsatilgan o'qituvchi topilmadi yoki uning roli o'qituvchi emas."
      });
    }
    const teacher = teacherCheck.rows[0];

    // 2. Sinflar mavjudligini tekshirish
    const classesCheck = await client.query(
      "SELECT id, name, grade_level FROM classes WHERE id = ANY($1::int[])",
      [targetClassIds]
    );
    if (classesCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Ko'rsatilgan sinflar topilmadi."
      });
    }

    // 3. Fanni aniqlash yoki yaratish (subject_id yoki subject_name orqali)
    let finalSubId = subject_id ? parseInt(subject_id) : null;
    let finalSubName = (subject_name || '').trim();

    if (!finalSubId && finalSubName) {
      const sCheck = await client.query(
        "SELECT id, name FROM subjects WHERE LOWER(name) = LOWER($1)",
        [finalSubName]
      );
      if (sCheck.rows.length) {
        finalSubId = sCheck.rows[0].id;
        finalSubName = sCheck.rows[0].name;
      } else {
        const newSub = await client.query(
          `INSERT INTO subjects (name, description, icon, color, teacher_id)
           VALUES ($1, $2, '📚', '#3b82f6', $3) RETURNING id, name`,
          [finalSubName, `${finalSubName} fani darsliklari va materiallari`, teacher_id]
        );
        finalSubId = newSub.rows[0].id;
        finalSubName = newSub.rows[0].name;
      }
    } else if (!finalSubId && !finalSubName && teacher.subject) {
      // O'qituvchining profilidagi fandan avtomatik foydalanish
      const tSubject = teacher.subject.trim();
      const sCheck = await client.query(
        "SELECT id, name FROM subjects WHERE LOWER(name) = LOWER($1)",
        [tSubject]
      );
      if (sCheck.rows.length) {
        finalSubId = sCheck.rows[0].id;
        finalSubName = sCheck.rows[0].name;
      } else {
        const newSub = await client.query(
          `INSERT INTO subjects (name, description, icon, color, teacher_id)
           VALUES ($1, $2, '📚', '#3b82f6', $3) RETURNING id, name`,
          [tSubject, `${tSubject} fani darsliklari va materiallari`, teacher_id]
        );
        finalSubId = newSub.rows[0].id;
        finalSubName = newSub.rows[0].name;
      }
    }

    // 4. Tranzaksiya orqali barcha sinflarni biriktirish
    await client.query('BEGIN');

    const assignedClassNames = [];
    for (const cls of classesCheck.rows) {
      const cId = cls.id;
      assignedClassNames.push(cls.name);

      // teacher_classes jadvaliga yozish
      await client.query(
        `INSERT INTO teacher_classes (teacher_id, class_id, subject_id)
         VALUES ($1, $2, $3)
         ON CONFLICT (teacher_id, class_id)
         DO UPDATE SET subject_id = COALESCE(EXCLUDED.subject_id, teacher_classes.subject_id)`,
        [teacher_id, cId, finalSubId]
      );

      // class_subject_teachers jadvaliga yozish
      if (finalSubId) {
        await client.query(
          `INSERT INTO class_subject_teachers (class_id, subject_id, teacher_id)
           VALUES ($1, $2, $3)
           ON CONFLICT (class_id, subject_id)
           DO UPDATE SET teacher_id = EXCLUDED.teacher_id`,
          [cId, finalSubId, teacher_id]
        );
      }
    }

    // teacher_subjects jadvaliga bog'lash
    if (finalSubId) {
      await client.query(
        `INSERT INTO teacher_subjects (teacher_id, subject_id)
         VALUES ($1, $2)
         ON CONFLICT (teacher_id, subject_id) DO NOTHING`,
        [teacher_id, finalSubId]
      );
    }

    await client.query('COMMIT');

    const subText = finalSubName ? ` (${finalSubName} fani)` : '';
    const classListText = assignedClassNames.join(', ');
    return res.status(200).json({
      success: true,
      message: `${teacher.full_name} muvaffaqiyatli ${assignedClassNames.length} ta sinfga (${classListText})${subText} biriktirildi!`,
      assigned_classes: targetClassIds,
      assigned_class_names: assignedClassNames
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('assignClass xatosi:', err);
    return res.status(500).json({
      success: false,
      message: 'Server xatosi: Darsni biriktirishda muammo yuz berdi.'
    });
  } finally {
    client.release();
  }
};

// ──────────────────────────────────────────
// GET /api/admin/assignments
// ──────────────────────────────────────────
exports.getAssignments = async (req, res) => {
  try {
    const { teacher_id, class_id } = req.query;
    let query = `
      SELECT tc.id, tc.teacher_id, u.full_name AS teacher_name, u.email AS teacher_email,
             tc.class_id, c.name AS class_name, c.grade_level,
             tc.subject_id, s.name AS subject_name, tc.created_at
      FROM teacher_classes tc
      JOIN users u ON tc.teacher_id = u.id
      JOIN classes c ON tc.class_id = c.id
      LEFT JOIN subjects s ON tc.subject_id = s.id
      WHERE 1=1
    `;
    const params = [];
    if (teacher_id) {
      params.push(teacher_id);
      query += ` AND tc.teacher_id = $${params.length}`;
    }
    if (class_id) {
      params.push(class_id);
      query += ` AND tc.class_id = $${params.length}`;
    }

    query += ` ORDER BY c.grade_level ASC, c.name ASC, u.full_name ASC`;

    const result = await pool.query(query, params);

    return res.json({
      success: true,
      count: result.rows.length,
      assignments: result.rows
    });
  } catch (err) {
    console.error('getAssignments xatosi:', err);
    return res.status(500).json({
      success: false,
      message: 'Server xatosi: Biriktirishlarni olishda muammo yuz berdi.'
    });
  }
};

// ──────────────────────────────────────────
// DELETE /api/admin/assignments/:id
// ──────────────────────────────────────────
exports.deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM teacher_classes WHERE id = $1', [id]);
    res.json({ success: true, message: "Biriktirish o'chirildi." });
  } catch (err) {
    console.error('deleteAssignment error:', err);
    res.status(500).json({ success: false, message: 'Server xatosi.' });
  }
};
