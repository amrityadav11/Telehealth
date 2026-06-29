const asyncHandler = require('express-async-handler');
const Article = require('../models/Article');

// @desc    Get all published articles (with search + category filter)
// @route   GET /api/articles
// @access  Public
const getArticles = asyncHandler(async (req, res) => {
    const { category, search, page = 1, limit = 12 } = req.query;

    const filter = { isPublished: true };
    if (category && category !== 'All') filter.category = category;
    if (search) {
        filter.$or = [
            { title: { $regex: search, $options: 'i' } },
            { summary: { $regex: search, $options: 'i' } },
            { tags: { $in: [new RegExp(search, 'i')] } },
        ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Article.countDocuments(filter);

    const articles = await Article.find(filter)
        .populate('author', 'name avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .select('-content'); // exclude full content from list

    res.json({
        success: true,
        articles,
        total,
        pages: Math.ceil(total / Number(limit)),
        currentPage: Number(page),
    });
});

// @desc    Get single article by ID (increments views)
// @route   GET /api/articles/:id
// @access  Public
const getArticle = asyncHandler(async (req, res) => {
    const article = await Article.findByIdAndUpdate(
        req.params.id,
        { $inc: { views: 1 } },
        { new: true }
    ).populate('author', 'name avatar');

    if (!article || !article.isPublished) {
        res.status(404);
        throw new Error('Article not found');
    }

    res.json({ success: true, article });
});

// @desc    Create article (Admin only)
// @route   POST /api/articles
// @access  Private/Admin
const createArticle = asyncHandler(async (req, res) => {
    const { title, summary, content, category, tags, coverImage, isPublished } = req.body;

    const article = await Article.create({
        title,
        summary,
        content,
        category: category || 'General',
        tags: tags || [],
        coverImage: coverImage || { url: '', public_id: '' },
        author: req.user._id,
        isPublished: isPublished !== undefined ? isPublished : true,
    });

    res.status(201).json({ success: true, article });
});

// @desc    Update article (Admin only)
// @route   PUT /api/articles/:id
// @access  Private/Admin
const updateArticle = asyncHandler(async (req, res) => {
    const article = await Article.findById(req.params.id);
    if (!article) {
        res.status(404);
        throw new Error('Article not found');
    }

    const { title, summary, content, category, tags, coverImage, isPublished } = req.body;

    if (title !== undefined) article.title = title;
    if (summary !== undefined) article.summary = summary;
    if (content !== undefined) article.content = content;
    if (category !== undefined) article.category = category;
    if (tags !== undefined) article.tags = tags;
    if (coverImage !== undefined) article.coverImage = coverImage;
    if (isPublished !== undefined) article.isPublished = isPublished;

    await article.save();

    res.json({ success: true, article });
});

// @desc    Delete article (Admin only)
// @route   DELETE /api/articles/:id
// @access  Private/Admin
const deleteArticle = asyncHandler(async (req, res) => {
    const article = await Article.findById(req.params.id);
    if (!article) {
        res.status(404);
        throw new Error('Article not found');
    }

    await article.deleteOne();
    res.json({ success: true, message: 'Article deleted' });
});

// @desc    Get all articles including unpublished (Admin only)
// @route   GET /api/articles/admin/all
// @access  Private/Admin
const getAdminArticles = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const total = await Article.countDocuments();

    const articles = await Article.find()
        .populate('author', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .select('-content');

    res.json({ success: true, articles, total, pages: Math.ceil(total / Number(limit)) });
});

module.exports = { getArticles, getArticle, createArticle, updateArticle, deleteArticle, getAdminArticles };
