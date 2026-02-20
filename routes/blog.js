const express = require('express');
const { body, validationResult, param, query } = require('express-validator');
const Blog = require('../models/Blog');
const { authenticateToken } = require('../utils/authMiddleware');

const router = express.Router();

// Get all published blogs with pagination and filtering
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('category').optional().isString().withMessage('Category must be a string'),
  query('featured').optional().isBoolean().withMessage('Featured must be a boolean'),
  query('search').optional().isString().withMessage('Search must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    let query = { published: true };
    
    // Apply filters
    if (req.query.category) {
      query.category = req.query.category;
    }
    
    if (req.query.featured !== undefined) {
      query.featured = req.query.featured === 'true';
    }
    
    let blogs;
    let total;
    
    if (req.query.search) {
      // Use the search method for text search
      const searchQuery = { published: true, $text: { $search: req.query.search } };
      blogs = await Blog.find(searchQuery)
        .sort({ score: { $meta: 'textScore' }, publishedAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-content'); // Exclude full content for list view

      total = await Blog.countDocuments(searchQuery);
    } else {
      blogs = await Blog.find(query)
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-content'); // Exclude full content for list view
      
      total = await Blog.countDocuments(query);
    }

    const totalPages = Math.ceil(total / limit);
    
    res.json({
      success: true,
      blogs,
      pagination: {
        currentPage: page,
        totalPages,
        totalBlogs: total,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch blogs', 
      error: error.message 
    });
  }
});

// Get featured blogs
router.get('/featured', async (req, res) => {
  try {
    const blogs = await Blog.getFeatured();
    res.json({ success: true, blogs });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch featured blogs', 
      error: error.message 
    });
  }
});

// Get latest blog post for popup
router.get('/latest', async (req, res) => {
  try {
    const blog = await Blog.findOne({ published: true })
      .sort({ publishedAt: -1, createdAt: -1 })
      .select('title slug excerpt image publishedAt author authorProfilePic category readTime');
    
    if (!blog) {
      return res.status(404).json({ 
        success: false, 
        message: 'No published blogs found' 
      });
    }
    
    res.json({ success: true, blog });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch latest blog', 
      error: error.message 
    });
  }
});

// Get blog statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await Blog.getStats();
    const totalCount = await Blog.getTotalCount();
    const publishedCount = await Blog.getPublishedCount();
    
    res.json({ 
      success: true, 
      stats,
      totalCount,
      publishedCount
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch blog stats', 
      error: error.message 
    });
  }
});

// Get blog categories with counts
router.get('/categories', async (req, res) => {
  try {
    const categories = await Blog.aggregate([
      { $match: { published: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch categories', 
      error: error.message 
    });
  }
});

// Get all blogs for admin (including unpublished) - PROTECTED ROUTE
router.get('/admin/all', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const blogs = await Blog.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-content');
    
    const total = await Blog.countDocuments();
    const totalPages = Math.ceil(total / limit);
    
    res.json({
      success: true,
      blogs,
      pagination: {
        currentPage: page,
        totalPages,
        totalBlogs: total,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch blogs', 
      error: error.message 
    });
  }
});

// Get single blog by slug
router.get('/slug/:slug', [
  param('slug').isString().withMessage('Slug must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const blog = await Blog.findOne({ slug: req.params.slug, published: true });
    
    if (!blog) {
      return res.status(404).json({ 
        success: false, 
        message: 'Blog not found' 
      });
    }
    
    // Increment views
    await blog.incrementViews();
    
    res.json({ success: true, blog });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch blog', 
      error: error.message 
    });
  }
});

// Get single blog by ID (for admin)
router.get('/:id', [
  param('id').isMongoId().withMessage('Invalid blog ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({ 
        success: false, 
        message: 'Blog not found' 
      });
    }
    
    res.json({ success: true, blog });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch blog', 
      error: error.message 
    });
  }
});

// Create new blog - PROTECTED ROUTE
router.post('/', authenticateToken, [
  body('title').notEmpty().withMessage('Title is required')
    .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
  body('slug').optional().isString().withMessage('Slug must be a string'),
  body('excerpt').notEmpty().withMessage('Excerpt is required')
    .isLength({ max: 1000 }).withMessage('Excerpt cannot exceed 1000 characters'),
  body('content').notEmpty().withMessage('Content is required'),
  body('image').notEmpty().withMessage('Image URL is required')
    .isURL().withMessage('Image must be a valid URL'),
  body('author').optional().isString().withMessage('Author must be a string'),
  body('authorProfile').optional().isString().withMessage('Author profile must be a string'),
  body('authorProfilePic').optional().custom(value => {
    if (!value || value.trim() === '') return true;
    return /^https?:\/\/.+/.test(value);
  }).withMessage('Author profile picture must be a valid URL'),
  body('contentSections').optional().isArray().withMessage('Content sections must be an array'),
  body('contentSections.*.title').optional().isString().withMessage('Section title must be a string'),
  body('contentSections.*.content').optional().isString().withMessage('Section content must be a string'),
  body('contentSections.*.image').optional().custom(value => {
    if (!value || value.trim() === '') return true;
    return /^https?:\/\/.+/.test(value);
  }).withMessage('Section image must be a valid URL'),
  body('contentSections.*.code').optional().isString().withMessage('Section code must be a string'),
  body('category').notEmpty().withMessage('Category is required')
    .isString().withMessage('Category must be a string')
    .isLength({ min: 1, max: 50 }).withMessage('Category must be between 1 and 50 characters'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('readTime').optional().isString().withMessage('Read time must be a string'),
  body('featured').optional().isBoolean().withMessage('Featured must be a boolean'),
  body('published').optional().isBoolean().withMessage('Published must be a boolean'),
  body('seoTitle').optional().isString().isLength({ max: 60 }).withMessage('SEO title cannot exceed 60 characters'),
  body('seoDescription').optional().isString().isLength({ max: 160 }).withMessage('SEO description cannot exceed 160 characters'),
  body('seoKeywords').optional().isString().isLength({ max: 200 }).withMessage('SEO keywords cannot exceed 200 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    // Check if slug already exists
    if (req.body.slug) {
      const existingBlog = await Blog.findOne({ slug: req.body.slug });
      if (existingBlog) {
        return res.status(400).json({ 
          success: false, 
          message: 'Blog with this slug already exists' 
        });
      }
    }

    const blog = new Blog(req.body);
    await blog.save();
    
    res.status(201).json({ 
      success: true, 
      message: 'Blog created successfully', 
      blog 
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: 'Blog with this slug already exists' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create blog', 
      error: error.message 
    });
  }
});

// Update blog - PROTECTED ROUTE
router.put('/:id', authenticateToken, [
  param('id').isMongoId().withMessage('Invalid blog ID'),
  body('title').optional().isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
  body('slug').optional().isString().withMessage('Slug must be a string'),
  body('excerpt').optional().isLength({ max: 1000 }).withMessage('Excerpt cannot exceed 1000 characters'),
  body('category').optional()
    .isString().withMessage('Category must be a string')
    .isLength({ min: 1, max: 50 }).withMessage('Category must be between 1 and 50 characters'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('authorProfile').optional().isString().withMessage('Author profile must be a string'),
  body('authorProfilePic').optional().custom(value => {
    if (!value || value.trim() === '') return true;
    return /^https?:\/\/.+/.test(value);
  }).withMessage('Author profile picture must be a valid URL'),
  body('contentSections').optional().isArray().withMessage('Content sections must be an array'),
  body('contentSections.*.title').optional().isString().withMessage('Section title must be a string'),
  body('contentSections.*.content').optional().isString().withMessage('Section content must be a string'),
  body('contentSections.*.image').optional().custom(value => {
    if (!value || value.trim() === '') return true;
    return /^https?:\/\/.+/.test(value);
  }).withMessage('Section image must be a valid URL'),
  body('contentSections.*.code').optional().isString().withMessage('Section code must be a string'),
  body('featured').optional().isBoolean().withMessage('Featured must be a boolean'),
  body('published').optional().isBoolean().withMessage('Published must be a boolean'),
  body('seoTitle').optional().isString().isLength({ max: 60 }).withMessage('SEO title cannot exceed 60 characters'),
  body('seoDescription').optional().isString().isLength({ max: 160 }).withMessage('SEO description cannot exceed 160 characters'),
  body('seoKeywords').optional().isString().isLength({ max: 200 }).withMessage('SEO keywords cannot exceed 200 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ 
        success: false, 
        message: 'Blog not found' 
      });
    }

    // Check if slug already exists (excluding current blog)
    if (req.body.slug && req.body.slug !== blog.slug) {
      const existingBlog = await Blog.findOne({ 
        slug: req.body.slug, 
        _id: { $ne: req.params.id } 
      });
      if (existingBlog) {
        return res.status(400).json({ 
          success: false, 
          message: 'Blog with this slug already exists' 
        });
      }
    }

    Object.assign(blog, req.body);
    await blog.save();
    
    res.json({ 
      success: true, 
      message: 'Blog updated successfully', 
      blog 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update blog', 
      error: error.message 
    });
  }
});

// Delete blog - PROTECTED ROUTE
router.delete('/:id', authenticateToken, [
  param('id').isMongoId().withMessage('Invalid blog ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) {
      return res.status(404).json({ 
        success: false, 
        message: 'Blog not found' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Blog deleted successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete blog', 
      error: error.message 
    });
  }
});

// Like blog
router.post('/:id/like', [
  param('id').isMongoId().withMessage('Invalid blog ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ 
        success: false, 
        message: 'Blog not found' 
      });
    }
    
    await blog.incrementLikes();
    
    res.json({ 
      success: true, 
      message: 'Blog liked successfully',
      likes: blog.likes 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to like blog', 
      error: error.message 
    });
  }
});

module.exports = router;
