const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/subjectController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/student/subjects', authenticate, ctrl.getStudentSubjects);
router.get('/',                  authenticate, ctrl.getSubjects);
router.post('/',                 authenticate, authorize('admin'), ctrl.createSubject);
router.put('/:id',               authenticate, authorize('admin'), ctrl.updateSubject);
router.delete('/:id',            authenticate, authorize('admin'), ctrl.deleteSubject);

module.exports = router;
