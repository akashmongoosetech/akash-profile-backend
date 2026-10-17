const express = require('express');
const { body } = require('express-validator');
const contactController = require('../controllers/contactController');
const { authenticateToken, requirePermission } = require('../utils/authMiddleware');

const router = express.Router();

// Create a new contact (POST /api/contact)
router.post(
  '/',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('subject').notEmpty().withMessage('Subject is required'),
    body('message').notEmpty().withMessage('Message is required')
  ],
  contactController.createContact
);

// Get contact statistics (GET /api/contact/stats) - MUST be before /:id route
router.get('/stats', authenticateToken, requirePermission('manage_contacts', 'view_analytics'), contactController.getContactStats);

// Get all contacts (GET /api/contact)
router.get('/', authenticateToken, requirePermission('manage_contacts'), contactController.getAllContacts);

// Get a single contact by ID (GET /api/contact/:id)
router.get('/:id', authenticateToken, requirePermission('manage_contacts'), contactController.getContactById);

// Update contact status or details (PATCH /api/contact/:id)
router.patch('/:id', authenticateToken, requirePermission('manage_contacts'), contactController.updateContact);

// Delete a contact (DELETE /api/contact/:id)
router.delete('/:id', authenticateToken, requirePermission('manage_contacts'), contactController.deleteContact);

module.exports = router; 