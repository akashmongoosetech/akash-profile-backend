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

const caseStudySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
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
    maxlength: 500
  },
  challenge: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  solution: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  results: [caseStudyResultSchema],
  technologies: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  testimonial: testimonialSchema,
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

module.exports = mongoose.model('CaseStudy', caseStudySchema);