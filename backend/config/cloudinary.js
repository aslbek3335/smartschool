const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_API_KEY && 
  !process.env.CLOUDINARY_API_KEY.includes('your_api_key') &&
  process.env.CLOUDINARY_CLOUD_NAME
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}_${Date.now()}${ext}`);
  }
});

const avatarStorage = isCloudinaryConfigured 
  ? new CloudinaryStorage({
      cloudinary,
      params: {
        folder: 'smartschool/avatars',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
      },
    })
  : diskStorage;

const lessonStorage = isCloudinaryConfigured
  ? new CloudinaryStorage({
      cloudinary,
      params: async (req, file) => ({
        folder: 'smartschool/lessons',
        allowed_formats: ['pdf'],
        resource_type: 'raw',
        public_id: `lesson_${Date.now()}`,
      }),
    })
  : diskStorage;

const videoStorage = isCloudinaryConfigured
  ? new CloudinaryStorage({
      cloudinary,
      params: async (req, file) => ({
        folder: 'smartschool/videos',
        resource_type: 'video',
        allowed_formats: ['mp4', 'mov', 'avi', 'mkv'],
        transformation: [{ quality: 'auto' }],
        public_id: `video_${Date.now()}`,
      }),
    })
  : diskStorage;

const thumbnailStorage = isCloudinaryConfigured
  ? new CloudinaryStorage({
      cloudinary,
      params: {
        folder: 'smartschool/thumbnails',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ width: 640, height: 360, crop: 'fill' }],
      },
    })
  : diskStorage;

const uploadAvatar    = multer({ storage: avatarStorage, limits: { fileSize: 10 * 1024 * 1024 } });
const uploadLesson    = multer({ storage: lessonStorage, limits: { fileSize: 100 * 1024 * 1024 } });
const uploadVideo     = multer({ storage: videoStorage,  limits: { fileSize: 500 * 1024 * 1024 } });
const uploadThumbnail = multer({ storage: thumbnailStorage, limits: { fileSize: 10 * 1024 * 1024 } });

module.exports = { cloudinary, uploadAvatar, uploadLesson, uploadVideo, uploadThumbnail };
