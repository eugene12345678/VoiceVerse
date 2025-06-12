const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');

// Get current user's profile (requires authentication)
router.get('/profile', authenticateToken, userController.getUserProfile);

// Update current user's profile (requires authentication)
router.put('/profile', authenticateToken, userController.updateUserProfile);

// Update profile picture (requires authentication)
router.post('/avatar', authenticateToken, userController.updateProfilePicture);

// Remove profile picture (requires authentication)
router.delete('/avatar', authenticateToken, userController.removeProfilePicture);

// Toggle profile visibility (requires authentication)
router.put('/visibility', authenticateToken, userController.toggleProfileVisibility);

// Get current user's posts (requires authentication)
router.get('/posts', authenticateToken, userController.getUserPosts);

// Get current user's followers (requires authentication)
router.get('/followers', authenticateToken, userController.getUserFollowers);

// Get current user's following (requires authentication)
router.get('/following', authenticateToken, userController.getUserFollowing);

// Get current user's activity (requires authentication)
router.get('/activity', authenticateToken, userController.getUserActivity);

// Get current user's top recordings (requires authentication)
router.get('/top-recordings', authenticateToken, userController.getUserTopRecordings);

// Get current user's badges (requires authentication)
router.get('/badges', authenticateToken, userController.getUserBadges);

// Get current user's achievements (requires authentication)
router.get('/achievements', authenticateToken, userController.getUserAchievements);

// Follow/unfollow a user (requires authentication)
router.post('/:userId/follow', authenticateToken, userController.toggleFollowUser);

// Get specific user's posts (public endpoint for public profiles)
router.get('/:userId/posts', userController.getUserPosts);

// Get specific user's followers (public endpoint)
router.get('/:userId/followers', userController.getUserFollowers);

// Get specific user's following (public endpoint)
router.get('/:userId/following', userController.getUserFollowing);

// Get specific user's activity (public endpoint)
router.get('/:userId/activity', userController.getUserActivity);

// Get specific user's top recordings (public endpoint)
router.get('/:userId/top-recordings', userController.getUserTopRecordings);

// Get specific user's badges (public endpoint)
router.get('/:userId/badges', userController.getUserBadges);

// Get specific user's achievements (public endpoint)
router.get('/:userId/achievements', userController.getUserAchievements);

// Get specific user's profile (public endpoint, but enhanced with auth)
// This should be last to avoid conflicts with other routes
router.get('/:userId', userController.getUserProfile);

module.exports = router;