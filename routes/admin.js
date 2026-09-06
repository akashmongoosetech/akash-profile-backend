const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const Admin = require('../models/Admin');
const { authenticateToken } = require('../utils/authMiddleware');

const router = express.Router();

// Admin login route
router.post('/login', [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { username, password } = req.body;
  const normalizedUsername = username.toLowerCase().trim();

  try {
    // 1. Check database for admin
    let admin = await Admin.findOne({ username: normalizedUsername, isActive: true });

    if (admin) {
      const isMatch = await admin.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      // Update last login
      admin.lastLogin = new Date();
      await admin.save();

      // Generate JWT token with role and permissions
      const token = jwt.sign(
        { 
          id: admin._id, 
          username: admin.username, 
          role: admin.role, 
          permissions: admin.permissions 
        }, 
        process.env.JWT_SECRET, 
        { expiresIn: '8h' }
      );

      return res.json({ 
        success: true, 
        message: 'Login successful', 
        token, 
        user: { 
          username: admin.username, 
          email: admin.email, 
          role: admin.role, 
          permissions: admin.permissions 
        } 
      });
    }

    // 2. Fallback to environment variables if no DB admin matches
    if (normalizedUsername === (process.env.ADMIN_USERNAME || '').toLowerCase()) {
      let passwordValid = false;
      if (process.env.ADMIN_PASSWORD_HASH) {
        passwordValid = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH);
      } else if (process.env.ADMIN_PASSWORD) {
        passwordValid = password === process.env.ADMIN_PASSWORD;
      }

      if (passwordValid) {
        const token = jwt.sign(
          { username: process.env.ADMIN_USERNAME, role: 'super_admin', permissions: ['manage_blogs', 'manage_events', 'manage_case_studies', 'manage_contacts', 'manage_subscribers', 'view_analytics'] }, 
          process.env.JWT_SECRET, 
          { expiresIn: '8h' }
        );

        return res.json({ 
          success: true, 
          message: 'Login successful', 
          token,
          user: {
            username: process.env.ADMIN_USERNAME,
            role: 'super_admin',
            permissions: ['manage_blogs', 'manage_events', 'manage_case_studies', 'manage_contacts', 'manage_subscribers', 'view_analytics']
          }
        });
      }
    }

    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login', error: error.message });
  }
});

// Protected admin route
router.get('/', authenticateToken, (req, res) => {
  res.json({ success: true, message: 'Admin route is working', user: req.user });
});

module.exports = router;
