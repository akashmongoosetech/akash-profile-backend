const Event = require('../models/Event');

// Get all published events with pagination and filtering
exports.getEvents = async (req, res) => {
  try {
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
          { description: { $regex: req.query.search, $options: 'i' } },
          { tags: { $in: [new RegExp(req.query.search, 'i')] } }
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
};

// Get single event by slug
exports.getEventBySlug = async (req, res) => {
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
};

// Get upcoming events
exports.getUpcomingEvents = async (req, res) => {
  try {
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
};

// Get featured events
exports.getFeaturedEvents = async (req, res) => {
  try {
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
};

// Get all event types/categories (for filters)
exports.getEventFilters = async (req, res) => {
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
};

// ================== ADMIN ROUTES ==================

// Get all events (including unpublished) - Admin only
exports.getAllEventsAdmin = async (req, res) => {
  try {
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
};

// Get single event by ID - Admin only
exports.getEventByIdAdmin = async (req, res) => {
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
};

// Create new event - Admin only
exports.createEvent = async (req, res) => {
  try {
    const eventData = req.body;
    
    // Generate slug from title if not provided
    if (!eventData.slug && eventData.title) {
      eventData.slug = eventData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
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
};

// Update event - Admin only
exports.updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // If title is being updated, regenerate slug
    if (updateData.title && !updateData.slug) {
      updateData.slug = updateData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
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
};

// Delete event - Admin only
exports.deleteEvent = async (req, res) => {
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
};

// Toggle publish status - Admin only
exports.togglePublishStatus = async (req, res) => {
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
};

// Toggle featured status - Admin only
exports.toggleFeaturedStatus = async (req, res) => {
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
};
