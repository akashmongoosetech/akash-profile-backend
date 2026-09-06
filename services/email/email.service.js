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
    this.configured = false;
  }

  /**
   * Check if email service is properly configured with Brevo credentials
   */
  isConfigured() {
    return !!(process.env.BREVO_API_KEY && process.env.EMAIL_FROM);
  }

  /**
   * Initialize email service
   */
  async initialize() {
    if (this.initialized) return this.configured;
    
    if (!this.isConfigured()) {
      console.warn('⚠️  Email service not configured: Missing BREVO_API_KEY or EMAIL_FROM environment variables');
      console.warn('⚠️  Transactional emails will be skipped');
      this.initialized = true;
      this.configured = false;
      return false;
    }

    try {
      await brevoService.testConnection();
      this.initialized = true;
      this.configured = true;
      console.log('✅ Email service initialized with Brevo');
      return true;
    } catch (error) {
      console.error('❌ Email service initialization failed:', error.message);
      console.warn('⚠️  Email service will run in degraded mode (emails will fail)');
      this.initialized = true;
      this.configured = false;
      return false;
    }
  }

  /**
   * Guard - check configuration before sending
   * @returns {Object|null} Error object if not configured, null if OK
   */
  _checkConfig() {
    if (!this.isConfigured()) {
      return { success: false, error: 'Email service not configured: Missing BREVO_API_KEY or EMAIL_FROM', skipped: true };
    }
    if (!this.configured) {
      return { success: false, error: 'Email service initialization failed or not ready', skipped: true };
    }
    return null;
  }

  /**
   * Send contact form notification to admin
   */
  async sendContactNotification(contactData) {
    const configCheck = this._checkConfig();
    if (configCheck) {
      console.warn('⚠️  Contact notification skipped:', configCheck.error);
      return configCheck;
    }

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
    const configCheck = this._checkConfig();
    if (configCheck) {
      console.warn('⚠️  Contact confirmation skipped:', configCheck.error);
      return configCheck;
    }

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
    const configCheck = this._checkConfig();
    if (configCheck) {
      console.warn('⚠️  Subscription welcome skipped:', configCheck.error);
      return configCheck;
    }

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
  async sendEventRegistrationConfirmation(regData, eventData, baseUrl) {
    const configCheck = this._checkConfig();
    if (configCheck) {
      console.warn('⚠️  Event registration confirmation skipped:', configCheck.error);
      return configCheck;
    }

    try {
      const template = templates.eventRegistrationConfirmation(regData, eventData, baseUrl);
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