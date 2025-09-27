const { validationResult } = require('express-validator');
const Subscription = require('../models/Subscription');
const emailService = require('../utils/emailService');

exports.createSubscription = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  try {
    let subscription = await Subscription.findOne({ email: req.body.email.toLowerCase() });
    if (subscription && subscription.status === 'active') {
      return res.status(409).json({ success: false, message: 'Already subscribed' });
    }
    if (!subscription) {
      subscription = new Subscription({
        email: req.body.email,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        source: req.body.source || 'footer',
        preferences: req.body.preferences || undefined
      });
    } else {
      subscription.status = 'active';
      subscription.unsubscribedAt = undefined;
      subscription.unsubscribedReason = '';
    }
    await subscription.save();
    await emailService.sendSubscriptionWelcome(subscription);
    res.status(201).json({ success: true, message: 'Subscribed successfully', subscription });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to subscribe', error: error.message });
  }
};

exports.getAllSubscriptions = async (req, res) => {
  try {
    const subscriptions = await Subscription.find().sort({ createdAt: -1 });
    res.json({ success: true, subscriptions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch subscriptions', error: error.message });
  }
};

exports.unsubscribe = async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id);
    if (!subscription) return res.status(404).json({ success: false, message: 'Subscription not found' });
    await subscription.unsubscribe(req.body.reason || '');
    res.json({ success: true, message: 'Unsubscribed', subscription });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to unsubscribe', error: error.message });
  }
};

exports.reactivate = async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id);
    if (!subscription) return res.status(404).json({ success: false, message: 'Subscription not found' });
    await subscription.reactivate();
    res.json({ success: true, message: 'Subscription reactivated', subscription });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to reactivate', error: error.message });
  }
};

exports.deleteSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findByIdAndDelete(req.params.id);
    if (!subscription) return res.status(404).json({ success: false, message: 'Subscription not found' });
    res.json({ success: true, message: 'Subscription deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete subscription', error: error.message });
  }
};

exports.getSubscriptionStats = async (req, res) => {
  try {
    const stats = await Subscription.getStats();
    const activeCount = await Subscription.getActiveCount();
    res.json({ success: true, stats, activeCount });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch stats', error: error.message });
  }
}; 