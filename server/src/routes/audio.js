const express = require('express');
const router = express.Router();
const audioController = require('../controllers/audioController');

// CORS preflight handler for all audio routes
const handleCorsOptions = (req, res) => {
  console.log(`[AUDIO-ROUTE] Handling CORS OPTIONS for: ${req.originalUrl}`);
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Range, Content-Type, Authorization');
  res.set('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Content-Type, X-Audio-Source, X-Audio-Fallback');
  res.set('Access-Control-Max-Age', '86400'); // 24 hours
  res.status(200).end();
};

// Middleware to log all audio route requests
router.use((req, res, next) => {
  console.log(`[AUDIO-ROUTE] ${req.method} ${req.originalUrl} - User-Agent: ${req.headers['user-agent']}`);
  console.log(`[AUDIO-ROUTE] Headers: Accept=${req.headers['accept']}, Origin=${req.headers['origin']}`);
  
  // Ensure CORS headers are always set for audio routes
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Range, Content-Type, Authorization');
  res.set('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Content-Type, X-Audio-Source, X-Audio-Fallback');
  
  next();
});

// @route   OPTIONS /api/audio/:id
// @desc    Handle CORS preflight for audio files
// @access  Public
router.options('/:id', handleCorsOptions);

// @route   GET /api/audio/:id
// @desc    Get audio file by ID (checks both original and transformed audio)
// @access  Public
router.get('/:id', audioController.getAudioFile);

// @route   HEAD /api/audio/:id
// @desc    Get audio file headers by ID (for debugging)
// @access  Public
router.head('/:id', audioController.getAudioFile);

// @route   OPTIONS /api/audio/original/:id
// @desc    Handle CORS preflight for original audio files
// @access  Public
router.options('/original/:id', handleCorsOptions);

// @route   GET /api/audio/original/:id
// @desc    Get original audio file by ID
// @access  Public
router.get('/original/:id', audioController.getOriginalAudio);

// @route   HEAD /api/audio/original/:id
// @desc    Get original audio file headers by ID (for debugging)
// @access  Public
router.head('/original/:id', audioController.getOriginalAudio);

// @route   OPTIONS /api/audio/translated/:id
// @desc    Handle CORS preflight for translated audio files
// @access  Public
router.options('/translated/:id', handleCorsOptions);

// @route   GET /api/audio/translated/:id
// @desc    Get translated audio file by ID
// @access  Public
router.get('/translated/:id', audioController.getTranslatedAudio);

// @route   HEAD /api/audio/translated/:id
// @desc    Get translated audio file headers by ID (for debugging)
// @access  Public
router.head('/translated/:id', audioController.getTranslatedAudio);

// @route   GET /api/audio/debug/:id
// @desc    Get debug information for audio file
// @access  Public
router.get('/debug/:id', audioController.debugAudioFile);

// @route   GET /api/audio/test/:id
// @desc    Get test page for audio file
// @access  Public
router.get('/test/:id', audioController.testAudioFile);

// @route   GET /api/audio/convert/:id
// @desc    Convert audio file to different format
// @access  Public
router.get('/convert/:id', audioController.convertAudioFile);

// @route   GET /api/audio/health/test
// @desc    Test audio serving with a known working audio file
// @access  Public
router.get('/health/test', (req, res) => {
  try {
    console.log('[HEALTH] Audio health test requested');
    
    // Create a minimal silent MP3 for testing
    const testAudio = Buffer.from([
      0xFF, 0xFB, 0x90, 0x00, // MP3 header
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    ]);
    
    res.set('Content-Type', 'audio/mpeg');
    res.set('Content-Length', testAudio.length);
    res.set('Accept-Ranges', 'bytes');
    res.set('Cache-Control', 'no-cache');
    res.set('Access-Control-Allow-Origin', '*');
    res.set('X-Audio-Test', 'true');
    
    console.log('[HEALTH] Serving test audio, size:', testAudio.length);
    res.send(testAudio);
  } catch (error) {
    console.error('[HEALTH] Audio health test failed:', error);
    res.status(500).json({ error: 'Audio health test failed', message: error.message });
  }
});

// Catch-all route for unmatched audio requests - this should be LAST
router.get('*', (req, res) => {
  console.log(`[AUDIO-ROUTE] Catch-all route hit for: ${req.originalUrl}`);
  console.log(`[AUDIO-ROUTE] Method: ${req.method}, Path: ${req.path}, Params:`, req.params);
  
  // Extract potential ID from the path
  const pathParts = req.path.split('/').filter(part => part.length > 0);
  const potentialId = pathParts[pathParts.length - 1];
  
  console.log(`[AUDIO-ROUTE] Extracted potential ID: ${potentialId}`);
  
  // If it looks like an audio ID, try to serve it
  if (potentialId && potentialId.length > 10) {
    console.log(`[AUDIO-ROUTE] Attempting to serve audio for ID: ${potentialId}`);
    req.params.id = potentialId;
    return audioController.getAudioFile(req, res);
  }
  
  // Otherwise return a 404 with proper CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Content-Type', 'application/json');
  res.status(404).json({
    error: 'Audio route not found',
    path: req.originalUrl,
    message: 'The requested audio endpoint does not exist'
  });
});

module.exports = router;