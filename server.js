const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const contactRoutes = require('./routes/contact');
const subscriptionRoutes = require('./routes/subscription');
const adminRoutes = require('./routes/admin');
const blogRoutes = require('./routes/blog');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Stricter rate limiting for admin routes
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs for admin
  message: {
    success: false,
    message: 'Too many admin requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(cors({
  origin: true, // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'X-HTTP-Method-Override'
  ],
  exposedHeaders: ['Content-Length'],
  maxAge: 86400 // 24 hours
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Debug CORS requests
app.use((req, res, next) => {
  console.log(`🌐 ${req.method} ${req.path} - Origin: ${req.headers.origin || 'none'}`);
  next();
});

// Database connection
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/portfolio_db';

// Warn if using localhost in production
if (mongoUri.includes('localhost') && process.env.NODE_ENV === 'production') {
  console.warn('⚠️  WARNING: Using localhost MongoDB in production! This will not work.');
  console.warn('📦 Please use MongoDB Atlas or another cloud database for production.');
}

mongoose.connect(mongoUri)
  .then(() => {
    console.log('✅ Connected to MongoDB');
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  });

// Routes
app.use('/api/contact', contactRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/admin', adminLimiter, adminRoutes);
app.use('/api/blog', blogRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Portfolio Backend is running',
    timestamp: new Date().toISOString()
  });
});

// Email test endpoint
app.get('/api/test-email', async (req, res) => {
  try {
    const emailService = require('./utils/emailService');
    await emailService.testConnection();
    res.json({ success: true, message: 'Email service is configured correctly!' });
  } catch (error) {
    console.error('❌ Email test failed:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Email configuration error', 
      error: error.message 
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📧 Email service: ${process.env.EMAIL_HOST || 'NOT CONFIGURED'}`);
  console.log(`📧 Email user: ${process.env.EMAIL_USER || 'NOT CONFIGURED'}`);
  console.log(`📧 Email from: ${process.env.EMAIL_FROM || 'NOT CONFIGURED'}`);
  console.log(`🗄️  Database: ${process.env.MONGODB_URI ? 'MongoDB Atlas configured' : 'NOT CONFIGURED - USING FALLBACK'}`);
  console.log(`🌍 CORS origin: ${process.env.CORS_ORIGIN || 'ALL ORIGINS'}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
}); 