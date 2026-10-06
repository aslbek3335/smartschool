const pool = require('../config/db');

// ──────────────────────────────────────────
// POST /api/quizzes   (teacher/admin)
// Create a new quiz
// ──────────────────────────────────────────
exports.createQuiz = async (req, res) => {
  try {
    const { title, description, subject_id } = req.body;
    if (!title || !subject_id) {
      return res.status(400).json({ success: false, message: 'Sarlavha va fan majburiy.' });
    }

    const result = await pool.query(
      `INSERT INTO quizzes (title, description, subject_id, teacher_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [title, description, subject_id, req.user.id]
    );

    res.status(201).json({ success: true, message: 'Test yaratildi!', quiz: result.rows[0] });
  } catch (err) {
    console.error('createQuiz xato:', err);
    res.status(500).json({ success: false, message: 'Server xatosi.' });
  }
};

// ──────────────────────────────────────────
// POST /api/quizzes/:id/questions   (teacher/admin)
// Add a question to a quiz
// ──────────────────────────────────────────
exports.addQuestion = async (req, res) => {
  try {
    const { id } = req.params; // quiz_id
    const { question_text, options, correct_option } = req.body;

    if (!question_text || !options || correct_option === undefined) {
      return res.status(400).json({ success: false, message: 'Savol matni, variantlar va to\'g\'ri javob majburiy.' });
    }

    if (!Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ success: false, message: 'Variantlar kamida 2 ta bo\'lishi kerak.' });
    }

    const correctOptIdx = parseInt(correct_option);
    if (isNaN(correctOptIdx) || correctOptIdx < 0 || correctOptIdx >= options.length) {
      return res.status(400).json({ success: false, message: 'To\'g\'ri javob indeksi noto\'g\'ri.' });
    }

    // Quiz mavjudligini va foydalanuvchi ruxsatini tekshirish
    const quizCheck = await pool.query('SELECT teacher_id FROM quizzes WHERE id = $1', [id]);
    if (!quizCheck.rows.length) {
      return res.status(404).json({ success: false, message: 'Test topilmadi.' });
    }

    if (req.user.role !== 'admin' && quizCheck.rows[0].teacher_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Sizda bu testga savol qo\'shish huquqi yo\'q.' });
    }

    const result = await pool.query(
      `INSERT INTO questions (quiz_id, question_text, options, correct_option)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id, question_text, JSON.stringify(options), correctOptIdx]
    );

    res.status(201).json({ success: true, message: 'Savol qo\'shildi!', question: result.rows[0] });
  } catch (err) {
    console.error('addQuestion xato:', err);
    res.status(500).json({ success: false, message: 'Server xatosi.' });
  }
};

// ──────────────────────────────────────────
// GET /api/quizzes?subject_id=
// Get list of all quizzes
// ──────────────────────────────────────────
exports.getQuizzes = async (req, res) => {
  try {
    const { subject_id } = req.query;
    const params = [req.user.id];
    let where = '';

    if (subject_id) {
      params.push(subject_id);
      where = ` AND q.subject_id = $2`;
    }

    const result = await pool.query(
      `SELECT q.*, s.name AS subject_name, s.icon AS subject_icon, s.color AS subject_color,
              u.full_name AS teacher_name,
              qa.score AS my_score, qa.percentage AS my_percentage, qa.attempted_at AS my_attempted_at,
              (SELECT COUNT(*)::int FROM questions WHERE quiz_id = q.id) AS question_count
       FROM quizzes q
       LEFT JOIN subjects s ON s.id = q.subject_id
       LEFT JOIN users    u ON u.id = q.teacher_id
       LEFT JOIN quiz_attempts qa ON qa.quiz_id = q.id AND qa.student_id = $1
       WHERE 1=1 ${where}
       ORDER BY q.created_at DESC`,
      params
    );

    res.json({ success: true, quizzes: result.rows });
  } catch (err) {
    console.error('getQuizzes xato:', err);
    res.status(500).json({ success: false, message: 'Server xatosi.' });
  }
};

// ──────────────────────────────────────────
// GET /api/quizzes/:id/questions
// Get questions of a quiz
// ──────────────────────────────────────────
exports.getQuizQuestions = async (req, res) => {
  try {
    const { id } = req.params;

    const quizCheck = await pool.query('SELECT * FROM quizzes WHERE id = $1', [id]);
    if (!quizCheck.rows.length) {
      return res.status(404).json({ success: false, message: 'Test topilmadi.' });
    }

    // Agar o'quvchi bo'lsa, correct_option yashiriladi
    let queryStr = '';
    if (req.user.role === 'student') {
      queryStr = 'SELECT id, quiz_id, question_text, options FROM questions WHERE quiz_id = $1 ORDER BY id ASC';
    } else {
      queryStr = 'SELECT id, quiz_id, question_text, options, correct_option FROM questions WHERE quiz_id = $1 ORDER BY id ASC';
    }

    const result = await pool.query(queryStr, [id]);
    res.json({ success: true, quiz: quizCheck.rows[0], questions: result.rows });
  } catch (err) {
    console.error('getQuizQuestions xato:', err);
    res.status(500).json({ success: false, message: 'Server xatosi.' });
  }
};

// ──────────────────────────────────────────
// POST /api/quizzes/:id/submit   (student)
// Submit quiz answers and calculate results
// ──────────────────────────────────────────
exports.submitQuiz = async (req, res) => {
  try {
    const { id } = req.params; // quiz_id
    const { answers } = req.body; // e.g. { "question_id": selected_option_index }

    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({ success: false, message: 'Javoblar yuborilmadi.' });
    }

    // Savollarni bazadan olish
    const questionsResult = await pool.query(
      'SELECT id, correct_option FROM questions WHERE quiz_id = $1',
      [id]
    );

    const questions = questionsResult.rows;
    if (!questions.length) {
      return res.status(400).json({ success: false, message: 'Ushbu testda savollar mavjud emas.' });
    }

    let score = 0;
    const totalQuestions = questions.length;

    // Har bir savolni tekshirish
    questions.forEach(q => {
      const studentAnswer = answers[q.id];
      if (studentAnswer !== undefined && parseInt(studentAnswer) === q.correct_option) {
        score++;
      }
    });

    const percentage = parseFloat(((score / totalQuestions) * 100).toFixed(2));

    // Natijani quiz_attempts jadvaliga yozish
    await pool.query(
      `INSERT INTO quiz_attempts (quiz_id, student_id, score, total_questions, percentage, attempted_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (student_id, quiz_id)
       DO UPDATE SET score = EXCLUDED.score,
                     total_questions = EXCLUDED.total_questions,
                     percentage = EXCLUDED.percentage,
                     attempted_at = NOW()`,
      [id, req.user.id, score, totalQuestions, percentage]
    );

    res.json({
      success: true,
      message: 'Test topshirildi!',
      result: {
        score,
        total_questions: totalQuestions,
        percentage
      }
    });
  } catch (err) {
    console.error('submitQuiz xato:', err);
    res.status(500).json({ success: false, message: 'Server xatosi.' });
  }
};

// ──────────────────────────────────────────
// GET /api/quizzes/:id/results   (teacher/admin)
// Get list of student attempts for a quiz
// ──────────────────────────────────────────
exports.getQuizResults = async (req, res) => {
  try {
    const { id } = req.params;

    // Quiz kimga tegishli ekanini tekshirish
    const quizCheck = await pool.query('SELECT teacher_id FROM quizzes WHERE id = $1', [id]);
    if (!quizCheck.rows.length) {
      return res.status(404).json({ success: false, message: 'Test topilmadi.' });
    }

    if (req.user.role !== 'admin' && quizCheck.rows[0].teacher_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Ruxsat berilmagan.' });
    }

    const result = await pool.query(
      `SELECT qa.*, u.full_name AS student_name, u.class_name AS student_class
       FROM quiz_attempts qa
       JOIN users u ON u.id = qa.student_id
       WHERE qa.quiz_id = $1
       ORDER BY qa.attempted_at DESC`,
      [id]
    );

    res.json({ success: true, results: result.rows });
  } catch (err) {
    console.error('getQuizResults xato:', err);
    res.status(500).json({ success: false, message: 'Server xatosi.' });
  }
};

// ──────────────────────────────────────────
// DELETE /api/quizzes/:id   (teacher/admin)
// Delete a quiz
// ──────────────────────────────────────────
exports.deleteQuiz = async (req, res) => {
  try {
    const { id } = req.params;

    const quizCheck = await pool.query('SELECT teacher_id FROM quizzes WHERE id = $1', [id]);
    if (!quizCheck.rows.length) {
      return res.status(404).json({ success: false, message: 'Test topilmadi.' });
    }

    if (req.user.role !== 'admin' && quizCheck.rows[0].teacher_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Ruxsat berilmagan.' });
    }

    await pool.query('DELETE FROM quizzes WHERE id = $1', [id]);
    res.json({ success: true, message: 'Test muvaffaqiyatli o\'chirildi.' });
  } catch (err) {
    console.error('deleteQuiz xato:', err);
    res.status(500).json({ success: false, message: 'Server xatosi.' });
  }
};
