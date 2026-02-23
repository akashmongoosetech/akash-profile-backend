/**
 * AI Routes
 * Handles all AI-powered tool endpoints
 */

const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { chatWithAI } = require('../controllers/chatWithAI');

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

/**
 * POST /api/ai/business-idea-validator
 * Validate business ideas with India-specific market analysis
 * Body: { businessIdea, location, targetAudience, budget, industryType, revenueModel }
 */
router.post('/business-idea-validator', aiController.validateBusinessIdea);

/**
 * POST /api/ai/startup-name-generator
 * Generate startup names with branding suggestions
 * Body: { industry, brandPersonality, targetAudience, namePreference, checkDomain }
 */
router.post('/startup-name-generator', aiController.generateStartupNames);

/**
 * POST /api/ai/business-plan-generator
 * Generate comprehensive business plans
 * Body: { businessName, industry, location, fundingRequired, targetMarket, revenueModel, businessDescription }
 */
router.post('/business-plan-generator', aiController.generateBusinessPlan);

/**
 * POST /api/ai/business-plan-pdf
 * Generate and download business plan as PDF
 */
router.post('/business-plan-pdf', aiController.generateBusinessPlanPDF);

/**
 * POST /api/ai/medical-note-formatter
 * Format raw clinical notes into structured medical documentation
 * Body: { rawNotes, formatType, specialty, includeICD }
 */
router.post('/medical-note-formatter', aiController.formatMedicalNote);

/**
 * POST /api/ai/discharge-summary-generator
 * Generate patient discharge summaries from case data
 * Body: { patientAge, patientGender, admissionReason, diagnosis, treatmentGiven, proceduresPerformed, medicationsPrescribed, followUpInstructions, hospitalStayDuration }
 */
router.post('/discharge-summary-generator', aiController.generateDischargeSummary);

/**
 * POST /api/ai/clinic-content-generator
 * Generate SEO-optimized website content for medical clinics
 * Body: { clinicName, specialty, location, yearsExperience, servicesOffered, targetAudience, tone }
 */
router.post('/clinic-content-generator', aiController.generateClinicContent);

/**
 * POST /api/ai/generate-sql
 * Generate SQL queries from natural language
 * Body: { databaseType, tableSchema, queryRequirement, complexityLevel }
 */
router.post('/generate-sql', aiController.generateSQL);

/**
 * POST /api/ai/generate-project-description
 * Generate comprehensive project descriptions
 * Body: { projectName, technologyStack, purpose, features, targetAudience, tone }
 */
router.post('/generate-project-description', aiController.generateProjectDescription);

/**
 * POST /api/ai/generate-cover-letter
 * Generate internship cover letters
 * Body: { studentName, degree, college, skills, targetCompany, internshipRole, experienceLevel, tone }
 */
router.post('/generate-cover-letter', aiController.generateCoverLetter);

/**
 * POST /api/ai/generate-personal-statement
 * Generate personal statements for university applications
 * Body: { name, fieldOfStudy, academicAchievements, careerGoals, targetUniversity, tone }
 */
router.post('/generate-personal-statement', aiController.generatePersonalStatement);

/**
 * POST /api/ai/generate-portfolio-bio
 * Generate professional portfolio bios
 * Body: { name, role, skills, yearsOfExperience, achievements, tone }
 */
router.post('/generate-portfolio-bio', aiController.generatePortfolioBio);

/**
 * POST /api/ai/generate-meeting-summary
 * Generate meeting summaries from transcripts
 * Body: { meetingTranscript, meetingType, outputStyle }
 */
router.post('/generate-meeting-summary', aiController.generateMeetingSummary);

/**
 * POST /api/ai/chat
 * Streaming chat endpoint for AI Chat Assistant
 * Body: { messages: [{ role: 'user' | 'assistant', content: string }], message: string }
 * Uses Server-Sent Events for streaming responses
 */
router.post('/chat', chatWithAI);

module.exports = router;
