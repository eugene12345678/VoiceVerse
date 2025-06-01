const express = require('express');
const router = express.Router();
const translationController = require('../controllers/translationController');
const authMiddleware = require('../middleware/auth');
const { check } = require('express-validator');

// @route   GET /api/translation/languages
// @desc    Get supported languages
// @access  Public
router.get('/languages', translationController.getSupportedLanguages);

// @route   POST /api/translation/text
// @desc    Translate text
// @access  Private
router.post(
  '/text',
  [
    authMiddleware,
    check('text', 'Text is required').not().isEmpty(),
    check('targetLanguage', 'Target language is required').not().isEmpty()
  ],
  translationController.translateText
);

// @route   POST /api/translation/audio
// @desc    Translate audio
// @access  Private
router.post(
  '/audio',
  [
    authMiddleware,
    check('audioFileId', 'Audio file ID is required').not().isEmpty(),
    check('targetLanguage', 'Target language is required').not().isEmpty(),
    check('voiceId', 'Voice ID is required').not().isEmpty()
  ],
  translationController.translateAudio
);

// @route   GET /api/translation/history
// @desc    Get user's translation history
// @access  Private
router.get('/history', authMiddleware, translationController.getTranslationHistory);

// @route   GET /api/translation/:id
// @desc    Get translation status
// @access  Private
router.get('/:id', authMiddleware, translationController.getTranslationStatus);

// @route   PUT /api/translation/preference
// @desc    Update user language preference
// @access  Private
router.put(
  '/preference',
  [
    authMiddleware,
    check('language', 'Language is required').not().isEmpty()
  ],
  translationController.updateLanguagePreference
);

module.exports = router;