const admin = require('firebase-admin');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Initialize Firebase Admin SDK (you would need to set up service account credentials)
// This is just a placeholder - you would need to properly initialize Firebase Admin SDK
// with your service account credentials in your actual implementation
try {
  admin.initializeApp({
    // credential: admin.credential.cert(serviceAccount),
    // You would typically load this from environment variables or a secure config
  });
} catch (error) {
  console.log('Firebase admin initialization error', error.message);
}

/**
 * Verify Firebase ID token and get user info
 */
exports.verifyFirebaseToken = async (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization || !authorization.startsWith('Bearer ')) {
    return res.status(401).json({ 
      status: 'error', 
      message: 'Unauthorized - No token provided' 
    });
  }

  const token = authorization.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying Firebase token:', error);
    return res.status(401).json({ 
      status: 'error', 
      message: 'Unauthorized - Invalid token' 
    });
  }
};

/**
 * Create or update user in database after Firebase authentication
 */
exports.handleFirebaseAuth = async (req, res) => {
  try {
    const { uid, email, displayName, photoURL } = req.user;

    // Check if user exists in database
    let user = await prisma.user.findUnique({
      where: { firebaseUid: uid }
    });

    if (!user) {
      // Create new user if not exists
      user = await prisma.user.create({
        data: {
          firebaseUid: uid,
          email,
          username: displayName || email.split('@')[0],
          profilePicture: photoURL || '',
        }
      });
    } else {
      // Update existing user
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          email,
          username: displayName || user.username,
          profilePicture: photoURL || user.profilePicture,
        }
      });
    }

    // Return user data
    return res.status(200).json({
      status: 'success',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Error handling Firebase auth:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Server error processing authentication'
    });
  }
};

/**
 * Get current user from Firebase token
 */
exports.getCurrentUser = async (req, res) => {
  try {
    const { uid } = req.user;

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { firebaseUid: uid }
    });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Return user data
    return res.status(200).json({
      status: 'success',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Error getting current user:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Server error retrieving user data'
    });
  }
};