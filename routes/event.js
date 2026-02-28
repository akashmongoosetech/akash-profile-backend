const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');
const { authenticateToken } = require('../utils/authMiddleware');

const router = express.Router();

// Validation middleware
const validateEvent = [
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('description').optional().trim().notEmpty().withMessage('Description cannot be empty'),
  body('eventType').optional().isIn(['webinar', 'workshop', 'office-hours', 'conference']).withMessage('Invalid event type'),
  body('date').optional().isISO8601().withMessage('Invalid date format'),
  body('duration').optional().isInt({ min: 1 }).withMessage('Duration must be a positive integer'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),
  body('maxAttendees').optional().isInt({ min: 0 }).withMessage('Max attendees must be a non-negative number')
];

// ================== PUBLIC ROUTES ==================

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
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
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
      const searchQuery = { 
        published: true,
        $or: [
          { title: { $regex: req.query.search, $options: 'i' } },
          { description: { $regex: req.query.search, $options: 'i' } }
        ]
      };
      
      events = await Event.find(searchQuery)
        .sort({ date: 1 })
        .skip(skip)
        .limit(limit);

      total = await Event.countDocuments(searchQuery);
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
      return res.status(400).json({ success: false, errors: errors.array() });
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
      return res.status(400).json({ success: false, errors: errors.array() });
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
router.get('/admin/all', authenticateToken, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('published').optional().isBoolean().withMessage('Published must be a boolean'),
  query('eventType').optional().isString().withMessage('Event type must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
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
router.get('/admin/:id', authenticateToken, async (req, res) => {
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
router.post('/admin', authenticateToken, validateEvent, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const eventData = req.body;
    
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
router.put('/admin/:id', authenticateToken, validateEvent, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id } = req.params;
    const updateData = req.body;
    
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
router.delete('/admin/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const event = await Event.findByIdAndDelete(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

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
router.patch('/admin/:id/toggle-publish', authenticateToken, async (req, res) => {
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

// Register for an event
router.post('/register/:eventId', [
  body('fullName').notEmpty().withMessage('Full name is required').trim(),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('phone').optional().trim(),
  body('company').optional().trim(),
  body('jobTitle').optional().trim(),
  body('notes').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { eventId } = req.params;
    const { fullName, email, phone, company, jobTitle, notes } = req.body;

    // Check if event exists and is published
    const event = await Event.findById(eventId);
    
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

    // Check if event is full
    if (event.maxAttendees > 0 && event.currentAttendees >= event.maxAttendees) {
      return res.status(400).json({
        success: false,
        message: 'Event is full'
      });
    }

    // Create registration
    const registration = new EventRegistration({
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

    // Update event attendee count
    event.currentAttendees += 1;
    await event.save();

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
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { eventId } = req.params;
    const { email } = req.query;

    const registration = await EventRegistration.findOne({ eventId, email: email.toString().toLowerCase() });

    res.status(200).json({
      success: true,
      data: {
        isRegistered: !!registration,
        registration: registration || null
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
router.get('/admin/:eventId/registrations', authenticateToken, async (req, res) => {
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
router.patch('/admin/registrations/:id', authenticateToken, [
  body('status').isIn(['pending', 'confirmed', 'cancelled', 'attended']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
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

module.exports = router;
