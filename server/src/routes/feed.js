const express = require('express');
const router = express.Router();
const feedController = require('../controllers/feedController');
const { authenticateToken } = require('../middleware/auth');
const { check } = require('express-validator');

// @route   GET /api/feed
// @desc    Get all feed posts
// @access  Public
router.get('/', feedController.getFeedPosts);

// @route   POST /api/feed
// @desc    Create a new feed post
// @access  Private
router.post(
  '/',
  [
    authenticateToken,
    check('audioFileId', 'Audio file ID is required').not().isEmpty(),
    check('caption', 'Caption is required').not().isEmpty()
  ],
  feedController.createFeedPost
);

// @route   GET /api/feed/saved
// @desc    Get saved posts for the current user
// @access  Private
router.get('/saved', authenticateToken, feedController.getSavedPosts);

// @route   POST /api/feed/comments/:id/like
// @desc    Like a comment
// @access  Private
router.post('/comments/:id/like', authenticateToken, feedController.likeComment);

// @route   GET /api/feed/:id
// @desc    Get a specific feed post
// @access  Public
router.get('/:id', feedController.getFeedPost);

// @route   POST /api/feed/:id/like
// @desc    Like a feed post
// @access  Private
router.post('/:id/like', authenticateToken, feedController.likeFeedPost);

// @route   POST /api/feed/:id/save
// @desc    Save a feed post
// @access  Private
router.post('/:id/save', authenticateToken, feedController.saveFeedPost);

// @route   POST /api/feed/:id/share
// @desc    Share a feed post
// @access  Private
router.post('/:id/share', authenticateToken, feedController.shareFeedPost);

// @route   GET /api/feed/:id/comments
// @desc    Get comments for a feed post
// @access  Public
router.get('/:id/comments', feedController.getFeedPostComments);

// @route   POST /api/feed/:id/comments
// @desc    Add a comment to a feed post
// @access  Private
router.post(
  '/:id/comments',
  [
    authenticateToken,
    check('content', 'Comment content is required').not().isEmpty()
  ],
  feedController.addFeedPostComment
);

module.exports = router;