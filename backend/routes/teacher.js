const express = require('express');
const router  = express.Router();
const gradeCtrl   = require('../controllers/gradeController');
const attCtrl     = require('../controllers/attendanceController');
const subjectCtrl = require('../controllers/subjectController');
const teacherCtrl = require('../controllers/teacherController');
const { authenticate, authorize } = require('../middleware/auth');

const teacherOrAdmin = [authenticate, authorize('teacher', 'admin')];

// O'qituvchi fanlari (Multi-subject)
router.get('/subjects', ...teacherOrAdmin, subjectCtrl.getTeacherSubjects);

// O'qituvchi sinflari va o'quvchilari (Baholash)
router.get('/classes',  ...teacherOrAdmin, gradeCtrl.getTeacherClasses);
router.get('/students', ...teacherOrAdmin, gradeCtrl.getTeacherStudents);
router.post('/grades',  ...teacherOrAdmin, gradeCtrl.submitGrade);

// O'qituvchi davomati (Attendance)
router.get('/attendance-classes',  ...teacherOrAdmin, attCtrl.getTeacherAttendanceClasses);
router.get('/attendance-students', ...teacherOrAdmin, attCtrl.getTeacherAttendanceStudents);

// Sinf rahbarligi ('Mening sinfim')
router.get('/my-class', ...teacherOrAdmin, teacherCtrl.getMyClass);

module.exports = router;

