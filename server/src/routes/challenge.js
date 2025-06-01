const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const challengeController = require('../controllers/challengeController');
const { authenticateToken } = require('../middleware/auth');

// Create a non-blocking auth middleware that sets req.user if token exists
// but doesn't block requests without a token
const optionalAuthMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    // If no token, just continue
    if (!token) {
      return next();
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from database
      const user = await req.prisma.user.findUnique({
        where: { id: decoded.id }
      });
      
      if (user) {
        req.user = user;
      }
    } catch (error) {
      console.error('Optional auth error:', error);
      // Continue anyway, don't set req.user
    }
    
    next();
  } catch (error) {
    console.error('Unexpected error in optional auth middleware:', error);
    next(); // Continue anyway
  }
};

// Get user's challenges (requires authentication)
router.get('/user/challenges', authenticateToken, challengeController.getUserChallenges);

// Get all challenges with filtering, pagination, and search
router.get('/', optionalAuthMiddleware, challengeController.getChallenges);

// Create a new challenge (requires authentication)
router.post('/', authenticateToken, challengeController.createChallenge);

// Get a single challenge by ID
router.get('/:id', optionalAuthMiddleware, challengeController.getChallenge);

// Join a challenge (requires authentication)
router.post('/:id/join', authenticateToken, challengeController.joinChallenge);

// Submit to a challenge (requires authentication)
router.post('/:id/submit', authenticateToken, challengeController.submitToChallenge);

// Get challenge submissions
router.get('/:id/submissions', optionalAuthMiddleware, challengeController.getChallengeSubmissions);

module.exports = router;