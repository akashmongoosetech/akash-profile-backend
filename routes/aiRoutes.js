/**
 * AI Routes
 * Handles all AI-powered tool endpoints
 */

const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

/**
 * POST /api/ai/email-reply
 * Generate AI-powered email reply
 * Body: { originalEmail, tone, length }
 */
router.post('/email-reply', aiController.generateEmailReply);

/**
 * POST /api/ai/linkedin-post
 * Generate LinkedIn post for developers
 * Body: { topic, experienceLevel, postType, includeHashtags }
 */
router.post('/linkedin-post', aiController.generateLinkedInPost);

/**
 * POST /api/ai/project-ideas
 * Generate project ideas for students
 * Body: { technology, difficultyLevel, projectType, numberOfIdeas }
 */
router.post('/project-ideas', aiController.generateProjectIdeas);

module.exports = router;
