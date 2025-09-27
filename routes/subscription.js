const express = require('express');
const { body } = require('express-validator');
const subscriptionController = require('../controllers/subscriptionController');

const router = express.Router();

// Subscribe (POST /api/subscription)
router.post(
  '/',
  [body('email').isEmail().withMessage('Valid email is required')],
  subscriptionController.createSubscription
);

// Get all subscriptions (GET /api/subscription)
router.get('/', subscriptionController.getAllSubscriptions);

// Unsubscribe (PATCH /api/subscription/:id/unsubscribe)
router.patch('/:id/unsubscribe', subscriptionController.unsubscribe);

// Reactivate subscription (PATCH /api/subscription/:id/reactivate)
router.patch('/:id/reactivate', subscriptionController.reactivate);

// Delete a subscription (DELETE /api/subscription/:id)
router.delete('/:id', subscriptionController.deleteSubscription);

// Get subscription statistics (GET /api/subscription/stats)
router.get('/stats', subscriptionController.getSubscriptionStats);

module.exports = router; 