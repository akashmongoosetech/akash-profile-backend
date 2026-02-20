const nodemailer = require('nodemailer');

// Helper function to escape HTML characters
const escapeHtml = (text) => {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\n/g, '<br>');
};

// Helper function to escape HTML but preserve newlines for display
const escapeHtmlPlain = (text) => {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

// Create transporter
const createTransporter = () => {
  // Validate email configuration
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('❌ Email configuration is incomplete!');
    console.error('📧 Required: EMAIL_HOST, EMAIL_USER, EMAIL_PASS');
    throw new Error('Email configuration is incomplete. Please set environment variables.');
  }
  
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Email templates
const emailTemplates = {
  contactNotification: (contactData) => ({
    subject: `New Contact Form Submission: ${escapeHtmlPlain(contactData.subject)}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
          New Contact Form Submission
        </h2>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1e293b; margin-top: 0;">Contact Details</h3>
          <p><strong>Name:</strong> ${escapeHtmlPlain(contactData.name)}</p>
          <p><strong>Email:</strong> ${escapeHtmlPlain(contactData.email)}</p>
          ${contactData.mobile ? `<p><strong>Mobile:</strong> ${escapeHtmlPlain(contactData.mobile)}</p>` : ''}
          <p><strong>Subject:</strong> ${escapeHtmlPlain(contactData.subject)}</p>
          <p><strong>Message:</strong></p>
          <div style="background-color: white; padding: 15px; border-radius: 5px; border-left: 4px solid #2563eb;">
            ${escapeHtml(contactData.message)}
          </div>
        </div>
        
        <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
          <p style="margin: 0; color: #92400e;">
            <strong>Submitted:</strong> ${new Date().toLocaleString()}
          </p>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          <p style="color: #64748b; font-size: 14px;">
            This is an automated notification from your portfolio website contact form.
          </p>
        </div>
      </div>
    `
  }),

  contactConfirmation: (contactData) => ({
    subject: `Thank you for contacting me - ${escapeHtmlPlain(contactData.subject)}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
          Thank You for Reaching Out!
        </h2>
        
        <p>Hi ${escapeHtmlPlain(contactData.name)},</p></p>
        
        <p>Thank you for contacting me through my portfolio website. I've received your message and will get back to you as soon as possible.</p>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1e293b; margin-top: 0;">Your Message Details</h3>
          <p><strong>Subject:</strong> ${contactData.subject}</p>
          <p><strong>Message:</strong></p>
          <div style="background-color: white; padding: 15px; border-radius: 5px; border-left: 4px solid #2563eb;">
            ${escapeHtml(contactData.message)}
          </div>
        </div>
        
        <p>I typically respond within 24-48 hours. If your inquiry is urgent, please don't hesitate to reach out through my other contact channels.</p>
        
        <div style="background-color: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4 style="color: #065f46; margin-top: 0;">What's Next?</h4>
          <ul style="color: #047857;">
            <li>I'll review your message and requirements</li>
            <li>If needed, I'll ask for additional details</li>
            <li>I'll provide a detailed response or proposal</li>
            <li>We can schedule a call to discuss further</li>
          </ul>
        </div>
        
        <p>Best regards,<br>
        <strong>Akash Raikwar</strong><br>
        Software Engineer</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          <p style="color: #64748b; font-size: 12px;">
            This is an automated confirmation email. Please do not reply to this email.
          </p>
        </div>
      </div>
    `
  }),

  subscriptionWelcome: (subscriptionData) => ({
    subject: 'Welcome to My Newsletter! 🚀',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
          Welcome to My Newsletter!
        </h2>
        
        <p>Hi ${subscriptionData.firstName || 'there'},</p>
        
        <p>Thank you for subscribing to my newsletter! I'm excited to share my latest projects, tech insights, and industry trends with you.</p>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1e293b; margin-top: 0;">What You'll Receive</h3>
          <ul style="color: #374151;">
            <li>📱 Latest project updates and case studies</li>
            <li>💡 Tech insights and best practices</li>
            <li>🚀 Industry trends and emerging technologies</li>
            <li>🎯 Tips for developers and tech enthusiasts</li>
          </ul>
        </div>
        
        <p>I'll be sending newsletters periodically with valuable content. You can unsubscribe at any time if you find the content isn't relevant to you.</p>
        
        <div style="background-color: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #065f46;">
            <strong>Stay tuned for the first newsletter coming soon!</strong>
          </p>
        </div>
        
        <p>Best regards,<br>
        <strong>Akash Raikwar</strong><br>
        Software Engineer</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          <p style="color: #64748b; font-size: 12px;">
            You can unsubscribe anytime by clicking the unsubscribe link in future emails.
          </p>
        </div>
      </div>
    `
  }),

  newsletter: (subscribers, newsletterData) => ({
    subject: newsletterData.subject,
    html: newsletterData.html
  })
};

// Email service functions
const emailService = {
  // Send contact form notification to admin
  async sendContactNotification(contactData) {
    try {
      const transporter = createTransporter();
      const template = emailTemplates.contactNotification(contactData);
      
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: process.env.EMAIL_USER,
        subject: template.subject,
        html: template.html
      };

      const result = await transporter.sendMail(mailOptions);
      console.log('✅ Contact notification sent:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Error sending contact notification:', error);
      throw error;
    }
  },

  // Send confirmation email to contact form submitter
  async sendContactConfirmation(contactData) {
    try {
      const transporter = createTransporter();
      const template = emailTemplates.contactConfirmation(contactData);
      
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: contactData.email,
        subject: template.subject,
        html: template.html
      };

      const result = await transporter.sendMail(mailOptions);
      console.log('✅ Contact confirmation sent:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Error sending contact confirmation:', error);
      throw error;
    }
  },

  // Send welcome email to new subscribers
  async sendSubscriptionWelcome(subscriptionData) {
    try {
      const transporter = createTransporter();
      const template = emailTemplates.subscriptionWelcome(subscriptionData);
      
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: subscriptionData.email,
        subject: template.subject,
        html: template.html
      };

      const result = await transporter.sendMail(mailOptions);
      console.log('✅ Subscription welcome sent:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Error sending subscription welcome:', error);
      throw error;
    }
  },

  // Send newsletter to subscribers
  async sendNewsletter(subscribers, newsletterData) {
    try {
      const transporter = createTransporter();
      const template = emailTemplates.newsletter(subscribers, newsletterData);
      
      const results = [];
      
      for (const subscriber of subscribers) {
        const mailOptions = {
          from: process.env.EMAIL_FROM,
          to: subscriber.email,
          subject: template.subject,
          html: template.html
        };

        const result = await transporter.sendMail(mailOptions);
        results.push({ email: subscriber.email, messageId: result.messageId });
      }

      console.log(`✅ Newsletter sent to ${results.length} subscribers`);
      return { success: true, results };
    } catch (error) {
      console.error('❌ Error sending newsletter:', error);
      throw error;
    }
  },

  // Test email configuration
  async testConnection() {
    try {
      const transporter = createTransporter();
      await transporter.verify();
      console.log('✅ Email service is ready');
      return { success: true, message: 'Email service is ready' };
    } catch (error) {
      console.error('❌ Email service test failed:', error);
      throw error;
    }
  }
};

module.exports = emailService; 