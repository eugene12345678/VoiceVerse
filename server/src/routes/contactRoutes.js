const express = require('express');
const router = express.Router();
const { submitContactForm, initAIChat, sendAIMessage, handleCalendlyWebhook } = require('../controllers/contactController');
const { auth } = require('../middleware/auth');
const { validateContactForm } = require('../middleware/validators');

// Public routes
router.post('/submit', validateContactForm, submitContactForm);
router.post('/calendly-webhook', handleCalendlyWebhook);

// AI Assistant routes
router.post('/ai/init', initAIChat);
router.post('/ai/message', sendAIMessage);

module.exports = router;