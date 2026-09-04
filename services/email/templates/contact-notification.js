const { 
  buildEmailHtml, 
  buildHeader, 
  buildFooter, 
  buildCtaButton,
  buildContentCard,
  escapeHtml,
  escapeHtmlPlain 
} = require('./base.template');

/**
 * Contact Form - Admin Notification
 * Sent to admin when a new contact form is submitted
 */
function contactNotification(contactData) {
  const { name, email, mobile, subject, message } = contactData;
  
  const headerHtml = buildHeader({
    title: 'New Contact Form Submission',
    badgeText: 'New Contact',
    badgeColor: '#2563eb'
  });

  const bodyHtml = `
          <!-- MAIN CONTENT -->
          <tr>
            <td style="padding:20px 35px 35px 35px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f8fafc; border-radius:12px; border:1px solid #e2e8f0;">
                <tr>
                  <td style="padding:24px;">
                    <div style="font-size:13px; font-weight:700; letter-spacing:0.5px; text-transform:uppercase; color:#64748b; margin-bottom:16px;">Contact Details</div>
                    <p style="margin:0 0 8px 0; font-size:15px; color:#475569;"><strong>Name:</strong> ${escapeHtmlPlain(name)}</p>
                    <p style="margin:0 0 8px 0; font-size:15px; color:#475569;"><strong>Email:</strong> ${escapeHtmlPlain(email)}</p>
                    ${mobile ? `<p style="margin:0 0 8px 0; font-size:15px; color:#475569;"><strong>Mobile:</strong> ${escapeHtmlPlain(mobile)}</p>` : ''}
                    <p style="margin:0 0 8px 0; font-size:15px; color:#475569;"><strong>Subject:</strong> ${escapeHtmlPlain(subject)}</p>
                    <p style="margin:0 0 8px 0; font-size:15px; color:#475569;"><strong>Message:</strong></p>
                    <div style="background-color:#ffffff; padding:16px; border-radius:8px; border-left:4px solid #2563eb; font-size:14px; line-height:24px; color:#475569; margin-top:8px;">
                      ${escapeHtml(message)}
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Timestamp -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:20px;">
                <tr>
                  <td style="background-color:#fef3c7; padding:15px; border-radius:8px; border-left:4px solid #f59e0b;">
                    <p style="margin:0; color:#92400e;"><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
  `;

  const footerHtml = buildFooter();

  return {
    subject: `New Contact Form Submission: ${escapeHtmlPlain(subject)}`,
    htmlContent: buildEmailHtml({
      preheader: `New contact from ${escapeHtmlPlain(name)} - ${escapeHtmlPlain(subject)}`,
      headerHtml,
      bodyHtml,
      footerHtml: buildFooter()
    }),
    textContent: `New Contact Form Submission\n\nName: ${name}\nEmail: ${email}\n${mobile ? `Mobile: ${mobile}\n` : ''}Subject: ${subject}\nMessage: ${message}\n\nSubmitted: ${new Date().toLocaleString()}`
  };
}

module.exports = contactNotification;