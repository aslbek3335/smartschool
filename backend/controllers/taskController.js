const pool = require('../config/db');

// GET /api/tasks
exports.getTasks = async (req, res) => {
  try {
    const { role, id: userId, class_name } = req.user;
    let where = 'WHERE 1=1';
    const params = [];

    if (role === 'teacher') {
      params.push(userId);
      where += ` AND (t.teacher_id = $${params.length})`;
    } else if (role === 'student' && class_name) {
      params.push(class_name);
      where += ` AND (t.class_name IS NULL OR t.class_name = '' OR t.class_name = $${params.length})`;
    }

    const query = `
      SELECT t.*, s.name AS subject_name, s.icon AS subject_icon, s.color AS subject_color,
             u.full_name AS teacher_name,
             (SELECT COUNT(*) FROM task_submissions ts WHERE ts.task_id = t.id) AS submission_count
             ${role === 'student' ? `, (SELECT score FROM task_submissions ts WHERE ts.task_id = t.id AND ts.student_id = ${userId}) AS my_score` : ''}
      FROM tasks t
      LEFT JOIN subjects s ON s.id = t.subject_id
      LEFT JOIN users u ON u.id = t.teacher_id
      ${where}
      ORDER BY t.created_at DESC
    `;

    const result = await pool.query(query, params);
    res.json({ success: true, tasks: result.rows });
  } catch (err) {
    console.error('getTasks xato:', err);
    res.status(500).json({ success: false, message: 'Server xatosi.' });
  }
};

// GET /api/tasks/:id
exports.getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    const taskRes = await pool.query(
      `SELECT t.*, s.name AS subject_name, s.icon AS subject_icon
       FROM tasks t
       LEFT JOIN subjects s ON s.id = t.subject_id
       WHERE t.id = $1`,
      [id]
    );

    if (!taskRes.rows.length) {
      return res.status(404).json({ success: false, message: 'Topshiriq topilmadi.' });
    }

    const subsRes = await pool.query(
      `SELECT ts.*, u.full_name AS student_name, u.class_name AS student_class
       FROM task_submissions ts
       JOIN users u ON u.id = ts.student_id
       WHERE ts.task_id = $1
       ORDER BY ts.submitted_at DESC`,
      [id]
    );

    res.json({ success: true, task: taskRes.rows[0], submissions: subsRes.rows });
  } catch (err) {
    console.error('getTaskById xato:', err);
    res.status(500).json({ success: false, message: 'Server xatosi.' });
  }
};

// POST /api/tasks (teacher / admin)
exports.createTask = async (req, res) => {
  try {
    const { title, description, subject_id, class_name, deadline, max_score } = req.body;
    if (!title || !subject_id) {
      return res.status(400).json({ success: false, message: 'Sarlavha va fan tanlanishi shart.' });
    }

    const result = await pool.query(
      `INSERT INTO tasks (title, description, subject_id, teacher_id, class_name, deadline, max_score)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        title,
        description || null,
        subject_id,
        req.user.id,
        class_name || null,
        deadline || null,
        max_score ? parseInt(max_score) : 100
      ]
    );

    res.status(201).json({ success: true, message: 'Topshiriq yaratildi!', task: result.rows[0] });
  } catch (err) {
    console.error('createTask xato:', err);
    res.status(500).json({ success: false, message: 'Server xatosi.' });
  }
};

// POST /api/tasks/:id/submit (student)
exports.submitTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, file_url } = req.body;
    if (!content) {
      return res.status(400).json({ success: false, message: 'Javob matni kiritilishi kerak.' });
    }

    const result = await pool.query(
      `INSERT INTO task_submissions (task_id, student_id, content, file_url, submitted_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (task_id, student_id)
       DO UPDATE SET content = $3, file_url = $4, submitted_at = NOW()
       RETURNING *`,
      [id, req.user.id, content, file_url || null]
    );

    res.json({ success: true, message: 'Topshiriq topshirildi!', submission: result.rows[0] });
  } catch (err) {
    console.error('submitTask xato:', err);
    res.status(500).json({ success: false, message: 'Server xatosi.' });
  }
};

// DELETE /api/tasks/:id (teacher / admin)
exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const taskRes = await pool.query('SELECT teacher_id FROM tasks WHERE id = $1', [id]);
    if (!taskRes.rows.length) {
      return res.status(404).json({ success: false, message: 'Topshiriq topilmadi.' });
    }
    if (req.user.role !== 'admin' && taskRes.rows[0].teacher_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Ruxsat yo\'q.' });
    }

    await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
    res.json({ success: true, message: 'Topshiriq o\'chirildi.' });
  } catch (err) {
    console.error('deleteTask xato:', err);
    res.status(500).json({ success: false, message: 'Server xatosi.' });
  }
};
