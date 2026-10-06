const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/scheduleController');
const { authenticate, authorize } = require('../middleware/auth');

const adminOnly = [authenticate, authorize('admin')];
const loggedIn  = [authenticate];

// Admin amallari
router.post('/admin',     ...adminOnly, ctrl.createSchedule);
router.delete('/admin/:id', ...adminOnly, ctrl.deleteSchedule);

// Ko'rish API lari (O'quvchi va O'qituvchilar uchun)
router.get('/class/:class_id',     ...loggedIn, ctrl.getClassSchedule);
router.get('/teacher/:teacher_id', ...loggedIn, ctrl.getTeacherSchedule);

module.exports = router;
