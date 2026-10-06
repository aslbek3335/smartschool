const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/quizController');
const { authenticate, authorize } = require('../middleware/auth');

// Barcha testlarni olish (Hamma faol foydalanuvchilar)
router.get('/', authenticate, ctrl.getQuizzes);

// Testning savollarini olish
router.get('/:id/questions', authenticate, ctrl.getQuizQuestions);

// Yangi test yaratish (Faqat o'qituvchi va admin)
router.post('/', authenticate, authorize('teacher', 'admin'), ctrl.createQuiz);

// Testga savol qo'shish (Faqat o'qituvchi va admin)
router.post('/:id/questions', authenticate, authorize('teacher', 'admin'), ctrl.addQuestion);

// Test yechib topshirish (Faqat o'quvchi)
router.post('/:id/submit', authenticate, authorize('student'), ctrl.submitQuiz);

// Test natijalarini ko'rish (Faqat o'qituvchi va admin)
router.get('/:id/results', authenticate, authorize('teacher', 'admin'), ctrl.getQuizResults);

// Testni o'chirish (Faqat o'qituvchi va admin)
router.delete('/:id', authenticate, authorize('teacher', 'admin'), ctrl.deleteQuiz);

module.exports = router;
