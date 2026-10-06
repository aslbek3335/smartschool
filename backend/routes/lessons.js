const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/lessonController');
const { authenticate, authorize } = require('../middleware/auth');
const { uploadLesson } = require('../config/cloudinary');

router.get('/',              authenticate, ctrl.getLessons);
router.get('/:id',           authenticate, ctrl.getLessonById);
router.post('/',             authenticate, authorize('teacher','admin'), uploadLesson.single('file'), ctrl.createLesson);
router.put('/:id',           authenticate, authorize('teacher','admin'), uploadLesson.single('file'), ctrl.updateLesson);
router.delete('/:id',        authenticate, authorize('teacher','admin'), ctrl.deleteLesson);
router.post('/:id/complete', authenticate, authorize('student'), ctrl.markComplete);

module.exports = router;
