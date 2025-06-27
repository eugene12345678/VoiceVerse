const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// @route   GET /api/health
// @desc    Health check endpoint
// @access  Public
router.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'VoiceVerse API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    isVercel: !!process.env.VERCEL
  });
});

// @route   GET /api/health/audio
// @desc    Test audio serving capability
// @access  Public
router.get('/audio', (req, res) => {
  try {
    // Create a minimal MP3 header for a test audio file
    const testMp3Buffer = Buffer.from([
      0xFF, 0xFB, 0x90, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      // Add some more bytes to make it a valid minimal MP3
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    ]);
    
    res.set('Content-Type', 'audio/mpeg');
    res.set('Content-Length', testMp3Buffer.length);
    res.set('X-Audio-Test', 'true');
    res.set('Cache-Control', 'no-cache');
    res.set('Access-Control-Allow-Origin', '*');
    
    res.send(testMp3Buffer);
  } catch (error) {
    console.error('Error serving test audio:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to serve test audio',
      error: error.message
    });
  }
});

module.exports = router;