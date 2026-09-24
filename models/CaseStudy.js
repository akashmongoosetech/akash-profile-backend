const mongoose = require('mongoose');

const caseStudyResultSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true,
    trim: true
  },
  value: {
    type: String,
    required: true,
    trim: true
  },
  icon: {
    type: String,
    required: true,
    trim: true
  }
}, { _id: false });

const testimonialSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true
  },
  author: {
    type: String,
    required: true,
    trim: true
  },
  position: {
    type: String,
    required: true,
    trim: true
  },
  avatar: {
    type: String,
    trim: true
  }
}, { _id: false });

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const caseStudySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  slug: {
    type: String,
    required: [true, 'Slug is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens']
  },
  category: {
    type: String,
    required: true,
    enum: ['Web Development', 'Mobile App', 'AI Solutions'],
    trim: true
  },
  client: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  duration: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  thumbnail: {
    type: String,
    required: true,
    trim: true
  },
  color: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  icon: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  overview: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  challenge: {
    type: String,
    trim: true,
    maxlength: 3000
  },
  solution: {
    type: String,
    trim: true,
    maxlength: 3000
  },
  results: [caseStudyResultSchema],
  technologies: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  testimonial: testimonialSchema,
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
  },
  published: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Add indexes for better query performance
caseStudySchema.index({ published: 1, createdAt: -1 });
caseStudySchema.index({ category: 1, published: 1 });
caseStudySchema.index({ title: 'text', client: 'text', overview: 'text' });
// Note: slug index is automatically created due to unique: true

// Pre-save middleware to generate unique slug if not provided.
// Existing slugs are frozen unless explicitly modified (SEO-safe, option B).
caseStudySchema.pre('save', async function(next) {
  try {
    if ((!this.slug || this.slug.trim() === '') && this.title) {
      const baseSlug = slugify(this.title) || 'case-study';
      let slug = baseSlug;
      let counter = 1;
      const CaseStudyModel = this.constructor;
      while (await CaseStudyModel.findOne({ slug, _id: { $ne: this._id } })) {
        counter++;
        slug = `${baseSlug}-${counter}`;
      }
      this.slug = slug;
    } else if (this.isModified('slug') && this.slug) {
      const baseSlug = slugify(this.slug) || 'case-study';
      let slug = baseSlug;
      let counter = 1;
      const CaseStudyModel = this.constructor;
      while (await CaseStudyModel.findOne({ slug, _id: { $ne: this._id } })) {
        counter++;
        slug = `${baseSlug}-${counter}`;
      }
      this.slug = slug;
    }

    // Auto-generate SEO fields if not provided (same as blogs)
    if (!this.seoTitle && this.title) {
      this.seoTitle = String(this.title).substring(0, 60);
    }
    if (!this.seoDescription && this.overview) {
      const plainOverview = String(this.overview).replace(/<[^>]*>/g, '');
      this.seoDescription = plainOverview.substring(0, 160);
    }
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('CaseStudy', caseStudySchema);