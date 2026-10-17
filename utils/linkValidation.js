// Detects externally-hosted media URLs that are known to expire or break.
//
// LinkedIn serves signed `profile-displayphoto` (and similar) CDN URLs whose
// query signature expires, after which the asset returns 404. Rejecting these
// on write prevents permanently-broken images from being persisted.

const UNSTABLE_IMAGE_HOSTS = [
  'media.licdn.com',
  'media-exp1.licdn.com',
  'media-exp2.licdn.com',
  'media-exp3.licdn.com',
];

const UNSTABLE_URL_MESSAGE =
  'LinkedIn media URLs expire and will break; upload the image instead';

// Returns true when the value is a (trimmed, non-empty) string hosted on a
// known-unstable image host.
const isUnstableMediaUrl = (value) => {
  if (!value || typeof value !== 'string') return false;

  const trimmed = value.trim();
  if (!trimmed) return false;

  const lower = trimmed.toLowerCase();
  return UNSTABLE_IMAGE_HOSTS.some((host) => lower.includes(host));
};

// express-validator custom validator: passes for empty/optional values, fails
// for unstable media URLs.
const noUnstableMediaUrl = (value) => {
  if (value === undefined || value === null) return true;
  return !isUnstableMediaUrl(value);
};

module.exports = { isUnstableMediaUrl, noUnstableMediaUrl, UNSTABLE_URL_MESSAGE };
