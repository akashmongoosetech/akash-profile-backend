const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
  tokenHash: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  // "sub" of the signed refresh token: the admin _id (string) or `env:<username>`
  subject: {
    type: String,
    required: true,
    index: true
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },
  userAgent: {
    type: String,
    default: ''
  },
  ip: {
    type: String,
    default: ''
  },
  expiresAt: {
    type: Date,
    required: true
  },
  revokedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Automatically purge expired refresh tokens
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Revoke every active refresh token for a subject (e.g. on password change)
refreshTokenSchema.statics.revokeAllForSubject = function(subject) {
  return this.updateMany(
    { subject, revokedAt: null },
    { revokedAt: new Date() }
  );
};

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
