const express = require('express');
const multer = require('multer');
const path = require('path');
const { authenticateToken } = require('../utils/authMiddleware');
const caseStudyController = require('../controllers/caseStudyController');

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

// Public routes (no auth required)
router.get('/public', caseStudyController.getPublicCaseStudies);

// Admin routes (auth required)
router.get('/admin/all', authenticateToken, caseStudyController.getAdminCaseStudies);
router.post('/', authenticateToken, upload.single('thumbnail'), caseStudyController.createCaseStudy);
router.put('/:id', authenticateToken, upload.single('thumbnail'), caseStudyController.updateCaseStudy);
router.delete('/:id', authenticateToken, caseStudyController.deleteCaseStudy);

module.exports = router;
