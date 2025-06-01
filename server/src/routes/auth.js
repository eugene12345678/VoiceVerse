const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { signupValidation, loginValidation } = require('../middleware/validators');

// @route   POST /api/auth/signup
// @desc    Register a new user
// @access  Public
router.post('/signup', signupValidation, authController.signup);

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', loginValidation, authController.login);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authenticateToken, authController.getCurrentUser);

module.exports = router;