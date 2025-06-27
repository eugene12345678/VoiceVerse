const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const authRoutes = require('./routes/auth');
const voiceRoutes = require('./routes/voice');
const translationRoutes = require('./routes/translation');
const voiceTranslationRoutes = require('./routes/voiceTranslation');
const uploadRoutes = require('./routes/upload');
const feedRoutes = require('./routes/feed');
const challengeRoutes = require('./routes/challenge');
const algorandRoutes = require('./routes/algorand');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const contactRoutes = require('./routes/contactRoutes');
const audioRoutes = require('./routes/audio');
const savedVoiceRoutes = require('./routes/savedVoice');
const userRoutes = require('./routes/user');
require('dotenv').config();

// Initialize Express app
const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Serve static files
app.use('/api/audio', express.static(path.join(process.cwd(), 'uploads', 'audio')));
app.use('/api/audio/original', express.static(path.join(process.cwd(), 'uploads', 'audio', 'original')));
app.use('/api/audio/translated', express.static(path.join(process.cwd(), 'uploads', 'audio', 'translated')));
app.use('/api/images', express.static(path.join(process.cwd(), 'uploads', 'images')));
app.use('/api/images/nft', express.static(path.join(process.cwd(), 'uploads', 'images', 'nft')));
app.use('/api/images/profiles', express.static(path.join(process.cwd(), 'uploads', 'images', 'profiles')));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Create directories if they don't exist
const ensureDirectoriesExist = () => {
  const directories = [
    path.join(process.cwd(), 'uploads'),
    path.join(process.cwd(), 'uploads', 'audio'),
    path.join(process.cwd(), 'uploads', 'audio', 'original'),
    path.join(process.cwd(), 'uploads', 'audio', 'translated'),
    path.join(process.cwd(), 'uploads', 'images'),
    path.join(process.cwd(), 'uploads', 'images', 'nft'),
    path.join(process.cwd(), 'uploads', 'images', 'profiles')
  ];
  
  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  });
};

// Ensure upload directories exist
ensureDirectoriesExist();

// Make Prisma available to routes
app.use((req, res, next) => {
  req.prisma = prisma;
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/translation', translationRoutes);
app.use('/api/voice-translate', voiceTranslationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/algorand', algorandRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/audio', audioRoutes);
app.use('/api/voice/saved', savedVoiceRoutes);
app.use('/api/users', userRoutes);

// Special handling for Stripe webhook endpoint
app.post('/api/subscription/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const subscriptionController = require('./controllers/subscriptionController');
  subscriptionController.handleWebhook(req, res);
});

// Direct NFT route for backward compatibility
app.post('/nft/create', (req, res, next) => {
  console.log('NFT create request received at /nft/create, forwarding to nftController.createNFT');
  console.log('Request body:', req.body);
  
  // Forward to the NFT controller which handles database creation properly
  const nftController = require('./controllers/nftController');
  
  // Skip authentication in development mode
  const isDevelopment = process.env.NODE_ENV === 'development';
  if (isDevelopment) {
    // Add a mock user for development
    req.user = {
      id: req.body.userId || 'dev-user-id',
      email: 'dev@example.com',
      name: 'Development User'
    };
    return nftController.createNFT(req, res, next);
  }
  
  // Use authentication middleware in production
  const { authenticateToken } = require('./middleware/auth');
  authenticateToken(req, res, () => nftController.createNFT(req, res, next));
});

// Also add the same route at /api/algorand/nft/create for direct access
app.post('/api/algorand/nft/create', (req, res, next) => {
  console.log('NFT create request received at /api/algorand/nft/create');
  console.log('Request body:', req.body);
  
  // Forward to the NFT controller which handles database creation properly
  const nftController = require('./controllers/nftController');
  
  // Skip authentication in development mode
  const isDevelopment = process.env.NODE_ENV === 'development';
  if (isDevelopment) {
    // Add a mock user for development
    req.user = {
      id: req.body.userId || 'dev-user-id',
      email: 'dev@example.com',
      name: 'Development User'
    };
    return nftController.createNFT(req, res, next);
  }
  
  // Use authentication middleware in production
  const { authenticateToken } = require('./middleware/auth');
  authenticateToken(req, res, () => nftController.createNFT(req, res, next));
});

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to VoiceVerse API' });
});

// Remove the redirect that's causing the infinite loop

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: err.message || 'Something went wrong on the server',
  });
});

// Start server
const PORT = process.env.PORT || 5000;
const startServer = (port) => {
  const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} is already in use, trying port ${port + 1}`);
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
    }
  });
  
  return server;
};

startServer(PORT);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  // Close server & exit process
  // server.close(() => process.exit(1));
});