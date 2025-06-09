const express = require('express');
const router = express.Router();
const savedVoiceController = require('../controllers/savedVoiceController');
const { authenticateToken } = require('../middleware/auth');
const { check } = require('express-validator');

// @route   GET /api/voice/saved/public
// @desc    Get public saved voice creations
// @access  Public
router.get('/public', savedVoiceController.getPublicSavedVoiceCreations);

// @route   POST /api/voice/saved
// @desc    Save a voice creation
// @access  Private
router.post(
  '/',
  [
    authenticateToken,
    check('name', 'Name is required').not().isEmpty(),
    check('originalAudioId', 'Original audio ID is required').not().isEmpty()
  ],
  savedVoiceController.saveVoiceCreation
);

// @route   GET /api/voice/saved
// @desc    Get user's saved voice creations
// @access  Private
router.get('/', authenticateToken, savedVoiceController.getSavedVoiceCreations);

// @route   GET /api/voice/saved/:id
// @desc    Get a specific saved voice creation
// @access  Private
router.get('/:id', authenticateToken, savedVoiceController.getSavedVoiceCreation);

// @route   PUT /api/voice/saved/:id
// @desc    Update a saved voice creation
// @access  Private
router.put(
  '/:id',
  [
    authenticateToken,
    check('name', 'Name cannot be empty').optional().not().isEmpty()
  ],
  savedVoiceController.updateSavedVoiceCreation
);

// @route   DELETE /api/voice/saved/:id
// @desc    Delete a saved voice creation
// @access  Private
router.delete('/:id', authenticateToken, savedVoiceController.deleteSavedVoiceCreation);

module.exports = router;