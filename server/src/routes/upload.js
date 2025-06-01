const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { authenticateToken } = require('../middleware/auth');

// @route   GET /api/upload/test
// @desc    Test upload route
// @access  Public
router.get('/test', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Upload API is working correctly'
  });
});

// @route   POST /api/upload/audio
// @desc    Upload audio file
// @access  Private
router.post('/audio', authenticateToken, uploadController.uploadAudio);

// @route   POST /api/upload
// @desc    Upload file for NFT creation (audio or image)
// @access  Private
router.post('/', authenticateToken, uploadController.uploadNFTFile);

module.exports = router;