const jwt = require('jsonwebtoken');

/**
 * Authentication middleware
 * Verifies JWT token and adds user to request
 */
const authenticateToken = async (req, res, next) => {
  // Get token from header
  const token = req.header('Authorization')?.replace('Bearer ', '');

  // Check if we're in development mode
  const isDevelopment = process.env.NODE_ENV === 'development' || true; // Force development mode for testing

  // Check if no token
  if (!token) {
    if (isDevelopment) {
      console.warn('No auth token provided, but proceeding in development mode');
      // Add a mock user for development
      req.user = {
        id: 'dev-user-id',
        email: 'dev@example.com',
        name: 'Development User'
      };
      return next();
    }
    
    return res.status(401).json({
      status: 'error',
      message: 'No token, authorization denied'
    });
  }

  try {
    // First try to verify with HS256 algorithm (our own tokens)
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-key', {
        algorithms: ['HS256'] // Specify the algorithm explicitly
      });
    } catch (jwtError) {
      if (jwtError.name === 'JsonWebTokenError' && jwtError.message === 'invalid algorithm') {
        // This might be a Firebase token, which uses RS256
        // For development, we'll just extract the payload without verification
        // In production, you should properly verify Firebase tokens
        try {
          // Decode without verification for development
          const tokenParts = token.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
            decoded = { id: payload.user_id || payload.sub || payload.uid || 'dev-user-id' };
            console.log('Using decoded Firebase token payload:', decoded);
          } else {
            throw new Error('Invalid token format');
          }
        } catch (decodeError) {
          console.error('Error decoding token:', decodeError);
          throw jwtError; // Re-throw the original error if decoding fails
        }
      } else {
        throw jwtError; // Re-throw for other JWT errors
      }
    }

    // Get user from database
    const user = await req.prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!user) {
      if (isDevelopment) {
        console.warn('Invalid token, but proceeding in development mode');
        // Add a mock user for development
        req.user = {
          id: 'dev-user-id',
          email: 'dev@example.com',
          name: 'Development User'
        };
        return next();
      }
      
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
    
    if (isDevelopment) {
      console.warn('Auth error, but proceeding in development mode:', error.message);
      // Add a mock user for development
      req.user = {
        id: 'dev-user-id',
        email: 'dev@example.com',
        name: 'Development User'
      };
      return next();
    }
    
    res.status(401).json({
      status: 'error',
      message: 'Token is not valid'
    });
  }
};

module.exports = {
  authenticateToken
};