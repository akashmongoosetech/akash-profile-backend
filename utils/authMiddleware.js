const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Grant access when the authenticated admin holds at least one of the
// required permissions. super_admin bypasses permission checks.
const requirePermission = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (req.user.role === 'super_admin') {
      return next();
    }

    const granted = Array.isArray(req.user.permissions) ? req.user.permissions : [];
    const allowed = permissions.some((permission) => granted.includes(permission));

    if (!allowed) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions' });
    }

    next();
  };
};

module.exports = { authenticateToken, requirePermission };