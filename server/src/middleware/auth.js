const jwt = require('jsonwebtoken');

/**
 * Authentication middleware
 * Verifies JWT token and adds user to request
 */
const authenticateToken = async (req, res, next) => {
  // Get token from header
  const token = req.header('Authorization')?.replace('Bearer ', '');

  // Check if no token
  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'No token, authorization denied'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    const user = await req.prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token'
      });
    }

    // Add user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({
      status: 'error',
      message: 'Token is not valid'
    });
  }
};

module.exports = {
  authenticateToken
};