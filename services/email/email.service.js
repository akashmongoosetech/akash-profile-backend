/**
 * Email Service - High-level email orchestration
 * Replaces nodemailer-based emailService.js
 * Uses Brevo API for delivery, templates for content
 */

const brevoService = require('./brevo.service');
const templates = require('./templates');

class EmailService {
  constructor() {
    this.initialized = false;
  }

  /**
   * Initialize email service
   */
  async initialize() {
    if (this.initialized) return true;
    
    try {
      await brevoService.testConnection();
      this.initialized = true;
      console.log('✅ Email service initialized with Brevo');
      return true;
    } catch (error) {
      console.error('❌ Email service initialization failed:', error.message);
      // Don't throw - let server continue without email
      return false;
    }
  }

  /**
   * Send contact form notification to admin
   */
  async sendContactNotification(contactData) {
    try {
      const template = templates.contactNotification(contactData);
      const result = await brevoService.sendEmail({
        to: process.env.EMAIL_FROM || 'info@akashraikwar.in',
        subject: template.subject,
        htmlContent: template.htmlContent,
        textContent: template.textContent,
        replyTo: contactData.email
      });

      if (result.success) {
        console.log('✅ Contact notification email sent successfully');
      } else {
        console.error('❌ Contact notification email failed:', result.error);
      }
      return result;
    } catch (error) {
      console.error('❌ Contact notification error:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send contact form confirmation to user
   */
  async sendContactConfirmation(contactData) {
    try {
      const template = templates.contactConfirmation(contactData);
      const result = await brevoService.sendEmail({
        to: contactData.email,
        subject: template.subject,
        htmlContent: template.htmlContent,
        textContent: template.textContent
      });

      if (result.success) {
        console.log('✅ Contact confirmation email sent successfully');
      } else {
        console.error('❌ Contact confirmation email failed:', result.error);
      }
      return result;
    } catch (error) {
      console.error('❌ Contact confirmation error:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send subscription welcome email
   */
  async sendSubscriptionWelcome(subscriptionData) {
    try {
      const template = templates.subscriptionWelcome(subscriptionData);
      const result = await brevoService.sendEmail({
        to: subscriptionData.email,
        subject: template.subject,
        htmlContent: template.htmlContent,
        textContent: template.textContent
      });

      if (result.success) {
        console.log('✅ Subscription welcome email sent successfully');
      } else {
        console.error('❌ Subscription welcome email failed:', result.error);
      }
      return result;
    } catch (error) {
      console.error('❌ Subscription welcome error:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send event registration confirmation
   */
  async sendEventRegistrationConfirmation(regData, eventData) {
    try {
      const template = templates.eventRegistrationConfirmation(regData, eventData);
      const result = await brevoService.sendEmail({
        to: regData.email,
        subject: template.subject,
        htmlContent: template.htmlContent,
        textContent: template.textContent
      });

      if (result.success) {
        console.log('✅ Event registration confirmation email sent successfully');
      } else {
        console.error('❌ Event registration confirmation email failed:', result.error);
      }
      return result;
    } catch (error) {
      console.error('❌ Event registration confirmation error:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generic email sender for custom needs
   */
  async sendEmail(options) {
    return brevoService.sendEmail(options);
  }

  /**
   * Test email configuration
   */
  async testConnection() {
    return brevoService.testConnection();
  }
}

module.exports = new EmailService();