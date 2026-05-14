const express = require('express');
const router = express.Router();
const { getChat, sendMessage, sendMedia, getInbox, getUnreadCount } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

// Lazy-load upload middleware (supports images, videos, PDFs)
let uploadMiddleware;
const getUpload = () => {
    if (!uploadMiddleware) {
        const multer = require('multer');
        const path = require('path');
        const fs = require('fs');

        // Check if Cloudinary is configured
        const isCloudinaryConfigured =
            process.env.CLOUDINARY_CLOUD_NAME &&
            process.env.CLOUDINARY_API_KEY &&
            process.env.CLOUDINARY_API_SECRET &&
            process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name';

        if (isCloudinaryConfigured) {
            const cloudinaryLib = require('cloudinary').v2;
            const { CloudinaryStorage } = require('multer-storage-cloudinary');
            const storage = new CloudinaryStorage({
                cloudinary: cloudinaryLib,
                params: {
                    folder: 'telehealth/chat',
                    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'mp4', 'mov', 'webm'],
                    resource_type: 'auto',
                },
            });
            uploadMiddleware = multer({
                storage,
                limits: { fileSize: 20 * 1024 * 1024 }, // 20MB for video
            });
        } else {
            const uploadDir = path.join(__dirname, '../uploads');
            if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
            const storage = multer.diskStorage({
                destination: (req, file, cb) => cb(null, uploadDir),
                filename: (req, file, cb) => {
                    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
                    cb(null, `chat-${unique}${path.extname(file.originalname)}`);
                },
            });
            uploadMiddleware = multer({
                storage,
                limits: { fileSize: 20 * 1024 * 1024 },
            });
        }
    }
    return uploadMiddleware;
};

router.use(protect);

router.get('/inbox', getInbox);
router.get('/unread', getUnreadCount);
router.get('/:appointmentId', getChat);
router.post('/:appointmentId/messages', sendMessage);
router.post('/:appointmentId/media', (req, res, next) => {
    getUpload().single('file')(req, res, next);
}, sendMedia);

module.exports = router;
