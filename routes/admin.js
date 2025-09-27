const express = require('express');
const router = express.Router();

// Placeholder admin route
router.get('/', (req, res) => {
  res.json({ success: true, message: 'Admin route is working' });
});

module.exports = router; 