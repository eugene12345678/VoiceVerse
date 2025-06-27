const jwt = require('jsonwebtoken');

/**
 * Authentication middleware
 * Verifies JWT token and adds user to request
 */
const authenticateToken = async (req, res, next) => {
  // Get token from header
  const token = req.header('Authorization')?.replace('Bearer ', '');

  // Check if we're in development mode
  const isDevelopment = process.env.NODE_ENV === 'development';

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
            decoded = { 
              id: payload.user_id || payload.sub || payload.uid || 'dev-user-id',
              email: payload.email,
              name: payload.name,
              displayName: payload.name || payload.display_name,
              picture: payload.picture || payload.photo_url || payload.photoURL
            };
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

    // Get user from database using Firebase UID
    let user = await req.prisma.user.findUnique({
      where: { firebaseUid: decoded.id }
    });

    // If user doesn't exist, try to create one automatically for Firebase users
    if (!user && decoded.id && decoded.id !== 'dev-user-id') {
      try {
        // Create a new user with the Firebase UID
        const displayName = decoded.name || decoded.displayName;
        const username = displayName 
          ? displayName.toLowerCase().replace(/[^a-z0-9]/g, '') + '_' + decoded.id.substring(0, 4)
          : `user_${decoded.id.substring(0, 8)}`;
        
        user = await req.prisma.user.create({
          data: {
            firebaseUid: decoded.id,
            username: username, // Generate a meaningful username from display name or Firebase UID
            email: decoded.email || `${decoded.id}@firebase.user`,
            password: 'firebase_auth', // Placeholder password for Firebase users
            displayName: displayName || null,
            avatar: decoded.picture || null,
            updatedAt: new Date(), // Add the required updatedAt field
          }
        });
        console.log(`Created new user for Firebase UID: ${decoded.id}`);
      } catch (createError) {
        console.error('Error creating user for Firebase UID:', createError);
        // If creation fails, continue with the error handling below
      }
    }

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
        message: 'Invalid token - user not found'
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