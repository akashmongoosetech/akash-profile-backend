const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const RefreshToken = require('../models/RefreshToken');

const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL || '15m';
const REFRESH_TOKEN_TTL_DAYS = Math.max(1, parseInt(process.env.REFRESH_TOKEN_TTL_DAYS || '7', 10));
const REFRESH_COOKIE_NAME = 'refreshToken';
const isProduction = process.env.NODE_ENV === 'production';

const getRefreshSecret = () => process.env.JWT_REFRESH_SECRET || `${process.env.JWT_SECRET}:refresh`;

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const signAccessToken = (claims) => {
  return jwt.sign({ ...claims, type: 'access' }, process.env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
};

// Create and persist a new refresh token for a subject.
const issueRefreshToken = async ({ subject, admin = null, req = null }) => {
  const jti = crypto.randomUUID();
  const token = jwt.sign(
    { sub: subject, jti, type: 'refresh' },
    getRefreshSecret(),
    { expiresIn: `${REFRESH_TOKEN_TTL_DAYS}d` }
  );

  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

  await RefreshToken.create({
    tokenHash: hashToken(token),
    subject,
    admin,
    userAgent: req?.headers?.['user-agent'] || '',
    ip: req?.ip || '',
    expiresAt
  });

  return { token, expiresAt };
};

// Verify + rotate a refresh token. Returns subject/admin on success, else null.
const rotateRefreshToken = async (refreshToken, req = null) => {
  if (!refreshToken) return null;

  let payload;
  try {
    payload = jwt.verify(refreshToken, getRefreshSecret());
  } catch {
    return null;
  }

  if (!payload || payload.type !== 'refresh' || !payload.sub) return null;

  const record = await RefreshToken.findOne({ tokenHash: hashToken(refreshToken) });
  if (!record || record.revokedAt || record.expiresAt < new Date()) return null;

  record.revokedAt = new Date();
  await record.save();

  const issued = await issueRefreshToken({ subject: payload.sub, admin: record.admin, req });
  return { subject: payload.sub, admin: record.admin, ...issued };
};

const revokeRefreshToken = async (refreshToken) => {
  if (!refreshToken) return;
  await RefreshToken.findOneAndUpdate(
    { tokenHash: hashToken(refreshToken), revokedAt: null },
    { revokedAt: new Date() }
  );
};

const refreshCookieOptions = () => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
  path: '/',
  maxAge: REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000
});

const setRefreshCookie = (res, token) => {
  res.cookie(REFRESH_COOKIE_NAME, token, refreshCookieOptions());
};

const clearRefreshCookie = (res) => {
  res.clearCookie(REFRESH_COOKIE_NAME, { ...refreshCookieOptions(), maxAge: 0 });
};

module.exports = {
  ACCESS_TOKEN_TTL,
  REFRESH_TOKEN_TTL_DAYS,
  REFRESH_COOKIE_NAME,
  hashToken,
  signAccessToken,
  issueRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  setRefreshCookie,
  clearRefreshCookie
};
