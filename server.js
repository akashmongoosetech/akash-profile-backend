const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

const envPath = path.join(__dirname, '.env');
const productionEnvPath = path.join(__dirname, '.env.production');

// Always resolve env files from backend directory, not process cwd.
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

// Fallback: if critical vars are still missing, try .env.production (independent of NODE_ENV).
if ((!process.env.EMAIL_HOST || !process.env.MONGODB_URI) && fs.existsSync(productionEnvPath)) {
  console.log('Trying to load .env.production file...');
  dotenv.config({ path: productionEnvPath });
}

// Debug: Log all environment variables at startup
console.log('=== ENVIRONMENT VARIABLES ===');
console.log('EMAIL_HOST:', process.env.EMAIL_HOST || 'NOT SET');
console.log('EMAIL_PORT:', process.env.EMAIL_PORT || 'NOT SET');
console.log('EMAIL_USER:', process.env.EMAIL_USER || 'NOT SET');
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '***' + process.env.EMAIL_PASS.slice(-4) : 'NOT SET');
console.log('EMAIL_FROM:', process.env.EMAIL_FROM || 'NOT SET');
console.log('CORS_ORIGIN:', process.env.CORS_ORIGIN || 'NOT SET');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'SET' : 'NOT SET');
console.log('=============================');

const contactRoutes = require('./routes/contact');
const subscriptionRoutes = require('./routes/subscription');
const adminRoutes = require('./routes/admin');
const blogRoutes = require('./routes/blog');
const aiRoutes = require('./routes/aiRoutes');
const eventRoutes = require('./routes/event');

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

// Test email configuration at startup
const testEmailConfig = async () => {
  try {
    const emailService = require('./utils/emailService');
    await emailService.testConnection();
    console.log('✅ Email service verified successfully');
  } catch (error) {
    console.error('❌ Email service verification failed:');
    console.error(error.message);
    // Don't exit - let the server continue but email won't work
  }
};

// Run email test after database is connected
// Connect to MongoDB with fallback
const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error('❌ MONGODB_URI is not defined in environment variables');
  process.exit(1);
}

mongoose.connect(mongoUri)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    // Test email configuration after DB is connected
    testEmailConfig();
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
app.use('/api/ai', aiRoutes);
app.use('/api/events', eventRoutes);

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