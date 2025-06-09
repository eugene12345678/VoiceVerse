const express = require('express');
const router = express.Router();
const audioController = require('../controllers/audioController');

// @route   GET /api/audio/:id
// @desc    Get audio file by ID (checks both original and transformed audio)
// @access  Public
router.get('/:id', audioController.getAudioFile);

// @route   GET /api/audio/original/:id
// @desc    Get original audio file by ID
// @access  Public
router.get('/original/:id', audioController.getOriginalAudio);

// @route   GET /api/audio/translated/:id
// @desc    Get translated audio file by ID
// @access  Public
router.get('/translated/:id', audioController.getTranslatedAudio);

module.exports = router;