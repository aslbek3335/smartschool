const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/attendanceController');
const { authenticate, authorize } = require('../middleware/auth');

const teacherOrAdmin = [authenticate, authorize('teacher', 'admin')];

router.get('/classes',   ...teacherOrAdmin, ctrl.getTeacherClasses);
router.get('/my-class',  authenticate, ctrl.getMyClass);
router.get('/',          ...teacherOrAdmin, ctrl.getAttendance);
router.post('/',         ...teacherOrAdmin, ctrl.saveAttendance);

module.exports = router;
