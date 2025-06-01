const { check } = require('express-validator');

// Signup validation
exports.signupValidation = [
  check('username', 'Username is required').not().isEmpty(),
  check('username', 'Username must be between 3 and 20 characters').isLength({ min: 3, max: 20 }),
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password must be at least 6 characters').isLength({ min: 6 })
];

// Login validation
exports.loginValidation = [
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password is required').exists()
];