const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    lowercase: true,
    minlength: [3, 'Username must be at least 3 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters']
  },
  role: {
    type: String,
    enum: ['super_admin', 'editor', 'viewer'],
    default: 'editor'
  },
  permissions: [{
    type: String,
    enum: ['manage_blogs', 'manage_events', 'manage_case_studies', 'manage_contacts', 'manage_subscribers', 'view_analytics']
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Hash password before saving
adminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
adminSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Static method to seed default super admin from env if none exist
adminSchema.statics.seedDefaultAdmin = async function() {
  const count = await this.countDocuments();
  if (count === 0 && process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD) {
    const defaultAdmin = new this({
      username: process.env.ADMIN_USERNAME,
      email: process.env.ADMIN_EMAIL || 'admin@akashraikwar.in',
      password: process.env.ADMIN_PASSWORD,
      role: 'super_admin',
      permissions: ['manage_blogs', 'manage_events', 'manage_case_studies', 'manage_contacts', 'manage_subscribers', 'view_analytics']
    });
    await defaultAdmin.save();
    console.log('🌱 Default super admin seeded successfully from environment variables');
  }
};

module.exports = mongoose.model('Admin', adminSchema);
