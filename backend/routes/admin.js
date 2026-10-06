// ===== routes/admin.js =====
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

const adminOnly = [authenticate, authorize('admin')];
const adminOrTeacher = [authenticate, authorize('admin', 'teacher')];

router.get('/users',                    ...adminOrTeacher, ctrl.getUsers);
router.post('/users',                   ...adminOnly, ctrl.createUser);
router.put('/users/:id',                  ...adminOnly, ctrl.updateUser);
router.put('/users/:id/toggle-active',  ...adminOnly, ctrl.toggleActive);
router.put('/users/:id/reset-password', ...adminOnly, ctrl.resetPassword);
router.delete('/users/:id',             ...adminOnly, ctrl.deleteUser);
router.get('/stats',                    ...adminOnly, ctrl.getStats);

// ── Dars biriktirish (Assign Class) ──
router.post('/assign-class',            ...adminOnly, ctrl.assignClass);
router.get('/assignments',              ...adminOnly, ctrl.getAssignments);
router.delete('/assignments/:id',       ...adminOnly, ctrl.deleteAssignment);
router.get('/teachers/:id/teaching-info', ...adminOnly, ctrl.getTeacherTeachingInfo);

// ── Dars jadvali (Schedules) ──
const scheduleCtrl = require('../controllers/scheduleController');
router.post('/schedules',               ...adminOnly, scheduleCtrl.createSchedule);
router.delete('/schedules/:id',         ...adminOnly, scheduleCtrl.deleteSchedule);

// ── Fanlar (Subjects) ──
const subjectCtrl = require('../controllers/subjectController');
router.get('/subjects',                 ...adminOrTeacher, subjectCtrl.getSubjects);

module.exports = router;
