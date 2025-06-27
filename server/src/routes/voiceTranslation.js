const express = require('express');
const router = express.Router();
const voiceTranslationController = require('../controllers/voiceTranslationController');
const { authenticateToken } = require('../middleware/auth');
const { check } = require('express-validator');

// @route   GET /api/voice-translate/options
// @desc    Get supported languages, voice effects, and translation service info
// @access  Public
router.get('/options', voiceTranslationController.getOptions);

// @route   POST /api/voice-translate/test-translation
// @desc    Test translation functionality
// @access  Public
router.post('/test-translation', voiceTranslationController.testTranslation);

// @route   POST /api/voice-translate/text-to-voice
// @desc    Translate text and generate voice without audio input
// @access  Public
router.post('/text-to-voice', voiceTranslationController.textToVoice);

// @route   POST /api/voice-translate/clone-voice
// @desc    Clone voice from audio for use in translations
// @access  Private
router.post(
  '/clone-voice',
  [
    authenticateToken,
    check('audioFileId', 'Audio file ID is required').not().isEmpty()
  ],
  voiceTranslationController.cloneVoice
);

// @route   GET /api/voice-translate/my-voices
// @desc    Get user's cloned voices
// @access  Private
router.get('/my-voices', authenticateToken, voiceTranslationController.getMyVoices);

// @route   POST /api/voice-translate/translate-with-my-voice
// @desc    Translate using a specific cloned voice
// @access  Private
router.post(
  '/translate-with-my-voice',
  [
    authenticateToken,
    check('text', 'Text is required').not().isEmpty(),
    check('targetLanguage', 'Target language is required').not().isEmpty(),
    check('voiceCloneId', 'Voice clone ID is required').not().isEmpty()
  ],
  voiceTranslationController.translateWithMyVoice
);

// @route   POST /api/voice-translate/transform
// @desc    Transform and translate audio in one operation
// @access  Private
router.post(
  '/transform',
  [
    authenticateToken,
    check('audioFileId', 'Audio file ID is required').not().isEmpty(),
    check('targetLanguage', 'Target language is required').not().isEmpty()
  ],
  voiceTranslationController.transformAndTranslate
);

// @route   GET /api/voice-translate/status/:id
// @desc    Get operation status
// @access  Private
router.get('/status/:id', authenticateToken, voiceTranslationController.getOperationStatus);

// @route   GET /api/voice-translate/history
// @desc    Get user's operation history
// @access  Private
router.get('/history', authenticateToken, voiceTranslationController.getOperationHistory);

// @route   POST /api/voice-translate/batch
// @desc    Batch process multiple audio files for voice translation
// @access  Private
router.post(
  '/batch',
  [
    authenticateToken,
    check('audioFileIds', 'Audio file IDs array is required').isArray(),
    check('targetLanguage', 'Target language is required').not().isEmpty()
  ],
  voiceTranslationController.batchTransformAndTranslate
);

// @route   GET /api/voice-translate/batch/:id
// @desc    Get batch operation status
// @access  Private
router.get('/batch/:id', authenticateToken, voiceTranslationController.getBatchStatus);

// @route   POST /api/voice-translate/detect-language
// @desc    Get language detection from audio
// @access  Private
router.post(
  '/detect-language',
  [
    authenticateToken,
    check('audioFileId', 'Audio file ID is required').not().isEmpty()
  ],
  voiceTranslationController.detectLanguage
);

module.exports = router;