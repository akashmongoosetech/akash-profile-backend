const { 
  buildEmailHtml, 
  buildHeader, 
  buildFooter, 
  buildCtaButton,
  escapeHtml,
  escapeHtmlPlain 
} = require('./base.template');

const BRAND = {
  name: 'Akash Raikwar',
  title: 'Software Engineer',
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

/**
 * Contact Form - User Confirmation
 * Sent to the user who submitted the contact form
 */
function contactConfirmation(contactData) {
  const { name, email, mobile, subject, message } = contactData;
  
  const headerHtml = buildHeader({
    title: 'Thank You for Reaching Out!',
    subtitle: `We received your message: "${escapeHtmlPlain(subject)}"`,
    badgeText: 'Message Received',
    badgeColor: '#2563eb'
  });

  const bodyHtml = `
          <!-- MAIN CONTENT -->
          <tr>
            <td style="padding:20px 35px 35px 35px;">
              <p style="margin:0 0 18px 0; font-size:16px; line-height:27px; color:#475569;">Hi ${escapeHtmlPlain(name)},</p>

              <p style="margin:0 0 20px 0; font-size:15px; line-height:26px; color:#475569;">
                Thank you for contacting me through my portfolio website. I\'ve successfully received your message and will review your inquiry carefully.
              </p>

              <p style="margin:0 0 25px 0; font-size:15px; line-height:26px; color:#475569;">
                I\'ll get back to you as soon as possible. I appreciate you taking the time to reach out and look forward to connecting with you.
              </p>

              <!-- MESSAGE CARD -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f8fafc; border-radius:12px; border:1px solid #e2e8f0;">
                <tr>
                  <td style="padding:24px;">
                    <div style="font-size:13px; font-weight:700; letter-spacing:0.5px; text-transform:uppercase; color:#64748b; margin-bottom:16px;">Your Message</div>

                    <div style="font-size:16px; font-weight:700; color:#0f172a; margin-bottom:15px;">${escapeHtmlPlain(subject)}</div>

                    <div style="background-color:#ffffff; border-left:4px solid #2563eb; border-radius:8px; padding:16px; font-size:14px; line-height:24px; color:#475569;">
                      ${escapeHtml(message)}
                    </div>
                  </td>
                </tr>
              </table>

              <!-- RESPONSE TIME -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:22px;">
                <tr>
                  <td style="background-color:#eff6ff; border:1px solid #dbeafe; border-radius:10px; padding:16px 18px;">
                    <p style="margin:0; font-size:14px; line-height:23px; color:#1e40af;"><strong>Response Time</strong><br>I typically respond within 24–48 hours. I\'ll get back to you with the next steps after reviewing your message.</p>
                  </td>
                </tr>
              </table>

              <!-- WHAT'S NEXT -->
              <div style="margin-top:28px; margin-bottom:10px; font-size:18px; font-weight:700; color:#0f172a;">What happens next?</div>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding:8px 0;">
                    <span style="display:inline-block; width:26px; height:26px; line-height:26px; text-align:center; border-radius:50%; background-color:#dbeafe; color:#2563eb; font-size:13px; font-weight:bold;">1</span>
                    <span style="margin-left:8px; font-size:14px; color:#475569;">I\'ll review your message and requirements.</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;">
                    <span style="display:inline-block; width:26px; height:26px; line-height:26px; text-align:center; border-radius:50%; background-color:#dbeafe; color:#2563eb; font-size:13px; font-weight:bold;">2</span>
                    <span style="margin-left:8px; font-size:14px; color:#475569;">I\'ll contact you if additional information is required.</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;">
                    <span style="display:inline-block; width:26px; height:26px; line-height:26px; text-align:center; border-radius:50%; background-color:#dbeafe; color:#2563eb; font-size:13px; font-weight:bold;">3</span>
                    <span style="margin-left:8px; font-size:14px; color:#475569;">I\'ll share a detailed response, solution, or proposal.</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;">
                    <span style="display:inline-block; width:26px; height:26px; line-height:26px; text-align:center; border-radius:50%; background-color:#dbeafe; color:#2563eb; font-size:13px; font-weight:bold;">4</span>
                    <span style="margin-left:8px; font-size:14px; color:#475569;">We can schedule a call to discuss your project.</span>
                  </td>
                </tr>
              </table>

              <!-- WHATSAPP CTA -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:30px;">
                <tr>
                  <td align="center" style="background-color:#f0fdf4; border:1px solid #bbf7d0; border-radius:12px; padding:22px;">
                    <div style="font-size:16px; font-weight:700; color:#166534; margin-bottom:7px;">Need a quicker response?</div>
                    <div style="font-size:13px; line-height:21px; color:#4d7c0f; margin-bottom:17px;">You can also contact me directly on WhatsApp.</div>
                    <a href="https://wa.me/919685533878?text=Hi%20Akash%2C%20I%20just%20contacted%20you%20through%20your%20portfolio." target="_blank" style="display:inline-block; background-color:#16a34a; color:#ffffff; text-decoration:none; font-size:14px; font-weight:700; padding:12px 22px; border-radius:8px;">💬 Chat with me on WhatsApp</a>
                  </td>
                </tr>
              </table>

              <!-- WEBSITE CTA -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:25px;">
                <tr>
                  <td align="center">
                    <a href="https://akashraikwar.in/" target="_blank" style="display:inline-block; background-color:#2563eb; color:#ffffff; text-decoration:none; font-size:14px; font-weight:700; padding:13px 28px; border-radius:8px;">Visit My Portfolio →</a>
                  </td>
                </tr>
              </table>

              <!-- SIGNATURE -->
              <div style="margin-top:35px; padding-top:25px; border-top:1px solid #e2e8f0;">
                <p style="margin:0 0 5px 0; font-size:15px; color:#475569;">Best regards,</p>
                <p style="margin:0; font-size:18px; font-weight:700; color:#0f172a;">Akash Raikwar</p>
                <p style="margin:4px 0 0 0; font-size:13px; color:#64748b;">Software Engineer</p>
              </div>
            </td>
          </tr>
  `;

  const footerHtml = buildFooter();

  return {
    subject: `Thank you for contacting me - ${escapeHtmlPlain(subject)}`,
    htmlContent: buildEmailHtml({
      preheader: `Thank you for contacting ${BRAND.name} - We received your message`,
      headerHtml,
      bodyHtml,
      footerHtml: buildFooter()
    }),
    textContent: `Thank You for Reaching Out!\n\nHi ${name},\n\nThank you for contacting me through my portfolio website. I've received your message and will get back to you as soon as possible.\n\nYour Message Details:\nSubject: ${subject}\nMessage: ${message}\n\nI typically respond within 24-48 hours.\n\nBest regards,\nAkash Raikwar\nSoftware Engineer`
  };
}

module.exports = contactConfirmation;