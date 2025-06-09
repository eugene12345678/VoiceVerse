const express = require('express');
const router = express.Router();
const voiceController = require('../controllers/voiceController');
const celebrityVoiceController = require('../controllers/celebrityVoiceController');
const emotionVoiceController = require('../controllers/emotionVoiceController');
const { authenticateToken } = require('../middleware/auth');
const { check } = require('express-validator');

// @route   GET /api/voice/effects
// @desc    Get all available voice effects
// @access  Public
router.get('/effects', voiceController.getVoiceEffects);

// @route   GET /api/voice/models
// @desc    Get all voice models for a user
// @access  Private
router.get('/models', authenticateToken, voiceController.getUserVoiceModels);

// @route   GET /api/voice/elevenlabs/voices
// @desc    Get available ElevenLabs voices
// @access  Private
router.get('/elevenlabs/voices', authenticateToken, voiceController.getElevenLabsVoices);

// @route   GET /api/voice/celebrity/voices
// @desc    Get celebrity voices with actual ElevenLabs IDs
// @access  Public
router.get('/celebrity/voices', celebrityVoiceController.getCelebrityVoices);

// @route   GET /api/voice/emotion/voices
// @desc    Get emotion voices with ElevenLabs IDs and settings
// @access  Public
router.get('/emotion/voices', emotionVoiceController.getEmotionVoices);

// @route   POST /api/voice/emotion/transform
// @desc    Transform audio with emotion effect
// @access  Private
router.post(
  '/emotion/transform',
  [
    authenticateToken,
    check('audioFileId', 'Audio file ID is required').not().isEmpty(),
    check('emotionId', 'Emotion ID is required').not().isEmpty()
  ],
  emotionVoiceController.transformWithEmotion
);

// @route   GET /api/voice/emotion/transform/:id
// @desc    Get emotion transformation status
// @access  Private
router.get('/emotion/transform/:id', authenticateToken, emotionVoiceController.getEmotionTransformationStatus);

// @route   POST /api/voice/clone
// @desc    Clone a voice using ElevenLabs
// @access  Private
router.post(
  '/clone',
  [
    authenticateToken,
    check('name', 'Name is required').not().isEmpty(),
    check('audioFileId', 'Audio file ID is required').not().isEmpty()
  ],
  voiceController.cloneVoice
);

// @route   POST /api/voice/transform
// @desc    Transform audio using a voice effect
// @access  Private
router.post(
  '/transform',
  [
    authenticateToken,
    check('audioFileId', 'Audio file ID is required').not().isEmpty(),
    check('effectId', 'Effect ID is required').not().isEmpty()
  ],
  voiceController.transformAudio
);

// @route   GET /api/voice/transform/:id
// @desc    Get transformation status
// @access  Private
router.get('/transform/:id', authenticateToken, voiceController.getTransformationStatus);

// @route   GET /api/voice/history
// @desc    Get user's transformation history
// @access  Private
router.get('/history', authenticateToken, voiceController.getTransformationHistory);

module.exports = router;