// ===== routes/videos.js =====
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/videoController');
const { authenticate, authorize } = require('../middleware/auth');
router.get('/',               authenticate, ctrl.getVideos);
router.get('/:id',            authenticate, ctrl.getVideoById);
router.post('/',              authenticate, authorize('teacher','admin'), ctrl.createVideo);
router.put('/:id',            authenticate, authorize('teacher','admin'), ctrl.updateVideo);
router.delete('/:id',         authenticate, authorize('teacher','admin'), ctrl.deleteVideo);
router.post('/:id/progress',  authenticate, authorize('student'), ctrl.saveProgress);

module.exports = router;
