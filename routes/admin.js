const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../utils/authMiddleware');

const router = express.Router();

// Hardcoded hashed password for '123456789' - In production, store hashed password in .env
const ADMIN_PASSWORD_HASH = '$2a$10$rBV2JzS5VhWzXJNKvKkYzO5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y';

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

  // Check username against environment variable
  if (username !== process.env.ADMIN_USERNAME) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  // Check password against environment variable (for backward compatibility) 
  // OR compare with hashed password if set
  let passwordValid = false;
  if (process.env.ADMIN_PASSWORD_HASH) {
    passwordValid = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH);
  } else if (process.env.ADMIN_PASSWORD) {
    passwordValid = password === process.env.ADMIN_PASSWORD;
  } else {
    return res.status(500).json({ success: false, message: 'Server configuration error' });
  }

  if (!passwordValid) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  // Generate JWT token
  const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '1h' });

  res.json({ success: true, message: 'Login successful', token });
});

// Protected admin route
router.get('/', authenticateToken, (req, res) => {
  res.json({ success: true, message: 'Admin route is working', user: req.user });
});

module.exports = router;