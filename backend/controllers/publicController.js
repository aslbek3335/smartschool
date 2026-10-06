const pool = require('../config/db');

// ──────────────────────────────────────────
// GET /api/public/landing-stats
// Ochiq API (Xavfsizlik tokenini talab qilmaydi)
// ──────────────────────────────────────────
exports.getLandingStats = async (req, res) => {
  try {
    let students = 0;
    let teachers = 0;
    let videos = 0;

    // 1. O'quvchilar soni (bo'sh yoki xato bo'lsa 0)
    try {
      const studentsRes = await pool.query("SELECT COUNT(*) FROM users WHERE role = 'student'");
      students = parseInt(studentsRes.rows[0]?.count, 10) || 0;
    } catch (error) {
      console.error("O'quvchilar sonini olishda xatolik:", error.message);
    }

    // 2. O'qituvchilar soni (bo'sh yoki xato bo'lsa 0)
    try {
      const teachersRes = await pool.query("SELECT COUNT(*) FROM users WHERE role = 'teacher'");
      teachers = parseInt(teachersRes.rows[0]?.count, 10) || 0;
    } catch (error) {
      console.error("O'qituvchilar sonini olishda xatolik:", error.message);
    }

    // 3. Videolar soni (jadval bo'sh yoki mavjud bo'lmasa 0)
    try {
      const videosRes = await pool.query("SELECT COUNT(*) FROM videos");
      videos = parseInt(videosRes.rows[0]?.count, 10) || 0;
    } catch (error) {
      console.error("Videolar sonini olishda xatolik:", error.message);
    }

    const satisfaction = 98; // Mamnunlik ko'rsatkichi

    return res.json({
      success: true,
      students,
      teachers,
      videos,
      satisfaction
    });
  } catch (error) {
    console.error("getLandingStats umumiy server xatosi:", error);
    return res.status(500).json({
      success: false,
      message: "Statistikalarni olishda xatolik yuz berdi.",
      students: 0,
      teachers: 0,
      videos: 0,
      satisfaction: 98
    });
  }
};
