const { 
  buildEmailHtml, 
  buildHeader, 
  buildFooter, 
  buildCtaButton,
  escapeHtml,
  escapeHtmlPlain 
} = require('./base.template');

/**
 * Event Registration Confirmation
 * Sent to user after registering for an event
 */
function eventRegistrationConfirmation(regData, eventData) {
  const { fullName, email, phone, company, jobTitle } = regData;
  
  const dateStr = new Date(eventData.date).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  const timeStr = new Date(eventData.date).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short'
  });

  const headerHtml = buildHeader({
    title: `Registration Confirmed: ${escapeHtmlPlain(eventData.title)}`,
    badgeText: 'Registration Confirmed',
    badgeColor: '#10b981'
  });

  const bodyHtml = `
          <!-- MAIN CONTENT -->
          <tr>
            <td style="padding:20px 35px 35px 35px;">
              <p style="margin:0 0 18px 0; font-size:16px; line-height:27px; color:#475569;">Hi ${escapeHtmlPlain(fullName)},</p>

              <p style="margin:0 0 20px 0; font-size:15px; line-height:26px; color:#475569;">Your registration for the following event has been confirmed:</p>

              <!-- EVENT CARD -->
              <div style="background: linear-gradient(135deg,#3b82f6,#8b5cf6); padding:2px; border-radius:12px; margin:20px 0;">
                <div style="background: white; padding:24px; border-radius:10px;">
                  <h3 style="color:#0f172a; margin-top:0;">${escapeHtmlPlain(eventData.title)}</h3>
                  <p style="color:#64748b;"><strong>Date:</strong> ${dateStr}</p>
                  <p style="color:#64748b;"><strong>Time:</strong> ${timeStr}</p>
                  <p style="color:#64748b;"><strong>Location:</strong> ${escapeHtmlPlain(eventData.location)}</p>
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

              <p style="margin-top:25px; font-size:15px; color:#475569;">Best regards,<br><strong>Akash Raikwar</strong></p>
            </td>
          </tr>
  `;

  const footerHtml = buildFooter();

  return {
    subject: `Registration Confirmed: ${escapeHtmlPlain(eventData.title)}`,
    htmlContent: buildEmailHtml({
      preheader: `Registration confirmed for ${escapeHtmlPlain(eventData.title)}`,
      headerHtml: buildHeader({
        title: `Registration Confirmed: ${escapeHtmlPlain(eventData.title)}`,
        badgeText: 'Registration Confirmed',
        badgeColor: '#10b981'
      }),
      bodyHtml,
      footerHtml: buildFooter()
    }),
    textContent: `Registration Confirmed: ${eventData.title}\n\nHi ${fullName},\n\nYour registration for "${eventData.title}" has been confirmed.\n\nEvent Details:\nDate: ${dateStr}\nTime: ${timeStr}\nLocation: ${eventData.location}\n${eventData.meetingLink ? `Join Link: ${eventData.meetingLink}\n` : ''}\n\nBest regards,\nAkash Raikwar`
  };
}

module.exports = eventRegistrationConfirmation;