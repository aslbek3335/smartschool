const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/gradeController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, ctrl.getGrades);
router.post('/', authenticate, ctrl.submitGrade);

module.exports = router;
