const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
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
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  shortDescription: {
    type: String,
    required: [true, 'Short description is required'],
    trim: true,
    maxlength: [500, 'Short description cannot exceed 500 characters']
  },
  eventType: {
    type: String,
    required: [true, 'Event type is required'],
    enum: {
      values: ['webinar', 'workshop', 'office-hours', 'conference'],
      message: 'Event type must be one of: webinar, workshop, office-hours, conference'
    }
  },
  category: {
    type: String,
    trim: true,
    default: 'General'
  },
  image: {
    type: String,
    trim: true,
    default: ''
  },
  videoUrl: {
    type: String,
    trim: true,
    default: ''
  },
  host: {
    name: {
      type: String,
      trim: true,
      default: ''
    },
    title: {
      type: String,
      trim: true,
      default: ''
    },
    image: {
      type: String,
      trim: true,
      default: ''
    }
  },
  date: {
    type: Date,
    required: [true, 'Event date is required']
  },
  endDate: {
    type: Date
  },
  duration: {
    type: Number,
    required: [true, 'Duration is required'],
    min: [1, 'Duration must be at least 1 minute']
  },
  timezone: {
    type: String,
    default: 'Asia/Colombo'
  },
  location: {
    type: String,
    trim: true,
    default: 'Online'
  },
  meetingLink: {
    type: String,
    trim: true,
    default: ''
  },
  registrationLink: {
    type: String,
    trim: true,
    default: ''
  },
  price: {
    type: Number,
    default: 0,
    min: [0, 'Price cannot be negative']
  },
  currency: {
    type: String,
    default: 'USD'
  },
  maxAttendees: {
    type: Number,
    default: 0
  },
  currentAttendees: {
    type: Number,
    default: 0
  },
  isFree: {
    type: Boolean,
    default: true
  },
  published: {
    type: Boolean,
    default: false
  },
  featured: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true
  }],
  agenda: [{
    time: {
      type: String,
      trim: true
    },
    title: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    speaker: {
      type: String,
      trim: true
    }
  }],
  prerequisites: [{
    type: String,
    trim: true
  }],
  whatYouWillLearn: [{
    type: String,
    trim: true
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  publishedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Create index for faster queries
eventSchema.index({ published: 1, date: 1 });
eventSchema.index({ eventType: 1, published: 1 });
eventSchema.index({ featured: 1, published: 1 });

// Pre-save middleware to set publishedAt
eventSchema.pre('save', function(next) {
  if (this.isModified('published') && this.published && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  this.updatedAt = new Date();
  next();
});

// Virtual for checking if event is upcoming
eventSchema.virtual('isUpcoming').get(function() {
  return new Date(this.date) > new Date();
});

// Virtual for checking if event is sold out
eventSchema.virtual('isSoldOut').get(function() {
  return this.maxAttendees > 0 && this.currentAttendees >= this.maxAttendees;
});

// Ensure virtuals are included in JSON
eventSchema.set('toJSON', { virtuals: true });
eventSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Event', eventSchema);
