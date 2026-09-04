/**
 * Base Email Template
 * Provides shared HTML layout for all transactional emails
 */

const BRAND = {
  name: 'Akash Raikwar',
  title: 'Software Engineer',
  website: 'https://akashraikwar.in',
  portfolio: 'https://akashraikwar.in',
  email: 'info@akashraikwar.in',
  phone: '+91 96855 33878',
  whatsapp: 'https://wa.me/919685533878',
  linkedin: 'https://www.linkedin.com/in/akash-raikwar-4a67bb171/',
  instagram: 'https://www.instagram.com/akashraikwar_007/',
  github: 'https://github.com/akash007123',
  twitter: 'https://x.com/AkashRa28283838',
  facebook: 'https://www.facebook.com/akashraikwar007',
  logoUrl: 'https://ik.imagekit.io/sentyaztie/cropped_circle_image.png?updatedAt=1785927209061',
  bannerUrl: 'https://ik.imagekit.io/sentyaztie/ChatGPT%20Image%20Sep%203,%202026,%2012_51_07%20AM.png'
};

const COLORS = {
  primary: '#2563eb',
  primaryDark: '#1d4ed8',
  secondary: '#8b5cf6',
  accent: '#06b6d4',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  dark: '#0f172a',
  darker: '#020617',
  gray: '#64748b',
  light: '#f1f5f9',
  white: '#ffffff',
  border: '#e2e8f0'
};

/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#039;')
    .replace(/\n/g, '<br>');
}

/**
 * Escape HTML but preserve newlines for plain text display
 */
function escapeHtmlPlain(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#039;');
}

/**
 * Build the complete HTML email document
 * @param {Object} options
 * @param {string} options.preheader - Preview text for email clients
 * @param {string} options.headerHtml - Custom header content (banner, brand)
 * @param {string} options.bodyHtml - Main content HTML
 * @param {string} options.footerHtml - Optional footer content
 * @returns {string} Complete HTML document
 */
function buildEmailHtml({ preheader = '', headerHtml = '', bodyHtml = '', footerHtml = '' }) {
  const year = new Date().getFullYear();
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${BRAND.name} - Portfolio</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin:0; padding:0; background-color:#f1f5f9; font-family:Arial, Helvetica, sans-serif; color:#0f172a; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;">
  <!-- Preheader text (hidden in email body, shown in preview) -->
  <div style="display:none; max-height:0px; overflow:hidden; font-size:1px; line-height:1px; color:#f1f5f9; opacity:0;">${escapeHtml(preheader)}</div>

  <!-- Main Wrapper -->
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f1f5f9; margin:0; padding:30px 15px;">
    <tr>
      <td align="center">
        <!-- Email Container -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:650px; background-color:#ffffff; border-radius:18px; overflow:hidden; box-shadow:0 10px 35px rgba(15,23,42,0.08);">
          
          ${headerHtml}
          
          ${bodyHtml}
          
          ${footerHtml}
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Build standard header with banner and brand
 * @param {Object} options
 * @param {string} options.title - Optional title for the header section
 * @param {string} options.subtitle - Optional subtitle
 * @param {string} options.badgeText - Optional badge text (e.g., "New Contact")
 * @param {string} options.badgeColor - Badge background color
 * @returns {string} Header HTML
 */
function buildHeader({ title, subtitle, badgeText, badgeColor = COLORS.primary }) {
  return `
          <!-- HERO / BANNER -->
          <tr>
            <td style="padding:0;">
              <img
                src="${BRAND.bannerUrl}"
                alt="${BRAND.name} - ${BRAND.title}"
                width="650"
                style="display:block; width:100%; max-width:650px; height:auto; border:0;"
              >
            </td>
          </tr>

          <!-- BRAND HEADER -->
          <tr>
            <td style="padding:30px 35px 15px 35px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td width="75" valign="middle" style="padding-right:18px;">
                    <img
                      src="${BRAND.logoUrl}"
                      alt="${BRAND.name}"
                      width="70"
                      height="70"
                      style="display:block; width:70px; height:70px; border-radius:50%; border:3px solid #e2e8f0;"
                    >
                  </td>
                  <td valign="middle">
                    <div style="font-size:21px; line-height:28px; font-weight:700; color:#0f172a;">${BRAND.name}</div>
                    <div style="font-size:14px; line-height:22px; color:#64748b; margin-top:3px;">${BRAND.title}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${title ? `
          <!-- SECTION TITLE -->
          <tr>
            <td style="padding:20px 35px 0 35px;">
              ${badgeText ? `
              <div style="display:inline-block; background-color:${badgeColor}20; color:${badgeColor}; font-size:12px; font-weight:700; letter-spacing:0.7px; text-transform:uppercase; padding:7px 12px; border-radius:20px; margin-bottom:16px;">${escapeHtml(badgeText)}</div>
              ` : ''}
              <h1 style="margin:0 0 18px 0; font-size:30px; line-height:38px; color:#0f172a;">${escapeHtml(title)}</h1>
              ${subtitle ? `<p style="margin:0 0 18px 0; font-size:16px; line-height:27px; color:#475569;">${escapeHtml(subtitle)}</p>` : ''}
            </td>
          </tr>
          ` : ''}
  `;
}

/**
 * Build standard footer with contact info, social links, and legal
 * @param {Object} options
 * @param {boolean} options.isNewsletter - Whether this is a newsletter email
 * @returns {string} Footer HTML
 */
function buildFooter({ isNewsletter = false } = {}) {
  const year = new Date().getFullYear();
  
  return `
          <!-- CONTACT / SOCIAL FOOTER -->
          <tr>
            <td style="background-color:#0f172a; padding:28px 35px;">
              <div style="text-align:center; font-size:17px; font-weight:700; color:#ffffff; margin-bottom:18px;">Let's Connect</div>

              <!-- Email -->
              <div style="text-align:center; margin-bottom:9px;">
                <a href="mailto:${BRAND.email}" style="color:#cbd5e1; text-decoration:none; font-size:13px;">✉ ${BRAND.email}</a>
              </div>

              <!-- Phone -->
              <div style="text-align:center; margin-bottom:9px;">
                <a href="tel:+919685533878" style="color:#cbd5e1; text-decoration:none; font-size:13px;">☎ +91 96855 33878</a>
              </div>

              <!-- WhatsApp -->
              <div style="text-align:center; margin-bottom:18px;">
                <a href="${BRAND.whatsapp}" target="_blank" style="color:#86efac; text-decoration:none; font-size:13px; font-weight:600;">💬 WhatsApp</a>
              </div>

              <!-- Social Links -->
              <table role="presentation" align="center" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding:0 5px;">
                    <a href="${BRAND.linkedin}" target="_blank" style="display:inline-block; color:#ffffff; text-decoration:none; font-size:12px; padding:8px 11px; border:1px solid #334155; border-radius:6px;">LinkedIn</a>
                  </td>
                  <td style="padding:0 5px;">
                    <a href="${BRAND.instagram}" target="_blank" style="display:inline-block; color:#ffffff; text-decoration:none; font-size:12px; padding:8px 11px; border:1px solid #334155; border-radius:6px;">Instagram</a>
                  </td>
                  <td style="padding:0 5px;">
                    <a href="${BRAND.github}" target="_blank" style="display:inline-block; color:#ffffff; text-decoration:none; font-size:12px; padding:8px 11px; border:1px solid #334155; border-radius:6px;">GitHub</a>
                  </td>
                  <td style="padding:0 5px;">
                    <a href="${BRAND.portfolio}" target="_blank" style="display:inline-block; color:#ffffff; text-decoration:none; font-size:12px; padding:8px 11px; border:1px solid #334155; border-radius:6px;">Portfolio</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td align="center" style="background-color:#020617; padding:18px 25px;">
              <p style="margin:0; font-size:11px; line-height:18px; color:#64748b;">
                ${isNewsletter 
                  ? `You're receiving this email because you subscribed to the newsletter at <a href="${BRAND.portfolio}" target="_blank" style="color:#94a3b8; text-decoration:none;">${BRAND.portfolio}</a>.`
                  : `This is an automated email sent from <a href="${BRAND.portfolio}" target="_blank" style="color:#94a3b8; text-decoration:none;">${BRAND.portfolio}</a>.`}
              </p>
              <p style="margin:5px 0 0 0; font-size:11px; color:#475569;">© ${year} ${BRAND.name}. All rights reserved.</p>
            </td>
          </tr>
  `;
}

/**
 * Build a CTA button
 */
function buildCtaButton({ text, url, backgroundColor = COLORS.primary, textColor = '#ffffff', width = '100%' }) {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:28px;">
      <tr>
        <td align="center">
          <a href="${escapeHtml(url)}" target="_blank" style="display:inline-block; background-color:${backgroundColor}; color:${textColor}; text-decoration:none; font-size:14px; font-weight:700; padding:13px 28px; border-radius:8px; width:${width};">
            ${escapeHtml(text)}
          </a>
        </td>
      </tr>
    </table>
  `;
}

/**
 * Build a card-style content block
 */
function buildContentCard({ title, content, icon, backgroundColor = '#f8fafc', borderColor = '#e2e8f0' }) {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:${backgroundColor}; border:1px solid ${borderColor}; border-radius:12px;">
      <tr>
        <td style="padding:25px;">
          <div style="font-size:19px; font-weight:700; color:#0f172a; margin-bottom:20px;">${escapeHtml(title)}</div>
          ${content}
        </td>
      </tr>
    </table>
  `;
}

/**
 * Build a list item with icon
 */
function buildListItem({ icon, title, description, iconBgColor = '#dbeafe' }) {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:15px;">
      <tr>
        <td width="42" valign="top">
          <div style="width:34px; height:34px; line-height:34px; text-align:center; background-color:${iconBgColor}; border-radius:8px; font-size:17px;">${icon}</div>
        </td>
        <td valign="top">
          <div style="font-size:14px; font-weight:700; color:#1e293b; margin-bottom:3px;">${escapeHtml(title)}</div>
          <div style="font-size:13px; line-height:20px; color:#64748b;">${escapeHtml(description)}</div>
        </td>
      </tr>
    </table>
  `;
}

module.exports = {
  BRAND,
  COLORS,
  escapeHtml,
  escapeHtmlPlain,
  buildEmailHtml,
  buildHeader,
  buildFooter,
  buildCtaButton,
  buildContentCard,
  buildListItem
};