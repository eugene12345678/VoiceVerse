const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const authMiddleware = require('../middleware/auth');

// @route   POST /api/upload/audio
// @desc    Upload audio file
// @access  Private
router.post('/audio', authMiddleware, uploadController.uploadAudio);

module.exports = router;