const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  firstName: {
    type: String,
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'unsubscribed'],
    default: 'active'
  },
  source: {
    type: String,
    enum: ['footer', 'contact', 'manual', 'other'],
    default: 'footer'
  },
  preferences: {
    newsletters: {
      type: Boolean,
      default: true
    },
    projectUpdates: {
      type: Boolean,
      default: true
    },
    techInsights: {
      type: Boolean,
      default: true
    }
  },
  lastEmailSent: {
    type: Date
  },
  emailCount: {
    type: Number,
    default: 0
  },
  unsubscribedAt: {
    type: Date
  },
  unsubscribedReason: {
    type: String,
    trim: true,
    maxlength: [500, 'Unsubscribe reason cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

// Indexes for better query performance
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ createdAt: -1 });

// Virtual for full name
subscriptionSchema.virtual('fullName').get(function() {
  if (this.firstName && this.lastName) {
    return `${this.firstName} ${this.lastName}`;
  }
  return this.firstName || this.lastName || 'Subscriber';
});

// Method to unsubscribe
subscriptionSchema.methods.unsubscribe = function(reason = '') {
  this.status = 'unsubscribed';
  this.unsubscribedAt = new Date();
  this.unsubscribedReason = reason;
  return this.save();
};

// Method to reactivate subscription
subscriptionSchema.methods.reactivate = function() {
  this.status = 'active';
  this.unsubscribedAt = undefined;
  this.unsubscribedReason = '';
  return this.save();
};

// Static method to get subscription statistics
subscriptionSchema.statics.getStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
};

// Static method to get active subscribers count
subscriptionSchema.statics.getActiveCount = function() {
  return this.countDocuments({ status: 'active' });
};

// Pre-save middleware to ensure email is lowercase
subscriptionSchema.pre('save', function(next) {
  if (this.email) {
    this.email = this.email.toLowerCase();
  }
  next();
});

module.exports = mongoose.model('Subscription', subscriptionSchema); 