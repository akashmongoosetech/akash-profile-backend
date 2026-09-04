const { 
  buildEmailHtml, 
  buildHeader, 
  buildFooter, 
  buildCtaButton,
  buildListItem,
  escapeHtml,
  escapeHtmlPlain 
} = require('./base.template');

/**
 * Newsletter Subscription - Welcome Email
 * Sent to new subscribers
 */
function subscriptionWelcome(subscriptionData) {
  const { firstName, email } = subscriptionData;
  
  const headerHtml = buildHeader({
    title: 'Welcome to the Newsletter! 🚀',
    badgeText: 'Newsletter Subscriber',
    badgeColor: '#2563eb'
  });

  const bodyHtml = `
          <!-- MAIN CONTENT -->
          <tr>
            <td style="padding:20px 35px 35px 35px;">
              {% comment %} <div style="display:inline-block; background-color:#eff6ff; color:#2563eb; font-size:12px; font-weight:700; letter-spacing:0.7px; text-transform:uppercase; padding:7px 12px; border-radius:20px; margin-bottom:16px;">Newsletter Subscriber</div> {% endcomment %}

              {% comment %} <h1 style="margin:0 0 18px 0; font-size:30px; line-height:38px; color:#0f172a;">Welcome to the Newsletter! 🚀</h1> {% endcomment %}

              <p style="margin:0 0 18px 0; font-size:16px; line-height:27px; color:#475569;">Hi ${escapeHtmlPlain(firstName || 'there')},</p>

              <p style="margin:0 0 18px 0; font-size:15px; line-height:26px; color:#475569;">Thanks for subscribing to my newsletter. I\'m excited to have you here!</p>

              <p style="margin:0 0 25px 0; font-size:15px; line-height:26px; color:#475569;">From time to time, I\'ll share practical insights from my work as a software engineer, along with projects, development tips, AI innovations, automation ideas, and useful technology trends.</p>

              <!-- WHAT YOU'LL RECEIVE -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f8fafc; border:1px solid #e2e8f0; border-radius:12px;">
                <tr>
                  <td style="padding:25px;">
                    <div style="font-size:19px; font-weight:700; color:#0f172a; margin-bottom:20px;">What you'll receive</div>

                    ${buildListItem({ icon: '💻', title: 'Projects & Case Studies', description: 'Behind-the-scenes insights from real-world development projects.' })}
                    ${buildListItem({ icon: '🤖', title: 'AI & Automation', description: 'Practical ideas around AI, chatbots, automation and modern business solutions.' })}
                    ${buildListItem({ icon: '💡', title: 'Development Tips', description: 'Useful techniques, best practices and lessons learned from software development.' })}
                    ${buildListItem({ icon: '🚀', title: 'Technology & Industry Trends', description: 'Emerging technologies, tools and trends shaping the future of software.' })}

                  </td>
                </tr>
              </table>

              <!-- FIRST NEWSLETTER MESSAGE -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:24px;">
                <tr>
                  <td style="background-color:#eff6ff; border:1px solid #dbeafe; border-radius:12px; padding:20px;">
                    <div style="font-size:15px; font-weight:700; color:#1e40af; margin-bottom:7px;">You're officially on the list 🎉</div>
                    <div style="font-size:13px; line-height:22px; color:#475569;">Keep an eye on your inbox. I'll be sharing useful content and updates periodically.</div>
                  </td>
                </tr>
              </table>

              <!-- PORTFOLIO CTA -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:28px;">
                <tr>
                  <td align="center">
                    <div style="font-size:14px; line-height:22px; color:#64748b; margin-bottom:15px;">Want to explore my work right now?</div>
                    <a href="https://akashraikwar.in/" target="_blank" style="display:inline-block; background-color:#2563eb; color:#ffffff; text-decoration:none; font-size:14px; font-weight:700; padding:13px 28px; border-radius:8px;">Explore My Portfolio →</a>
                  </td>
                </tr>
              </table>

              <!-- WHATSAPP CTA -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:25px;">
                <tr>
                  <td align="center" style="background-color:#f0fdf4; border:1px solid #bbf7d0; border-radius:12px; padding:22px;">
                    <div style="font-size:16px; font-weight:700; color:#166534; margin-bottom:7px;">Have a project or idea?</div>
                    <div style="font-size:13px; line-height:21px; color:#4d7c0f; margin-bottom:17px;">Feel free to reach out. I'd love to hear about it.</div>
                    <a href="https://wa.me/919685533878?text=Hi%20Akash%2C%20I%27m%20a%20newsletter%20subscriber%20and%20I%27d%20like%20to%20discuss%20a%20project." target="_blank" style="display:inline-block; background-color:#16a34a; color:#ffffff; text-decoration:none; font-size:14px; font-weight:700; padding:12px 22px; border-radius:8px;">💬 Chat with me on WhatsApp</a>
                  </td>
                </tr>
              </table>

              <!-- SIGNATURE -->
              <div style="margin-top:32px; padding-top:24px; border-top:1px solid #e2e8f0;">
                <p style="margin:0 0 5px 0; font-size:14px; color:#475569;">Looking forward to having you along for the journey.</p>
                <p style="margin:15px 0 0 0; font-size:18px; font-weight:700; color:#0f172a;">Akash Raikwar</p>
                <p style="margin:4px 0 0 0; font-size:13px; color:#64748b;">Software Engineer</p>
              </div>
            </td>
          </tr>
  `;

  const footerHtml = buildFooter({ isNewsletter: true });

  return {
    subject: 'Welcome to the Newsletter! 🚀',
    htmlContent: buildEmailHtml({
      preheader: 'Welcome to the Akash Raikwar Newsletter - Thanks for subscribing!',
      headerHtml,
      bodyHtml,
      footerHtml: buildFooter({ isNewsletter: true })
    }),
    textContent: `Welcome to the Newsletter! 🚀\n\nHi ${firstName || 'there'},\n\nThanks for subscribing to my newsletter! I'm excited to have you here.\n\nFrom time to time, I'll share practical insights from my work as a software engineer, along with projects, development tips, AI innovations, automation ideas, and useful technology trends.\n\nWhat you'll receive:\n- Projects & Case Studies\n- AI & Automation\n- Development Tips\n- Technology & Industry Trends\n\nBest regards,\nAkash Raikwar\nSoftware Engineer`
  };
}

module.exports = subscriptionWelcome;