const pool           = require('../config/db');
const { cloudinary } = require('../config/cloudinary');
const { getStudentClassInfo } = require('./studentController');

// ──────────────────────────────────────────
// GET /api/videos?subject_id=&search=
// ──────────────────────────────────────────
exports.getVideos = async (req, res) => {
  try {
    const { subject_id, search, page = 1, limit = 12 } = req.query;
    const offset = (page - 1) * limit;
    const params = [];
    let where = 'WHERE 1=1';

    if (req.user?.role === 'student') {
      where += ' AND v.is_published = TRUE';
      const studentClassInfo = await getStudentClassInfo(req.user);
      const sClassId = studentClassInfo.id;
      const sGrade = studentClassInfo.grade_level;
      const isPrimary = sGrade <= 4;

      params.push(sClassId, sGrade);
      const pClassIdIdx = params.length - 1;
      const pGradeIdx = params.length;

      where += ` AND (
        v.target_class_id = $${pClassIdIdx}
        OR v.class_id = $${pClassIdIdx}
        OR v.grade_level = $${pGradeIdx}
        OR (v.target_class_id IS NULL AND v.class_id IS NULL AND v.grade_level IS NULL)
      )`;

      if (isPrimary) {
        where += ` AND (s.is_primary = TRUE OR s.grade_range IN ('primary', 'both'))
                   AND LOWER(s.name) NOT IN ('fizika', 'kimyo', 'biologiya', 'geometriya', 'algebra', 'astronomiya', 'robototexnika', 'geografiya')`;
      } else {
        where += ` AND (s.grade_range IN ('secondary', 'both') OR s.is_primary = FALSE)
                   AND LOWER(s.name) NOT IN ('o''qish', 'tabiatshunoslik', 'boshlang''ich ta''lim fanlari')`;
      }
    } else if (req.user?.role === 'teacher') {
      params.push(req.user.id);
      where += ` AND (v.teacher_id = $${params.length})`;
    }

    if (subject_id) { params.push(subject_id); where += ` AND v.subject_id=$${params.length}`; }
    if (search)     { params.push(`%${search}%`); where += ` AND (v.title ILIKE $${params.length} OR v.description ILIKE $${params.length})`; }

    params.push(limit, offset);
    const result = await pool.query(
      `SELECT v.*, s.name AS subject_name, s.icon AS subject_icon, s.color AS subject_color,
              u.full_name AS teacher_name, u.avatar_url AS teacher_avatar
       FROM videos v
       LEFT JOIN subjects s ON s.id = v.subject_id
       LEFT JOIN users    u ON u.id = v.teacher_id
       ${where}
       ORDER BY v.created_at DESC
       LIMIT $${params.length-1} OFFSET $${params.length}`,
      params
    );

    const countRes = await pool.query(
      `SELECT COUNT(*) FROM videos v LEFT JOIN subjects s ON s.id = v.subject_id ${where}`,
      params.slice(0, -2)
    );

    res.json({ success: true, videos: result.rows, total: parseInt(countRes.rows[0].count), page: parseInt(page) });
  } catch (err) {
    console.error('getVideos xato:', err);
    res.status(500).json({ success: false, message: 'Server xatosi.' });
  }
};

// ──────────────────────────────────────────
// GET /api/videos/:id
// ──────────────────────────────────────────
exports.getVideoById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT v.*, s.name AS subject_name, s.icon AS subject_icon,
              u.full_name AS teacher_name, u.avatar_url AS teacher_avatar
       FROM videos v
       LEFT JOIN subjects s ON s.id = v.subject_id
       LEFT JOIN users    u ON u.id = v.teacher_id
       WHERE v.id = $1`,
      [id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Video topilmadi.' });

    await pool.query('UPDATE videos SET views = views + 1 WHERE id=$1', [id]);

    // Ko'rish progressi
    let viewProgress = null;
    if (req.user?.role === 'student') {
      const vv = await pool.query(
        'SELECT * FROM video_views WHERE student_id=$1 AND video_id=$2',
        [req.user.id, id]
      );
      viewProgress = vv.rows[0] || null;
    }

    res.json({ success: true, video: result.rows[0], viewProgress });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server xatosi.' });
  }
};

// ──────────────────────────────────────────
// POST /api/videos   (teacher/admin)
// Multer fields: video + thumbnail (ixtiyoriy)
// ──────────────────────────────────────────
exports.createVideo = async (req, res) => {
  try {
    const { title, description, subject_id, duration_sec, target_class_id, class_id, grade_level } = req.body;
    if (!title || !subject_id) {
      return res.status(400).json({ success: false, message: 'Sarlavha va fan majburiy.' });
    }
    if (!req.files?.video?.[0]) {
      return res.status(400).json({ success: false, message: 'Video fayl yuklash shart.' });
    }

    const videoFile     = req.files.video[0];
    const thumbnailFile = req.files?.thumbnail?.[0];

    const isPublished = req.body.is_published !== undefined ? req.body.is_published : true;

    // Sinf va darajani aniqlash
    const targetClassIdVal = (target_class_id || class_id) ? parseInt(target_class_id || class_id) : null;
    let gradeLevelVal = grade_level ? parseInt(grade_level) : null;
    if (targetClassIdVal && !gradeLevelVal) {
      const cRes = await pool.query('SELECT grade_level FROM classes WHERE id = $1', [targetClassIdVal]);
      if (cRes.rows.length) {
        gradeLevelVal = cRes.rows[0].grade_level;
      }
    }

    const path = require('path');
    const videoUrl = videoFile.path.startsWith('http') 
      ? videoFile.path 
      : `/uploads/${path.basename(videoFile.path)}`;
    const thumbnailUrl = thumbnailFile 
      ? (thumbnailFile.path.startsWith('http') ? thumbnailFile.path : `/uploads/${path.basename(thumbnailFile.path)}`) 
      : null;

    const result = await pool.query(
      `INSERT INTO videos
        (title, description, subject_id, teacher_id, video_url, video_public_id,
         thumbnail_url, thumbnail_public_id, duration_sec, is_published,
         target_class_id, class_id, grade_level)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [
        title, description, subject_id, req.user.id,
        videoUrl, videoFile.filename,
        thumbnailUrl, thumbnailFile?.filename || null,
        duration_sec || 0,
        isPublished,
        targetClassIdVal, targetClassIdVal, gradeLevelVal
      ]
    );

    res.status(201).json({ success: true, message: 'Video yuklandi!', video: result.rows[0] });
  } catch (err) {
    console.error('createVideo xato:', err);
    res.status(500).json({ success: false, message: 'Server xatosi.' });
  }
};

// ──────────────────────────────────────────
// PUT /api/videos/:id
// ──────────────────────────────────────────
exports.updateVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, is_published, duration_sec, target_class_id, class_id, grade_level } = req.body;

    const check = await pool.query('SELECT teacher_id FROM videos WHERE id=$1', [id]);
    if (!check.rows.length) return res.status(404).json({ success: false, message: 'Video topilmadi.' });
    if (req.user.role !== 'admin' && check.rows[0].teacher_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Ruxsat yo\'q.' });
    }

    let thumbnail_url = undefined, thumbnail_public_id = undefined;
    if (req.files?.thumbnail?.[0]) {
      const old = await pool.query('SELECT thumbnail_public_id FROM videos WHERE id=$1', [id]);
      if (old.rows[0]?.thumbnail_public_id) {
        await cloudinary.uploader.destroy(old.rows[0].thumbnail_public_id);
      }
      thumbnail_url       = req.files.thumbnail[0].path;
      thumbnail_public_id = req.files.thumbnail[0].filename;
    }

    const targetClassIdVal = (target_class_id !== undefined || class_id !== undefined)
      ? (target_class_id || class_id ? parseInt(target_class_id || class_id) : null)
      : undefined;
    let gradeLevelVal = grade_level !== undefined ? (grade_level ? parseInt(grade_level) : null) : undefined;

    if (targetClassIdVal && gradeLevelVal === undefined) {
      const cRes = await pool.query('SELECT grade_level FROM classes WHERE id = $1', [targetClassIdVal]);
      if (cRes.rows.length) {
        gradeLevelVal = cRes.rows[0].grade_level;
      }
    }

    const result = await pool.query(
      `UPDATE videos SET
        title        = COALESCE($1, title),
        description  = COALESCE($2, description),
        is_published = COALESCE($3, is_published),
        duration_sec = COALESCE($4, duration_sec),
        thumbnail_url       = COALESCE($5, thumbnail_url),
        thumbnail_public_id = COALESCE($6, thumbnail_public_id),
        target_class_id     = COALESCE($7, target_class_id),
        class_id            = COALESCE($8, class_id),
        grade_level         = COALESCE($9, grade_level)
       WHERE id=$10 RETURNING *`,
      [title, description, is_published, duration_sec, thumbnail_url, thumbnail_public_id, targetClassIdVal, targetClassIdVal, gradeLevelVal, id]
    );

    res.json({ success: true, message: 'Video yangilandi!', video: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server xatosi.' });
  }
};

// ──────────────────────────────────────────
// DELETE /api/videos/:id
// ──────────────────────────────────────────
exports.deleteVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const video = await pool.query('SELECT * FROM videos WHERE id=$1', [id]);
    if (!video.rows.length) return res.status(404).json({ success: false, message: 'Video topilmadi.' });
    if (req.user.role !== 'admin' && video.rows[0].teacher_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Ruxsat yo\'q.' });
    }

    // Cloudinary'dan o'chirish
    if (video.rows[0].video_public_id) {
      await cloudinary.uploader.destroy(video.rows[0].video_public_id, { resource_type: 'video' });
    }
    if (video.rows[0].thumbnail_public_id) {
      await cloudinary.uploader.destroy(video.rows[0].thumbnail_public_id);
    }

    await pool.query('DELETE FROM videos WHERE id=$1', [id]);
    res.json({ success: true, message: 'Video o\'chirildi.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server xatosi.' });
  }
};

// ──────────────────────────────────────────
// POST /api/videos/:id/progress  (student)
// ──────────────────────────────────────────
exports.saveProgress = async (req, res) => {
  try {
    const { watched_sec, is_done } = req.body;
    await pool.query(
      `INSERT INTO video_views (student_id, video_id, watched_sec, is_done, viewed_at)
       VALUES ($1,$2,$3,$4,NOW())
       ON CONFLICT (student_id, video_id)
       DO UPDATE SET watched_sec=$3, is_done=$4, viewed_at=NOW()`,
      [req.user.id, req.params.id, watched_sec || 0, is_done || false]
    );
    res.json({ success: true, message: 'Progress saqlandi.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server xatosi.' });
  }
};
