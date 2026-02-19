const { validationResult } = require('express-validator');
const Contact = require('../models/Contact');
const emailService = require('../utils/emailService');

exports.createContact = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  try {
    // Create contact with initial email status
    const contactData = {
      ...req.body,
      emailSent: false
    };
    
    const contact = new Contact(contactData);
    await contact.save();
    console.log('✅ Contact saved to database:', contact._id);
    
    // Try to send emails in background, but don't fail the request
    setImmediate(async () => {
      try {
        await emailService.sendContactNotification(contact);
        await emailService.sendContactConfirmation(contact);
        
        // Update email status only if emails are sent successfully
        await Contact.findByIdAndUpdate(contact._id, {
          emailSent: true,
          emailSentAt: new Date()
        });
        console.log('✅ Contact emails sent successfully for:', contact._id);
      } catch (emailError) {
        console.error('⚠️  Email sending failed for contact:', contact._id, emailError.message);
        // Email failure doesn't affect the response
      }
    });
    
    // Always return success if contact is saved
    res.status(201).json({ 
      success: true, 
      message: 'Contact submitted successfully', 
      contact: {
        _id: contact._id,
        name: contact.name,
        email: contact.email,
        subject: contact.subject,
        status: contact.status,
        createdAt: contact.createdAt
      }
    });
  } catch (error) {
    console.error('❌ Contact submission error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit contact', error: error.message });
  }
};

exports.getAllContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json({ success: true, contacts });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch contacts', error: error.message });
  }
};

exports.getContactById = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) return res.status(404).json({ success: false, message: 'Contact not found' });
    res.json({ success: true, contact });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch contact', error: error.message });
  }
};

exports.updateContact = async (req, res) => {
  try {
    console.log('🔄 Updating contact:', req.params.id, 'with data:', req.body);

    const updateData = {};
    if (req.body.status) updateData.status = req.body.status;
    if (req.body.adminNotes !== undefined) updateData.adminNotes = req.body.adminNotes;
    if (req.body.priority) updateData.priority = req.body.priority;

    // Update timestamps based on status
    if (req.body.status === 'review') {
      updateData.respondedAt = new Date();
    } else if (req.body.status === 'done') {
      updateData.completedAt = new Date();
    }

    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );

    if (!contact) {
      console.log('❌ Contact not found:', req.params.id);
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }

    console.log('✅ Contact updated successfully:', contact._id);

    res.json({ success: true, message: 'Contact updated', contact });
  } catch (error) {
    console.error('❌ Update contact error:', error);
    res.status(500).json({ success: false, message: 'Failed to update contact', error: error.message });
  }
};

exports.deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    if (!contact) return res.status(404).json({ success: false, message: 'Contact not found' });
    res.json({ success: true, message: 'Contact deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete contact', error: error.message });
  }
};

exports.getContactStats = async (req, res) => {
  try {
    console.log('📊 Fetching contact stats...');
    const stats = await Contact.getStats();
    console.log('✅ Stats fetched:', stats);
    res.json({ success: true, stats });
  } catch (error) {
    console.error('❌ Contact stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stats', error: error.message });
  }
}; 