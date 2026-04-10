const express = require('express');
const multer = require('multer');
const path = require('path');
const CaseStudy = require('../models/CaseStudy');
const { authenticateToken } = require('../utils/authMiddleware');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/case-studies'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'case-study-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Create uploads directory if it doesn't exist
const fs = require('fs');
const uploadsDir = path.join(__dirname, '../uploads/case-studies');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Public routes (no auth required)

// GET /api/case-studies/public - Get all published case studies
router.get('/public', async (req, res) => {
  try {
    const caseStudies = await CaseStudy.find({ published: true })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      caseStudies
    });
  } catch (error) {
    console.error('Error fetching public case studies:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching case studies'
    });
  }
});

// Admin routes (auth required)

// GET /api/case-studies/admin/all - Get all case studies for admin with filters
router.get('/admin/all', authenticateToken, async (req, res) => {
  try {
    const { search, category, page = 1, limit = 10 } = req.query;

    let query = {};

    // Search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { client: { $regex: search, $options: 'i' } },
        { overview: { $regex: search, $options: 'i' } }
      ];
    }

    // Category filter
    if (category && category !== 'all') {
      query.category = category;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const caseStudies = await CaseStudy.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await CaseStudy.countDocuments(query);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      caseStudies,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching admin case studies:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching case studies'
    });
  }
});

// POST /api/case-studies - Create new case study
router.post('/', authenticateToken, upload.single('thumbnail'), async (req, res) => {
  try {
    const caseStudyData = req.body;

    // Parse JSON fields
    if (typeof caseStudyData.results === 'string') {
      caseStudyData.results = JSON.parse(caseStudyData.results);
    }
    if (typeof caseStudyData.technologies === 'string') {
      caseStudyData.technologies = JSON.parse(caseStudyData.technologies);
    }
    if (typeof caseStudyData.testimonial === 'string') {
      caseStudyData.testimonial = JSON.parse(caseStudyData.testimonial);
    }

    // Handle file upload
    if (req.file) {
      caseStudyData.thumbnail = `/uploads/case-studies/${req.file.filename}`;
    }

    // Convert published to boolean
    caseStudyData.published = caseStudyData.published === 'true' || caseStudyData.published === true;

    const caseStudy = new CaseStudy(caseStudyData);
    await caseStudy.save();

    res.status(201).json({
      success: true,
      message: 'Case study created successfully',
      caseStudy
    });
  } catch (error) {
    console.error('Error creating case study:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating case study',
      error: error.message
    });
  }
});

// PUT /api/case-studies/:id - Update case study
router.put('/:id', authenticateToken, upload.single('thumbnail'), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Parse JSON fields
    if (typeof updateData.results === 'string') {
      updateData.results = JSON.parse(updateData.results);
    }
    if (typeof updateData.technologies === 'string') {
      updateData.technologies = JSON.parse(updateData.technologies);
    }
    if (typeof updateData.testimonial === 'string') {
      updateData.testimonial = JSON.parse(updateData.testimonial);
    }

    // Handle file upload
    if (req.file) {
      updateData.thumbnail = `/uploads/case-studies/${req.file.filename}`;
    }

    // Convert published to boolean
    if (updateData.published !== undefined) {
      updateData.published = updateData.published === 'true' || updateData.published === true;
    }

    const caseStudy = await CaseStudy.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!caseStudy) {
      return res.status(404).json({
        success: false,
        message: 'Case study not found'
      });
    }

    res.json({
      success: true,
      message: 'Case study updated successfully',
      caseStudy
    });
  } catch (error) {
    console.error('Error updating case study:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating case study',
      error: error.message
    });
  }
});

// DELETE /api/case-studies/:id - Delete case study
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const caseStudy = await CaseStudy.findByIdAndDelete(id);

    if (!caseStudy) {
      return res.status(404).json({
        success: false,
        message: 'Case study not found'
      });
    }

    // Delete associated file if exists
    if (caseStudy.thumbnail && caseStudy.thumbnail.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '..', caseStudy.thumbnail);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    res.json({
      success: true,
      message: 'Case study deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting case study:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting case study'
    });
  }
});

module.exports = router;