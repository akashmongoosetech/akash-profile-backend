const {
  buildEmailHtml,
  buildHeader,
  buildFooter,
  buildCtaButton,
  escapeHtml,
  escapeHtmlPlain
} = require('./base.template');

function resolveImageUrl(imagePath, baseUrl) {
  if (!imagePath) return '';
  if (/^https?:\/\//i.test(imagePath)) return imagePath;
  const appBaseUrl = baseUrl || process.env.PUBLIC_API_URL || process.env.BACKEND_URL || process.env.APP_URL || '';
  if (appBaseUrl) {
    return `${appBaseUrl}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
  }
  return imagePath;
}

/**
 * Event Registration Confirmation
 * Sent to user after registering for an event
 */
function eventRegistrationConfirmation(regData, eventData, baseUrl) {
  const { fullName, email, phone, company, jobTitle } = regData;

  const dateStr = new Date(eventData.date).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  const timeStr = new Date(eventData.date).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short'
  });

  const eventImage = resolveImageUrl(eventData.image, baseUrl);
  const hostImage = resolveImageUrl(eventData.host?.image, baseUrl);
  const hostName = eventData.host?.name || '';
  const hostTitle = eventData.host?.title || '';
  const hostDescription = eventData.host?.shortDescription || '';
  const hasHost = hostName || hostTitle || hostDescription || hostImage;

  const bodyHtml = `
          <!-- MAIN CONTENT -->
          <tr>
            <td style="padding:20px 35px 35px 35px;">
              <p style="margin:0 0 18px 0; font-size:16px; line-height:27px; color:#475569;">Hi ${escapeHtmlPlain(fullName)},</p>

              <p style="margin:0 0 20px 0; font-size:15px; line-height:26px; color:#475569;">Your registration for the following event has been confirmed:</p>

              <!-- EVENT CARD -->
              <div style="background: linear-gradient(135deg,#3b82f6,#8b5cf6); padding:2px; border-radius:12px; margin:20px 0;">
                ${eventImage ? `
                <div style="border-radius:10px 10px 0 0; overflow:hidden; line-height:0;">
                  <img
                    src="${escapeHtml(eventImage)}"
                    alt="${escapeHtml(eventData.title)}"
                    width="600"
                    style="display:block; width:100%; max-width:600px; height:auto; border:0;"
                  />
                </div>
                ` : ''}
                <div style="background: white; padding:24px; border-radius:${eventImage ? '0 0 10px 10px' : '10px'};">
                  <h3 style="color:#0f172a; margin-top:0;">${escapeHtmlPlain(eventData.title)}</h3>
                  ${eventData.shortDescription ? `<p style="color:#64748b; margin-top:8px; line-height:22px;">${escapeHtml(eventData.shortDescription)}</p>` : ''}
                  <p style="color:#64748b; margin-top:12px;"><strong>Date:</strong> ${dateStr}</p>
                  <p style="color:#64748b;"><strong>Time:</strong> ${timeStr}</p>
                  <p style="color:#64748b;"><strong>Duration:</strong> ${eventData.duration ? eventData.duration + ' min' : ''}</p>
                  <p style="color:#64748b;"><strong>Location:</strong> ${escapeHtmlPlain(eventData.location)}</p>
                  ${eventData.price !== undefined ? `<p style="color:#64748b;"><strong>Price:</strong> ${eventData.price === 0 ? 'Free' : eventData.price + ' ' + escapeHtmlPlain(eventData.currency)}</p>` : ''}
                  ${eventData.meetingLink ? `<p style="color:#64748b;"><strong>Join Link:</strong> <a href="${escapeHtmlPlain(eventData.meetingLink)}">${escapeHtmlPlain(eventData.meetingLink)}</a></p>` : ''}
                </div>
              </div>

              <!-- Registration Details -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f8fafc; border-radius:12px; border:1px solid #e2e8f0; margin-top:20px;">
                <tr>
                  <td style="padding:24px;">
                    <h4 style="color:#0f172a; margin-top:0;">Your Registration Details</h4>
                    <p style="margin:0 0 8px 0; color:#475569;"><strong>Name:</strong> ${escapeHtmlPlain(fullName)}</p>
                    <p style="margin:0 0 8px 0; color:#475569;"><strong>Email:</strong> ${escapeHtmlPlain(email)}</p>
                    ${phone ? `<p style="margin:0 0 8px 0; color:#475569;"><strong>Phone:</strong> ${escapeHtmlPlain(phone)}</p>` : ''}
                    ${company ? `<p style="margin:0 0 8px 0; color:#475569;"><strong>Company:</strong> ${escapeHtmlPlain(company)}</p>` : ''}
                    ${jobTitle ? `<p style="margin:0 0 8px 0; color:#475569;"><strong>Job Title:</strong> ${escapeHtmlPlain(jobTitle)}</p>` : ''}
                  </td>
                </tr>
              </table>

              ${eventData.meetingLink ? `
              <!-- JOIN BUTTON -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:20px;">
                <tr>
                  <td style="background-color:#ecfdf5; padding:15px; border-radius:8px; border:1px solid #bbf7d0;">
                    <p style="margin:0; color:#065f46;"><strong>Join the event:</strong><br><a href="${escapeHtmlPlain(eventData.meetingLink)}" style="color:#2563eb;">Click here to join</a></p>
                  </td>
                </tr>
              </table>
              ` : ''}

              ${hasHost ? `
              <!-- HOST SECTION -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f8fafc; border-radius:12px; border:1px solid #e2e8f0; margin-top:20px;">
                <tr>
                  <td style="padding:24px;">
                    <h4 style="color:#0f172a; margin-top:0; margin-bottom:18px;">Hosted By</h4>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td width="80" valign="top" style="padding-right:18px;">
                          ${hostImage ? `
                          <img
                            src="${escapeHtml(hostImage)}"
                            alt="${escapeHtml(hostName)}"
                            width="80"
                            height="80"
                            style="display:block; width:80px; height:80px; border-radius:50%; object-fit:cover; border:0;"
                          />
                          ` : ''}
                        </td>
                        <td valign="top">
                          ${hostName ? `<div style="font-size:16px; font-weight:700; color:#0f172a; margin-bottom:4px;">${escapeHtml(hostName)}</div>` : ''}
                          ${hostTitle ? `<div style="font-size:13px; color:#64748b; margin-bottom:6px;">${escapeHtml(hostTitle)}</div>` : ''}
                          ${hostDescription ? `<p style="margin:0; font-size:13px; line-height:20px; color:#475569;">${escapeHtml(hostDescription)}</p>` : ''}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              ` : ''}

              <p style="margin-top:25px; font-size:15px; color:#475569;">Best regards,<br><strong>Akash Raikwar</strong></p>
            </td>
          </tr>
  `;

  const headerHtml = buildHeader({
    title: `Registration Confirmed: ${escapeHtmlPlain(eventData.title)}`,
    badgeText: 'Registration Confirmed',
    badgeColor: '#10b981'
  });

  const footerHtml = buildFooter();

  return {
    subject: `Registration Confirmed: ${escapeHtmlPlain(eventData.title)}`,
    htmlContent: buildEmailHtml({
      preheader: `Registration confirmed for ${escapeHtmlPlain(eventData.title)}`,
      headerHtml,
      bodyHtml,
      footerHtml
    }),
    textContent: `Registration Confirmed: ${eventData.title}\n\nHi ${fullName},\n\nYour registration for "${eventData.title}" has been confirmed.\n\nEvent Details:\nDate: ${dateStr}\nTime: ${timeStr}\nDuration: ${eventData.duration ? eventData.duration + ' min' : ''}\nLocation: ${eventData.location}\n${eventData.price !== undefined ? `Price: ${eventData.price === 0 ? 'Free' : eventData.price + ' ' + eventData.currency}\n` : ''}${eventData.meetingLink ? `Join Link: ${eventData.meetingLink}\n` : ''}\n${hostName ? `Host: ${hostName}\n${hostTitle ? 'Title: ' + hostTitle + '\n' : ''}${hostDescription ? 'About: ' + hostDescription + '\n' : ''}\n` : ''}\nBest regards,\nAkash Raikwar`
  };
}

module.exports = eventRegistrationConfirmation;
