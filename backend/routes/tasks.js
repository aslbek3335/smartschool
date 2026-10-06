const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/taskController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/',               authenticate, ctrl.getTasks);
router.get('/:id',            authenticate, ctrl.getTaskById);
router.post('/',              authenticate, authorize('teacher', 'admin'), ctrl.createTask);
router.post('/:id/submit',     authenticate, authorize('student'), ctrl.submitTask);
router.delete('/:id',          authenticate, authorize('teacher', 'admin'), ctrl.deleteTask);

module.exports = router;
