const express = require('express');
const router = express.Router();
const {
    getArticles, getArticle, createArticle, updateArticle, deleteArticle, getAdminArticles,
} = require('../controllers/articleController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public routes
router.get('/', getArticles);
router.get('/:id', getArticle);

// Admin-only routes
router.get('/admin/all', protect, authorize('admin'), getAdminArticles);
router.post('/', protect, authorize('admin'), createArticle);
router.put('/:id', protect, authorize('admin'), updateArticle);
router.delete('/:id', protect, authorize('admin'), deleteArticle);

module.exports = router;
