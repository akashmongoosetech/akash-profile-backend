const { validationResult } = require('express-validator');
const Contact = require('../models/Contact');
const emailService = require('../utils/emailService');

exports.createContact = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  try {
    const contact = new Contact(req.body);
    await contact.save();
    // Send notification to admin and confirmation to user
    await emailService.sendContactNotification(contact);
    await emailService.sendContactConfirmation(contact);
    contact.emailSent = true;
    contact.emailSentAt = new Date();
    await contact.save();
    res.status(201).json({ success: true, message: 'Contact submitted successfully', contact });
  } catch (error) {
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
    const contact = await Contact.findById(req.params.id);
    if (!contact) return res.status(404).json({ success: false, message: 'Contact not found' });
    // Allow updating status, adminNotes, priority
    if (req.body.status) contact.status = req.body.status;
    if (req.body.adminNotes) contact.adminNotes = req.body.adminNotes;
    if (req.body.priority) contact.priority = req.body.priority;
    await contact.save();
    res.json({ success: true, message: 'Contact updated', contact });
  } catch (error) {
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
    const stats = await Contact.getStats();
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch stats', error: error.message });
  }
}; 