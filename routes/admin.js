const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const Admin = require('../models/Admin');
const { authenticateToken } = require('../utils/authMiddleware');
const {
  signAccessToken,
  issueRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  setRefreshCookie,
  clearRefreshCookie,
  REFRESH_COOKIE_NAME
} = require('../utils/tokenService');

const router = express.Router();

const ALL_PERMISSIONS = ['manage_blogs', 'manage_events', 'manage_case_studies', 'manage_contacts', 'manage_subscribers', 'view_analytics'];
const ENV_SUBJECT_PREFIX = 'env:';

const buildEnvClaims = () => ({
  id: null,
  username: process.env.ADMIN_USERNAME,
  role: 'super_admin',
  permissions: ALL_PERMISSIONS
});

const buildDbClaims = (admin) => ({
  id: admin._id,
  username: admin.username,
  role: admin.role,
  permissions: admin.permissions
});

// Resolve the claims for a refresh subject (DB admin id or env:username)
const resolveClaimsForSubject = async (subject) => {
  if (subject.startsWith(ENV_SUBJECT_PREFIX)) {
    const username = subject.slice(ENV_SUBJECT_PREFIX.length);
    if (!process.env.ADMIN_USERNAME || username !== process.env.ADMIN_USERNAME) return null;
    return buildEnvClaims();
  }

  if (!Admin.isValidObjectId(subject)) return null;
  const admin = await Admin.findOne({ _id: subject, isActive: true });
  if (!admin) return null;
  return buildDbClaims(admin);
};

// Admin login route
router.post('/login', [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
  }

  const { username, password } = req.body;
  const normalizedUsername = username.toLowerCase().trim();

  try {
    let claims = null;
    let subject = null;
    let adminRef = null;
    let userPayload = null;

    // 1. Check database for admin
    const admin = await Admin.findOne({ username: normalizedUsername, isActive: true });

    if (admin) {
      const isMatch = await admin.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      admin.lastLogin = new Date();
      await admin.save();

      claims = buildDbClaims(admin);
      subject = admin._id.toString();
      adminRef = admin._id;
      userPayload = {
        username: admin.username,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions
      };
    } else if (
      process.env.ADMIN_USERNAME &&
      normalizedUsername === process.env.ADMIN_USERNAME.toLowerCase() &&
      process.env.ADMIN_PASSWORD_HASH
    ) {
      // 2. Fallback to environment hash (plaintext fallback intentionally removed)
      const passwordValid = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH);

      if (passwordValid) {
        claims = buildEnvClaims();
        subject = `${ENV_SUBJECT_PREFIX}${process.env.ADMIN_USERNAME}`;
        userPayload = {
          username: process.env.ADMIN_USERNAME,
          role: 'super_admin',
          permissions: ALL_PERMISSIONS
        };
      }
    }

    if (!claims) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = signAccessToken(claims);
    const { token: refreshToken } = await issueRefreshToken({ subject, admin: adminRef, req });
    setRefreshCookie(res, refreshToken);

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: userPayload
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

// Exchange a valid refresh token for a new access token (rotates the refresh token)
router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    const rotated = await rotateRefreshToken(refreshToken, req);

    if (!rotated) {
      clearRefreshCookie(res);
      return res.status(401).json({ success: false, message: 'Invalid or expired session' });
    }

    const claims = await resolveClaimsForSubject(rotated.subject);
    if (!claims) {
      clearRefreshCookie(res);
      return res.status(401).json({ success: false, message: 'Account is no longer active' });
    }

    setRefreshCookie(res, rotated.token);
    const token = signAccessToken(claims);

    return res.json({ success: true, token, user: claims });
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(500).json({ success: false, message: 'Server error refreshing session' });
  }
});

// Logout - revoke the refresh token and clear the cookie
router.post('/logout', async (req, res) => {
  try {
    await revokeRefreshToken(req.cookies?.[REFRESH_COOKIE_NAME]);
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    clearRefreshCookie(res);
  }
  res.json({ success: true, message: 'Logged out' });
});

// Protected admin route
router.get('/', authenticateToken, (req, res) => {
  res.json({ success: true, message: 'Admin route is working', user: req.user });
});

module.exports = router;
