const express = require('express');
const router = express.Router();
const { submitContactForm, initAIChat, sendAIMessage, handleCalendlyWebhook } = require('../controllers/contactController');
const { auth } = require('../middleware/auth');
// We're not using the validator middleware for the contact form anymore
// since we're handling validation in the controller after parsing multipart/form-data

// Public routes
router.post('/submit', submitContactForm); // Removed validateContactForm middleware
router.post('/calendly-webhook', handleCalendlyWebhook);

// AI Assistant routes
router.post('/ai/init', initAIChat);
router.post('/ai/message', sendAIMessage);

module.exports = router;