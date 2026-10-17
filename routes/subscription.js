const express = require('express');
const { body } = require('express-validator');
const subscriptionController = require('../controllers/subscriptionController');
const { authenticateToken, requirePermission } = require('../utils/authMiddleware');

const router = express.Router();

// Subscribe (POST /api/subscription)
router.post(
  '/',
  [body('email').isEmail().withMessage('Valid email is required')],
  subscriptionController.createSubscription
);

// Get all subscriptions (GET /api/subscription)
router.get('/', authenticateToken, requirePermission('manage_subscribers'), subscriptionController.getAllSubscriptions);

// Unsubscribe (PATCH /api/subscription/:id/unsubscribe)
router.patch('/:id/unsubscribe', authenticateToken, requirePermission('manage_subscribers'), subscriptionController.unsubscribe);

// Reactivate subscription (PATCH /api/subscription/:id/reactivate)
router.patch('/:id/reactivate', authenticateToken, requirePermission('manage_subscribers'), subscriptionController.reactivate);

// Delete a subscription (DELETE /api/subscription/:id)
router.delete('/:id', authenticateToken, requirePermission('manage_subscribers'), subscriptionController.deleteSubscription);

// Get subscription statistics (GET /api/subscription/stats)
router.get('/stats', authenticateToken, requirePermission('manage_subscribers', 'view_analytics'), subscriptionController.getSubscriptionStats);

module.exports = router; 