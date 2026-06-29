const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Title is required'],
            trim: true,
            maxlength: [200, 'Title cannot exceed 200 characters'],
        },
        slug: {
            type: String,
            unique: true,
            lowercase: true,
        },
        summary: {
            type: String,
            required: [true, 'Summary is required'],
            maxlength: [500, 'Summary cannot exceed 500 characters'],
        },
        content: {
            type: String,
            required: [true, 'Content is required'],
        },
        category: {
            type: String,
            enum: ['Diet', 'Fitness', 'Mental Health', 'Diseases', 'Lifestyle', 'General'],
            default: 'General',
        },
        tags: [{ type: String, trim: true, lowercase: true }],
        coverImage: {
            url: { type: String, default: '' },
            public_id: { type: String, default: '' },
        },
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        isPublished: {
            type: Boolean,
            default: true,
        },
        readTime: {
            type: Number, // minutes
            default: 3,
        },
        views: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

// Auto-generate slug from title
articleSchema.pre('save', function (next) {
    if (this.isModified('title')) {
        this.slug = this.title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim()
            + '-' + Date.now();
    }
    // Auto-calculate read time (~200 words/min)
    if (this.isModified('content')) {
        const wordCount = this.content.split(/\s+/).length;
        this.readTime = Math.max(1, Math.ceil(wordCount / 200));
    }
    next();
});

articleSchema.index({ category: 1, isPublished: 1 });
articleSchema.index({ title: 'text', summary: 'text', tags: 'text' });

module.exports = mongoose.model('Article', articleSchema);
