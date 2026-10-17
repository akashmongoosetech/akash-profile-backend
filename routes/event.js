const express = require('express');
const { body, validationResult, query } = require('express-validator');
const rateLimit = require('express-rate-limit');
const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');
const AuditLog = require('../models/AuditLog');
const { authenticateToken, requirePermission } = require('../utils/authMiddleware');
const { sanitizeHtmlContent } = require('../utils/sanitizeHtml');
const { noUnstableMediaUrl, UNSTABLE_URL_MESSAGE } = require('../utils/linkValidation');
const emailService = require('../utils/emailService');

async function logAudit(action, resource, resourceId, req, details = {}) {
  try {
    await AuditLog.create({
      action,
      resource,
      resourceId,
      adminId: req.user?.id,
      adminEmail: req.user?.email,
      details,
      ip: req.ip || req.connection?.remoteAddress
    });
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
}

// Rate limiters
const registerLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many registration attempts. Please try again in a minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Fields an admin is allowed to write through the create/update endpoints.
// `currentAttendees`, `isFree` and `publishedAt` are intentionally excluded so
// they cannot be mass-assigned.
const EVENT_WRITABLE_FIELDS = [
  'title', 'slug', 'description', 'shortDescription', 'eventType', 'category',
  'image', 'videoUrl', 'host', 'date', 'endDate', 'duration', 'timezone',
  'location', 'meetingLink', 'registrationLink', 'price', 'currency',
  'maxAttendees', 'published', 'featured', 'tags', 'agenda', 'prerequisites',
  'whatYouWillLearn'
];

function pickEventFields(body) {
  const data = {};
  for (const field of EVENT_WRITABLE_FIELDS) {
    if (body[field] !== undefined) {
      data[field] = body[field];
    }
  }

  // Sanitize rich HTML fields to prevent stored XSS.
  if (typeof data.description === 'string') {
    data.description = sanitizeHtmlContent(data.description).slice(0, 2000);
  }
  if (typeof data.shortDescription === 'string') {
    data.shortDescription = sanitizeHtmlContent(data.shortDescription).slice(0, 500);
  }

  return data;
}

const router = express.Router();

// Validation middleware
const validateEvent = [
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('description').optional().trim().notEmpty().withMessage('Description cannot be empty'),
  body('eventType').optional().isIn(['webinar', 'workshop', 'office-hours', 'conference']).withMessage('Invalid event type'),
  body('date').optional().isISO8601().withMessage('Invalid date format'),
  body('duration').optional().isInt({ min: 1 }).withMessage('Duration must be a positive integer'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),
  body('maxAttendees').optional().isInt({ min: 0 }).withMessage('Max attendees must be a non-negative number'),
  body('image').optional().custom(noUnstableMediaUrl).withMessage(UNSTABLE_URL_MESSAGE),
  body('host.image').optional().custom(noUnstableMediaUrl).withMessage(UNSTABLE_URL_MESSAGE)
];

// ================== PUBLIC ROUTES ==================

// Public GET cache helper
function setPublicCache(res, maxAge = 60) {
  res.set('Cache-Control', `public, max-age=${maxAge}`);
}

// Get all published events with pagination and filtering
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('eventType').optional().isString().withMessage('Event type must be a string'),
  query('category').optional().isString().withMessage('Category must be a string'),
  query('featured').optional().isBoolean().withMessage('Featured must be a boolean'),
  query('upcoming').optional().isBoolean().withMessage('Upcoming must be a boolean'),
  query('past').optional().isBoolean().withMessage('Past must be a boolean'),
  query('search').optional().isString().withMessage('Search must be a string')
], async (req, res) => {
  setPublicCache(res, 60);
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    let query = { published: true };
    
    // Apply filters
    if (req.query.eventType) {
      query.eventType = req.query.eventType;
    }
    
    if (req.query.category) {
      query.category = req.query.category;
    }
    
    if (req.query.featured !== undefined) {
      query.featured = req.query.featured === 'true';
    }
    
    // Filter by upcoming or past
    if (req.query.upcoming === 'true') {
      query.date = { $gte: new Date() };
    } else if (req.query.past === 'true') {
      query.date = { $lt: new Date() };
    }
    
    let events;
    let total;
    
    if (req.query.search) {
      const searchTerm = req.query.search;
      const searchQuery = { published: true };
      
      try {
        events = await Event.find(
          { ...searchQuery, $text: { $search: searchTerm } },
          { score: { $meta: 'textScore' } }
        )
          .sort({ score: { $meta: 'textScore' } })
          .skip(skip)
          .limit(limit);
        total = await Event.countDocuments({ ...searchQuery, $text: { $search: searchTerm } });
      } catch {
        events = await Event.find({
          ...searchQuery,
          $or: [
            { title: { $regex: searchTerm, $options: 'i' } },
            { shortDescription: { $regex: searchTerm, $options: 'i' } }
          ]
        })
          .sort({ date: 1 })
          .skip(skip)
          .limit(limit);
        total = await Event.countDocuments({
          ...searchQuery,
          $or: [
            { title: { $regex: searchTerm, $options: 'i' } },
            { shortDescription: { $regex: searchTerm, $options: 'i' } }
          ]
        });
      }
    } else {
      events = await Event.find(query)
        .sort({ date: 1 })
        .skip(skip)
        .limit(limit);

      total = await Event.countDocuments(query);
    }

    res.status(200).json({
      success: true,
      data: events,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching events',
      error: error.message
    });
  }
});

// Get single event by slug
router.get('/slug/:slug', async (req, res) => {
  setPublicCache(res, 60);
  try {
    const { slug } = req.params;
    
    const event = await Event.findOne({ slug, published: true });
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.status(200).json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching event',
      error: error.message
    });
  }
});

// Get upcoming events
router.get('/upcoming', [
  query('limit').optional().isInt({ min: 1, max: 20 }).withMessage('Limit must be between 1 and 20')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const limit = parseInt(req.query.limit) || 5;
    
    const events = await Event.find({ 
      published: true,
      date: { $gte: new Date() }
    })
    .sort({ date: 1 })
    .limit(limit);

    res.status(200).json({
      success: true,
      data: events
    });
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching upcoming events',
      error: error.message
    });
  }
});

// Get featured events
router.get('/featured', [
  query('limit').optional().isInt({ min: 1, max: 20 }).withMessage('Limit must be between 1 and 20')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const limit = parseInt(req.query.limit) || 5;
    
    const events = await Event.find({ 
      featured: true,
      published: true
    })
    .sort({ date: 1 })
    .limit(limit);

    res.status(200).json({
      success: true,
      data: events
    });
  } catch (error) {
    console.error('Error fetching featured events:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching featured events',
      error: error.message
    });
  }
});

// Get event filters (types and categories)
router.get('/filters', async (req, res) => {
  try {
    const eventTypes = await Event.distinct('eventType', { published: true });
    const categories = await Event.distinct('category', { published: true });

    res.status(200).json({
      success: true,
      data: {
        eventTypes,
        categories
      }
    });
  } catch (error) {
    console.error('Error fetching event filters:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching event filters',
      error: error.message
    });
  }
});

// ================== ADMIN ROUTES ==================

// Get all events (including unpublished) - Admin only
router.get('/admin/all', authenticateToken, requirePermission('manage_events'), [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('published').optional().isBoolean().withMessage('Published must be a boolean'),
  query('eventType').optional().isString().withMessage('Event type must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const query = {};
    
    if (req.query.published !== undefined) {
      query.published = req.query.published === 'true';
    }
    
    if (req.query.eventType) {
      query.eventType = req.query.eventType;
    }

    const events = await Event.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Event.countDocuments(query);

    res.status(200).json({
      success: true,
      data: events,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching all events (admin):', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching events',
      error: error.message
    });
  }
});

// Get single event by ID - Admin only
router.get('/admin/:id', authenticateToken, requirePermission('manage_events'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const event = await Event.findById(id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.status(200).json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error('Error fetching event (admin):', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching event',
      error: error.message
    });
  }
});

// Create new event - Admin only
router.post('/admin', authenticateToken, requirePermission('manage_events'), validateEvent, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const eventData = pickEventFields(req.body);
    
    // Generate slug from title if not provided
    if (!eventData.slug && eventData.title) {
      eventData.slug = eventData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }
    
    // Set isFree based on price
    if (eventData.price !== undefined) {
      eventData.isFree = eventData.price === 0;
    }
    
    const event = new Event(eventData);
    await event.save();

    await logAudit('create', 'event', event._id, req, { title: event.title });

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: event
    });
  } catch (error) {
    console.error('Error creating event:', error);
    
    // Handle duplicate slug error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'An event with this slug already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error creating event',
      error: error.message
    });
  }
});

// Update event - Admin only
router.put('/admin/:id', authenticateToken, requirePermission('manage_events'), validateEvent, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const { id } = req.params;
    const updateData = pickEventFields(req.body);
    
    // If title is being updated, regenerate slug
    if (updateData.title && !updateData.slug) {
      updateData.slug = updateData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }
    
    // Set isFree based on price
    if (updateData.price !== undefined) {
      updateData.isFree = updateData.price === 0;
    }

    const event = await Event.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    await logAudit('update', 'event', event._id, req, { title: event.title });

    res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      data: event
    });
  } catch (error) {
    console.error('Error updating event:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'An event with this slug already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error updating event',
      error: error.message
    });
  }
});

// Delete event - Admin only
router.delete('/admin/:id', authenticateToken, requirePermission('manage_events'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const event = await Event.findByIdAndDelete(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    await logAudit('delete', 'event', id, req, { title: event.title });

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting event',
      error: error.message
    });
  }
});

// Toggle publish status - Admin only
router.patch('/admin/:id/toggle-publish', authenticateToken, requirePermission('manage_events'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    event.published = !event.published;
    if (event.published && !event.publishedAt) {
      event.publishedAt = new Date();
    }
    await event.save();

    await logAudit(event.published ? 'publish' : 'unpublish', 'event', id, req, { title: event.title });

    res.status(200).json({
      success: true,
      message: `Event ${event.published ? 'published' : 'unpublished'} successfully`,
      data: event
    });
  } catch (error) {
    console.error('Error toggling event publish status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error toggling event status',
      error: error.message
    });
  }
});

// Toggle featured status - Admin only
router.patch('/admin/:id/toggle-featured', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    event.featured = !event.featured;
    await event.save();

    await logAudit(event.featured ? 'feature' : 'unfeature', 'event', id, req, { title: event.title });

    res.status(200).json({
      success: true,
      message: `Event ${event.featured ? 'featured' : 'unfeatured'} successfully`,
      data: event
    });
  } catch (error) {
    console.error('Error toggling event featured status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error toggling event featured status',
      error: error.message
    });
  }
});

// ================== REGISTRATION ROUTES ==================

// Helper function to check if string is a valid MongoDB ObjectId
function isValidObjectId(id) {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

// Register for an event
router.post('/register/:eventId', registerLimiter, [
  body('fullName').notEmpty().withMessage('Full name is required').trim().escape(),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('phone').optional().trim().escape(),
  body('company').optional().trim().escape(),
  body('jobTitle').optional().trim().escape(),
  body('notes').optional().trim().escape()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const { eventId } = req.params;
    const { fullName, email, phone, company, jobTitle, notes } = req.body;

    // Check if event exists and is published
    // First try to find by ObjectId, if not valid ObjectId or not found, try by slug
    let event = null;
    
    if (isValidObjectId(eventId)) {
      event = await Event.findById(eventId);
    }
    
    // If not found by ID, try finding by slug (in case eventId is actually a slug)
    if (!event) {
      event = await Event.findOne({ slug: eventId, published: true });
    }
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    if (!event.published) {
      return res.status(400).json({
        success: false,
        message: 'Event is not available for registration'
      });
    }

    // Check if already registered
    const existingRegistration = await EventRegistration.findOne({ eventId, email });
    
    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: 'You are already registered for this event'
      });
    }

    // Reserve a seat atomically to prevent overselling under concurrent requests.
    const reservedEvent = await Event.findOneAndUpdate(
      {
        _id: event._id,
        $or: [
          { maxAttendees: { $lte: 0 } },
          { $expr: { $lt: ['$currentAttendees', '$maxAttendees'] } }
        ]
      },
      { $inc: { currentAttendees: 1 } },
      { new: true }
    );

    if (!reservedEvent) {
      return res.status(400).json({
        success: false,
        message: 'Event is full'
      });
    }

    // Create registration; release the reserved seat if it fails.
    let registration;
    try {
      registration = new EventRegistration({
        eventId,
        fullName,
        email,
        phone,
        company,
        jobTitle,
        notes,
        status: 'confirmed'
      });

      await registration.save();
    } catch (err) {
      await Event.updateOne({ _id: event._id }, { $inc: { currentAttendees: -1 } }).catch(() => {});

      if (err.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'You are already registered for this event'
        });
      }

      throw err;
    }

    // Send confirmation email (non-blocking)
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    emailService.sendEventRegistrationConfirmation(
      { fullName, email, phone, company, jobTitle },
      event,
      baseUrl
    ).then(() => {
      EventRegistration.findByIdAndUpdate(registration._id, { confirmationSent: true }).catch(() => {});
    }).catch(err => {
      console.error('Failed to send registration confirmation email:', err.message);
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful!',
      data: registration
    });
  } catch (error) {
    console.error('Error registering for event:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You are already registered for this event'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error registering for event',
      error: error.message
    });
  }
});

// Check if email is registered for event
router.get('/register/check/:eventId', [
  query('email').isEmail().withMessage('Valid email is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const { eventId } = req.params;
    const { email } = req.query;

    const registration = await EventRegistration.findOne({ eventId, email: email.toString().toLowerCase() }).select('_id');

    res.status(200).json({
      success: true,
      data: {
        isRegistered: !!registration
      }
    });
  } catch (error) {
    console.error('Error checking registration:', error);
    res.status(500).json({
      success: false,
      message: 'Server error checking registration',
      error: error.message
    });
  }
});

// Get registrations for an event - Admin only
router.get('/admin/:eventId/registrations', authenticateToken, requirePermission('manage_events'), async (req, res) => {
  try {
    const { eventId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const registrations = await EventRegistration.find({ eventId })
      .sort({ registeredAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await EventRegistration.countDocuments({ eventId });

    res.status(200).json({
      success: true,
      data: registrations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching registrations:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching registrations',
      error: error.message
    });
  }
});

// Update registration status - Admin only
router.patch('/admin/registrations/:id', authenticateToken, requirePermission('manage_events'), [
  body('status').isIn(['pending', 'confirmed', 'cancelled', 'attended']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const { id } = req.params;
    const { status } = req.body;

    const registration = await EventRegistration.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Registration updated successfully',
      data: registration
    });
  } catch (error) {
    console.error('Error updating registration:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating registration',
      error: error.message
    });
  }
});

// Delete registration - Admin only
router.delete('/admin/registrations/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const registration = await EventRegistration.findById(id);

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    // Update event attendee count
    await Event.findByIdAndUpdate(registration.eventId, {
      $inc: { currentAttendees: -1 }
    });

    await EventRegistration.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Registration deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting registration:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting registration',
      error: error.message
    });
  }
});

// Export registrations as CSV - Admin only
router.get('/admin/registrations/export/:eventId', authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.params;
    const registrations = await EventRegistration.find({ eventId }).sort({ registeredAt: -1 });

    const header = 'Full Name,Email,Phone,Company,Job Title,Notes,Status,Registered At\n';
    const rows = registrations.map(r =>
      `"${r.fullName}","${r.email}","${r.phone || ''}","${r.company || ''}","${r.jobTitle || ''}","${(r.notes || '').replace(/"/g, '""')}","${r.status}","${r.registeredAt.toISOString()}"`
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=registrations-${eventId}.csv`);
    res.status(200).send(header + rows);
  } catch (error) {
    console.error('Error exporting registrations:', error);
    res.status(500).json({ success: false, message: 'Server error exporting registrations' });
  }
});

module.exports = router;
