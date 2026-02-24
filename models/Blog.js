const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  slug: {
    type: String,
    required: [true, 'Slug is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens']
  },
  excerpt: {
    type: String,
    required: [true, 'Excerpt is required'],
    trim: true,
    maxlength: [1000, 'Excerpt cannot exceed 1000 characters']
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    trim: true
  },
  contentSections: [{
    title: {
      type: String,
      trim: true,
      maxlength: [200, 'Section title cannot exceed 200 characters']
    },
    content: {
      type: String,
      trim: true
    },
    image: {
      type: String,
      trim: true
    },
    code: {
      type: String,
      trim: true
    },
    order: {
      type: Number,
      default: 0
    }
  }],
  image: {
    type: String,
    required: [true, 'Image URL is required'],
    trim: true
  },
  author: {
    type: String,
    required: [true, 'Author is required'],
    trim: true,
    default: 'Akash Raikwar'
  },
  authorProfile: {
    type: String,
    trim: true,
    default: 'Full Stack Developer & Software Engineer passionate about creating innovative web solutions.'
  },
  authorProfilePic: {
    type: String,
    trim: true,
    default: ''
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  readTime: {
    type: String,
    required: [true, 'Read time is required'],
    default: '5 min read'
  },
  featured: {
    type: Boolean,
    default: false
  },
  published: {
    type: Boolean,
    default: true
  },
  publishedAt: {
    type: Date,
    default: Date.now
  },
  views: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  seoTitle: {
    type: String,
    trim: true,
    maxlength: [60, 'SEO title cannot exceed 60 characters']
  },
  seoDescription: {
    type: String,
    trim: true,
    maxlength: [160, 'SEO description cannot exceed 160 characters']
  },
  seoKeywords: {
    type: String,
    trim: true,
    maxlength: [200, 'SEO keywords cannot exceed 200 characters']
  }
}, {
  timestamps: true
});

// Index for better query performance
// Note: slug index is automatically created due to unique: true
blogSchema.index({ category: 1 });
blogSchema.index({ published: 1, publishedAt: -1 });
blogSchema.index({ featured: 1 });
blogSchema.index({ tags: 1 });

// Text index for search optimization
blogSchema.index({ title: 'text', excerpt: 'text', content: 'text', tags: 'text' });

// Virtual for formatted date
blogSchema.virtual('formattedDate').get(function() {
  return this.publishedAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Method to increment views
blogSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Method to increment likes
blogSchema.methods.incrementLikes = function() {
  this.likes += 1;
  return this.save();
};

// Static method to get featured blogs
blogSchema.statics.getFeatured = function() {
  return this.find({ published: true, featured: true })
    .sort({ publishedAt: -1 })
    .limit(3);
};

// Static method to get blogs by category
blogSchema.statics.getByCategory = function(category) {
  return this.find({ published: true, category })
    .sort({ publishedAt: -1 });
};

// Static method to search blogs
blogSchema.statics.search = function(query) {
  return this.find({
    published: true,
    $text: { $search: query }
  }).sort({ score: { $meta: 'textScore' }, publishedAt: -1 });
};

// Static method to get blog statistics
blogSchema.statics.getStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$published',
        count: { $sum: 1 }
      }
    }
  ]);
};

// Static method to get total blog count
blogSchema.statics.getTotalCount = function() {
  return this.countDocuments();
};

// Static method to get published blog count
blogSchema.statics.getPublishedCount = function() {
  return this.countDocuments({ published: true });
};

// Pre-save middleware to generate slug if not provided
blogSchema.pre('save', function(next) {
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, ''); // Remove leading and trailing dashes
  }
  
  // Auto-generate SEO fields if not provided
  if (!this.seoTitle) {
    this.seoTitle = this.title.substring(0, 60);
  }
  if (!this.seoDescription) {
    this.seoDescription = this.excerpt.substring(0, 160);
  }
  
  next();
});

module.exports = mongoose.model('Blog', blogSchema);
