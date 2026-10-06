const pool = require('../config/db');

// ──────────────────────────────────────────
// GET /api/news
// ──────────────────────────────────────────
exports.getNews = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT n.id, n.title, n.content, n.category, n.event_date, n.created_at, n.author_id,
             u.full_name as author_name
      FROM news n
      LEFT JOIN users u ON n.author_id = u.id
      ORDER BY n.created_at DESC
    `);
    res.json({ success: true, news: result.rows });
  } catch (err) {
    console.error('getNews error:', err);
    res.status(500).json({ success: false, message: 'Server xatosi.' });
  }
};

// ──────────────────────────────────────────
// POST /api/news
// ──────────────────────────────────────────
exports.createNews = async (req, res) => {
  try {
    const { title, content, category, event_date } = req.body;
    const authorId = req.user.id;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Sarlavha va matnni kiriting.' });
    }

    const cat = ['urgent', 'event', 'info', 'warning'].includes(category) ? category : 'info';
    const dateVal = event_date || new Date().toISOString().split('T')[0];

    const result = await pool.query(
      `INSERT INTO news (title, content, category, event_date, author_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, title, content, category, event_date, created_at`,
      [title, content, cat, dateVal, authorId]
    );

    res.status(201).json({
      success: true,
      message: 'Yangilik / E\'lon muvaffaqiyatli joylashtirildi!',
      newsItem: result.rows[0]
    });
  } catch (err) {
    console.error('createNews error:', err);
    res.status(500).json({ success: false, message: 'Server xatosi.' });
  }
};

// ──────────────────────────────────────────
// PUT /api/news/:id
// ──────────────────────────────────────────
exports.updateNews = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, category, event_date } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Sarlavha va matnni kiriting.' });
    }

    const cat = ['urgent', 'event', 'info', 'warning'].includes(category) ? category : 'info';

    const result = await pool.query(
      `UPDATE news
       SET title = $1, content = $2, category = $3, event_date = COALESCE($4, event_date), updated_at = NOW()
       WHERE id = $5
       RETURNING id, title, content, category, event_date`,
      [title, content, cat, event_date || null, id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Yangilik topilmadi.' });
    }

    res.json({
      success: true,
      message: 'Yangilik muvaffaqiyatli yangilandi!',
      newsItem: result.rows[0]
    });
  } catch (err) {
    console.error('updateNews error:', err);
    res.status(500).json({ success: false, message: 'Server xatosi.' });
  }
};

// ──────────────────────────────────────────
// DELETE /api/news/:id
// ──────────────────────────────────────────
exports.deleteNews = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM news WHERE id = $1', [id]);
    res.json({ success: true, message: 'Yangilik o\'chirildi.' });
  } catch (err) {
    console.error('deleteNews error:', err);
    res.status(500).json({ success: false, message: 'Server xatosi.' });
  }
};
