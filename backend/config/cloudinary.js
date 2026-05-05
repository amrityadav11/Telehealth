const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Check if Cloudinary is configured
const isCloudinaryConfigured =
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET &&
    process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name';

let cloudinary = null;
let upload;

if (isCloudinaryConfigured) {
    // Use Cloudinary storage
    const cloudinaryLib = require('cloudinary').v2;
    const { CloudinaryStorage } = require('multer-storage-cloudinary');

    cloudinaryLib.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    cloudinary = cloudinaryLib;

    const storage = new CloudinaryStorage({
        cloudinary: cloudinaryLib,
        params: {
            folder: 'telemedicine',
            allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
            transformation: [{ width: 500, height: 500, crop: 'limit' }],
        },
    });

    upload = multer({
        storage,
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter: (req, file, cb) => {
            const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
            if (allowed.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new Error('Only JPEG, PNG, and PDF files are allowed'), false);
            }
        },
    });

    console.log('☁️  Cloudinary storage configured');
} else {
    // Fallback: local disk storage
    const storage = multer.diskStorage({
        destination: (req, file, cb) => cb(null, uploadDir),
        filename: (req, file, cb) => {
            const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
            cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
        },
    });

    upload = multer({
        storage,
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter: (req, file, cb) => {
            const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
            if (allowed.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new Error('Only JPEG, PNG, and PDF files are allowed'), false);
            }
        },
    });

    console.log('📁 Local disk storage configured (Cloudinary not set up)');
}

module.exports = { cloudinary, upload };
