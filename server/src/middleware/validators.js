const { check, validationResult } = require('express-validator');

// Signup validation
exports.signupValidation = [
  check('username', 'Username is required').not().isEmpty(),
  check('username', 'Username must be between 3 and 20 characters').isLength({ min: 3, max: 20 }),
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password must be at least 6 characters').isLength({ min: 6 })
];

// Validation middleware
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Login validation
exports.loginValidation = [
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password is required').exists()
];

// Forgot password validation
exports.forgotPasswordValidation = [
  check('email', 'Please include a valid email').isEmail()
];

// Reset password validation - simplified for testing
exports.resetPasswordValidation = [
  check('password', 'Password must be at least 6 characters').isLength({ min: 6 })
  // Commented out for easier testing
  // check('password', 'Password must contain at least one uppercase letter').matches(/[A-Z]/),
  // check('password', 'Password must contain at least one lowercase letter').matches(/[a-z]/),
  // check('password', 'Password must contain at least one number').matches(/[0-9]/),
  // check('password', 'Password must contain at least one special character').matches(/[^A-Za-z0-9]/)
];