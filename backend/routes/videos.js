// ===== routes/videos.js =====
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/videoController');
const { authenticate, authorize } = require('../middleware/auth');
const { uploadVideo, uploadThumbnail } = require('../config/cloudinary');
const multer  = require('multer');

const videoUploadFields = multer({
  storage: require('../config/cloudinary').uploadVideo.storage,
  limits: { fileSize: 500 * 1024 * 1024 }
}).fields([
  { name: 'video',     maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 },
]);

router.get('/',               authenticate, ctrl.getVideos);
router.get('/:id',            authenticate, ctrl.getVideoById);
router.post('/',              authenticate, authorize('teacher','admin'), videoUploadFields, ctrl.createVideo);
router.put('/:id',            authenticate, authorize('teacher','admin'), videoUploadFields, ctrl.updateVideo);
router.delete('/:id',         authenticate, authorize('teacher','admin'), ctrl.deleteVideo);
router.post('/:id/progress',  authenticate, authorize('student'), ctrl.saveProgress);

module.exports = router;
