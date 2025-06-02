const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const { sendPasswordResetEmail } = require('../utils/emailUtils');

/**
 * Register a new user
 * @route POST /api/auth/signup
 * @access Public
 */
exports.signup = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'error', errors: errors.array() });
  }

  const { username, email, password } = req.body;

  try {
    // Check if user already exists
    const existingUser = await req.prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: existingUser.email === email 
          ? 'Email already in use' 
          : 'Username already taken'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await req.prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        displayName: username,
        updatedAt: new Date(),
      }
    });

    // Create JWT token
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
      status: 'success',
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error during registration'
    });
  }
};

/**
 * Login user
 * @route POST /api/auth/login
 * @access Public
 */
exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'error', errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await req.prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      status: 'success',
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error during login'
    });
  }
};

/**
 * Get current user
 * @route GET /api/auth/me
 * @access Private
 */
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await req.prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Return user data without password
    const { password, ...userWithoutPassword } = user;

    res.json({
      status: 'success',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching user data'
    });
  }
};

/**
 * Request password reset
 * @route POST /api/auth/forgot-password
 * @access Public
 */
exports.forgotPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'error', errors: errors.array() });
  }

  const { email } = req.body;

  try {
    // Find user by email
    const user = await req.prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // For security reasons, don't reveal that the email doesn't exist
      return res.status(200).json({
        status: 'success',
        message: 'If your email is registered, you will receive password reset instructions'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash token before saving to database
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Set token expiry (1 hour from now)
    const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

    // Save token to user record
    await req.prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: tokenExpiry
      }
    });

    // Create reset URL - use a hardcoded URL for development
    // In production, this should be configured properly in environment variables
    const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;
    
    console.log(`Generated reset URL: ${resetUrl}`);

    // Send email
    await sendPasswordResetEmail(user.email, resetUrl);

    res.status(200).json({
      status: 'success',
      message: 'Password reset instructions sent to your email'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    
    // If there was an error, remove the reset token from the user
    if (req.body.email) {
      try {
        await req.prisma.user.updateMany({
          where: { email: req.body.email },
          data: {
            resetPasswordToken: null,
            resetPasswordExpires: null
          }
        });
      } catch (cleanupError) {
        console.error('Error cleaning up reset token:', cleanupError);
      }
    }

    res.status(500).json({
      status: 'error',
      message: 'Server error during password reset request'
    });
  }
};

/**
 * Reset password
 * @route POST /api/auth/reset-password/:token
 * @access Public
 */
exports.resetPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'error', errors: errors.array() });
  }

  const { password } = req.body;
  const { token } = req.params;

  console.log(`Reset password request received for token: ${token}`);

  try {
    // Hash the token from the URL to compare with the stored hashed token
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    console.log(`Looking for user with hashed token: ${hashedToken}`);

    // Find user with the token and check if token is still valid
    const user = await req.prisma.user.findFirst({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      console.log('No user found with valid reset token');
      return res.status(400).json({
        status: 'error',
        message: 'Invalid or expired password reset token'
      });
    }

    console.log(`User found: ${user.email}`);

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update user's password and clear reset token
    await req.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        updatedAt: new Date()
      }
    });

    res.status(200).json({
      status: 'success',
      message: 'Password has been reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error during password reset'
    });
  }
};