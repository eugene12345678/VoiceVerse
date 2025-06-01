const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { authenticateToken } = require('../middleware/auth');

// @route   POST /api/upload/audio
// @desc    Upload audio file
// @access  Private
router.post('/audio', authenticateToken, uploadController.uploadAudio);

module.exports = router;