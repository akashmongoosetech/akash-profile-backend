/**
 * Brevo API Service (v6.x SDK)
 * Wraps the @getbrevo/brevo SDK for transactional emails
 * All credentials stay server-side
 */

const { BrevoClient } = require('@getbrevo/brevo');

class BrevoService {
  constructor() {
    this.apiKey = process.env.BREVO_API_KEY;
    this.defaultSender = {
      email: process.env.EMAIL_FROM || 'info@akashraikwar.in',
      name: process.env.EMAIL_FROM_NAME || 'Akash Raikwar'
    };
    
    this.client = null;
    this.transactionalEmails = null;
    this.initialized = false;
  }

  /**
   * Initialize the Brevo API client
   */
  initialize() {
    if (this.initialized) return true;
    
    if (!this.apiKey) {
      console.error('❌ BREVO_API_KEY is not set in environment variables');
      return false;
    }

    try {
      // Create the Brevo client with API key authentication
      this.client = new BrevoClient({ 
        apiKey: this.apiKey 
      });
      
      // Get the transactional emails client
      this.transactionalEmails = this.client.transactionalEmails;
      this.initialized = true;
      
      console.log('✅ Brevo API client initialized (v6.x SDK)');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Brevo API client:', error.message);
      return false;
    }
  }

  /**
   * Send a transactional email via Brevo API
   * @param {Object} options
   * @param {string|Array} options.to - Recipient(s) - string email or array of {email, name}
   * @param {string} options.subject - Email subject
   * @param {string} options.htmlContent - HTML content
   * @param {string} [options.textContent] - Plain text fallback
   * @param {Object} [options.sender] - Override default sender {email, name}
   * @param {string} [options.replyTo] - Reply-to email
   * @param {Array} [options.cc] - CC recipients
   * @param {Array} [options.bcc] - BCC recipients
   * @param {Array} [options.attachment] - Attachments
   * @param {Object} [options.params] - Template parameters (for Brevo templates)
   * @returns {Promise<Object>} Result with success status and messageId
   */
  async sendEmail(options) {
    if (!this.initialized && !this.initialize()) {
      return { success: false, error: 'Brevo service not initialized' };
    }

    const {
      to,
      subject,
      htmlContent,
      textContent,
      sender,
      replyTo,
      cc,
      bcc,
      attachment,
      params
    } = options;

    // Validate required fields
    if (!to) {
      return { success: false, error: 'Recipient (to) is required' };
    }
    if (!subject) {
      return { success: false, error: 'Subject is required' };
    }
    if (!htmlContent && !textContent) {
      return { success: false, error: 'HTML or text content is required' };
    }

    // Normalize recipients
    const recipients = Array.isArray(to) ? to : [{ email: to }];
    const formattedTo = recipients.map(r => 
      typeof r === 'string' ? { email: r } : r
    );

    // Build email payload according to Brevo v6.x API
    const emailData = {
      sender: sender || this.defaultSender,
      to: formattedTo,
      subject,
      htmlContent,
      textContent: textContent || this.htmlToText(htmlContent),
      replyTo: replyTo ? { email: replyTo } : undefined,
      cc: cc ? (Array.isArray(cc) ? cc : [cc]).map(c => typeof c === 'string' ? { email: c } : c) : undefined,
      bcc: bcc ? (Array.isArray(bcc) ? bcc : [bcc]).map(b => typeof b === 'string' ? { email: b } : b) : undefined,
      attachment: attachment ? (Array.isArray(attachment) ? attachment : [attachment]) : undefined,
      params: params || undefined
    };

    // Remove undefined fields
    Object.keys(emailData).forEach(key => emailData[key] === undefined && delete emailData[key]);

    console.log(`📧 [Brevo] Sending email to: ${formattedTo.map(r => r.email).join(', ')} | Subject: ${subject}`);

    try {
      const response = await this.transactionalEmails.sendTransacEmail(emailData);
      
      console.log(`✅ [Brevo] Email sent successfully | MessageId: ${response.messageId}`);
      
      return {
        success: true,
        messageId: response.messageId,
        response: response
      };
    } catch (error) {
      const errorMessage = error.body?.message || error.message || 'Unknown error';
      console.error('❌ [Brevo] Email send failed:', errorMessage);
      
      // Provide more helpful error messages
      let friendlyError = errorMessage;
      if (error.statusCode === 401) {
        friendlyError = 'Invalid Brevo API key. Check BREVO_API_KEY in environment.';
      } else if (error.statusCode === 403) {
        friendlyError = 'Brevo API access forbidden. Check API key permissions.';
      } else if (error.statusCode === 400) {
        friendlyError = `Brevo validation error: ${errorMessage}`;
      } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        friendlyError = 'Network error: Cannot reach Brevo API';
      }
      
      return { 
        success: false, 
        error: friendlyError,
        originalError: errorMessage
      };
    }
  }

  /**
   * Convert HTML to plain text (basic)
   */
  htmlToText(html) {
    if (!html) return '';
    return String(html)
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Test Brevo API connection
   */
  async testConnection() {
    if (!this.initialized && !this.initialize()) {
      throw new Error('Brevo service not initialized');
    }

    try {
      // Try to get account info to verify API key
      const accountApi = this.client.account;
      await accountApi.getAccount();
      console.log('✅ Brevo API connection verified');
      return { success: true, message: 'Email service is ready' };
    } catch (error) {
      const errorMessage = error.body?.message || error.message || 'Unknown error';
      console.error('❌ Brevo connection test failed:', errorMessage);
      throw new Error(`Brevo API test failed: ${errorMessage}`);
    }
  }
}

// Export singleton instance
module.exports = new BrevoService();