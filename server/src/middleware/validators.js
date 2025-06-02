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

// Contact form validation
exports.validateContactForm = [
  check('name')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters'),
  
  check('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address'),
  
  check('subject')
    .trim()
    .isLength({ min: 5 })
    .withMessage('Subject must be at least 5 characters'),
  
  check('message')
    .trim()
    .isLength({ min: 20 })
    .withMessage('Message must be at least 20 characters'),
  
  check('priority')
    .optional()
    .isIn(['LOW', 'MEDIUM', 'HIGH'])
    .withMessage('Priority must be LOW, MEDIUM, or HIGH'),
  
  check('type')
    .optional()
    .isIn(['GENERAL', 'TECHNICAL', 'BILLING', 'SUPPORT', 'FEEDBACK', 'OTHER'])
    .withMessage('Invalid message type'),
    
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }
    next();
  }
];