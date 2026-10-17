const sanitizeHtml = require('sanitize-html');

// Shared allow-list for rich HTML authored by admins (blog, events, case studies).
// Strips scripts/event handlers while preserving formatting used by the editor.
const OPTIONS = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat([
    'img', 'figure', 'figcaption', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'span', 'div', 'pre', 'code', 'blockquote', 'br', 'hr', 'p', 'ul', 'ol', 'li',
    'table', 'thead', 'tbody', 'tr', 'th', 'td', 'sub', 'sup', 'u', 's', 'em', 'strong', 'del', 'ins', 'mark'
  ]),
  allowedAttributes: {
    '*': ['style', 'class', 'id'],
    'a': ['href', 'target', 'rel'],
    'img': ['src', 'alt', 'width', 'height', 'title'],
    'td': ['colspan', 'rowspan'],
    'th': ['colspan', 'rowspan'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesByTag: { img: ['http', 'https', 'data'] },
  disallowedTagsMode: 'discard',
  allowedStyles: {
    '*': {
      color: [/.*/],
      background: [/.*/],
      'background-color': [/.*/],
      'text-align': [/.*/],
      'font-size': [/.*/],
      'font-weight': [/.*/],
      'font-family': [/.*/],
      'line-height': [/.*/],
      'margin': [/.*/],
      'margin-left': [/.*/],
      'margin-right': [/.*/],
      'padding': [/.*/],
      'padding-left': [/.*/],
      'padding-right': [/.*/],
      'border': [/.*/],
      'border-radius': [/.*/],
      'width': [/.*/],
      'height': [/.*/],
      'max-width': [/.*/],
      'max-height': [/.*/],
    }
  },
  allowedIframeHostnames: [],
  allowProtocolRelative: false,
  enforceHtmlBoundary: true,
};

const sanitizeHtmlContent = (dirty) => {
  if (!dirty || typeof dirty !== 'string') return dirty;
  return sanitizeHtml(dirty, OPTIONS);
};

module.exports = { sanitizeHtmlContent };
