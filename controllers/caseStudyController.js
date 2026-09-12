const fs = require('fs');
const path = require('path');
const CaseStudy = require('../models/CaseStudy');
const { optimizeImage } = require('../utils/imageOptimizer');

const uploadsDir = path.join(__dirname, '../uploads/case-studies');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Get all published case studies
exports.getPublicCaseStudies = async (req, res) => {
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
};

// Get all case studies for admin with filters
exports.getAdminCaseStudies = async (req, res) => {
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
};

// Create new case study
exports.createCaseStudy = async (req, res) => {
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
      try {
        const optimizedFilename = await optimizeImage(req.file.path);
        caseStudyData.thumbnail = `/uploads/case-studies/${optimizedFilename}`;
      } catch {
        caseStudyData.thumbnail = `/uploads/case-studies/${req.file.filename}`;
      }
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
};

// Update case study
exports.updateCaseStudy = async (req, res) => {
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
      try {
        const optimizedFilename = await optimizeImage(req.file.path);
        updateData.thumbnail = `/uploads/case-studies/${optimizedFilename}`;
      } catch {
        updateData.thumbnail = `/uploads/case-studies/${req.file.filename}`;
      }
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
};

// Delete case study
exports.deleteCaseStudy = async (req, res) => {
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
};
