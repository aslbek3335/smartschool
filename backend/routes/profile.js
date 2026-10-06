const express = require('express');
const router  = express.Router();
const { getProfile, updateProfile, uploadAvatar, changePassword } = require('../controllers/profileController');
const { authenticate } = require('../middleware/auth');
const { uploadAvatar: multerAvatar } = require('../config/cloudinary');

router.get('/me',              authenticate, getProfile);
router.get('/:id',             authenticate, getProfile);
router.put('/update',          authenticate, updateProfile);
router.put('/change-password', authenticate, changePassword);
router.post('/avatar',         authenticate, multerAvatar.single('avatar'), uploadAvatar);

module.exports = router;
