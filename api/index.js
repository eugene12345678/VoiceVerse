const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

// Import routes
const authRoutes = require('../server/src/routes/auth');
const voiceRoutes = require('../server/src/routes/voice');
const translationRoutes = require('../server/src/routes/translation');
const voiceTranslationRoutes = require('../server/src/routes/voiceTranslation');
const uploadRoutes = require('../server/src/routes/upload');
const feedRoutes = require('../server/src/routes/feed');
const challengeRoutes = require('../server/src/routes/challenge');
const algorandRoutes = require('../server/src/routes/algorand');
const subscriptionRoutes = require('../server/src/routes/subscriptionRoutes');
const contactRoutes = require('../server/src/routes/contactRoutes');
const audioRoutes = require('../server/src/routes/audio');
const savedVoiceRoutes = require('../server/src/routes/savedVoice');
const userRoutes = require('../server/src/routes/user');
const healthRoutes = require('../server/src/routes/health');

require('dotenv').config();

// Initialize Express app
const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://voice-verse-two.vercel.app',
    'https://*.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Range', 'Accept', 'Origin', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length', 'X-Audio-Fallback']
}));
app.use(express.json());
app.use(morgan('dev'));

// Serve static files
app.use('/api/audio', express.static(path.join(process.cwd(), 'server', 'uploads', 'audio')));
app.use('/api/audio/original', express.static(path.join(process.cwd(), 'server', 'uploads', 'audio', 'original')));
app.use('/api/audio/translated', express.static(path.join(process.cwd(), 'server', 'uploads', 'audio', 'translated')));
app.use('/api/images', express.static(path.join(process.cwd(), 'server', 'uploads', 'images')));
app.use('/api/images/nft', express.static(path.join(process.cwd(), 'server', 'uploads', 'images', 'nft')));
app.use('/api/images/profiles', express.static(path.join(process.cwd(), 'server', 'uploads', 'images', 'profiles')));
app.use('/uploads', express.static(path.join(process.cwd(), 'server', 'uploads')));

// Create directories if they don't exist
const ensureDirectoriesExist = () => {
  const directories = [
    path.join(process.cwd(), 'server', 'uploads'),
    path.join(process.cwd(), 'server', 'uploads', 'audio'),
    path.join(process.cwd(), 'server', 'uploads', 'audio', 'original'),
    path.join(process.cwd(), 'server', 'uploads', 'audio', 'translated'),
    path.join(process.cwd(), 'server', 'uploads', 'images'),
    path.join(process.cwd(), 'server', 'uploads', 'images', 'nft'),
    path.join(process.cwd(), 'server', 'uploads', 'images', 'profiles')
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
app.use('/api/health', healthRoutes);

// Special handling for Stripe webhook endpoint
app.post('/api/subscription/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const subscriptionController = require('../server/src/controllers/subscriptionController');
  subscriptionController.handleWebhook(req, res);
});

// Direct NFT route for backward compatibility
app.post('/nft/create', (req, res, next) => {
  console.log('NFT create request received at /nft/create, forwarding to nftController.createNFT');
  console.log('Request body:', req.body);
  
  // Forward to the NFT controller which handles database creation properly
  const nftController = require('../server/src/controllers/nftController');
  
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
  const { authenticateToken } = require('../server/src/middleware/auth');
  authenticateToken(req, res, () => nftController.createNFT(req, res, next));
});

// Also add the same route at /api/algorand/nft/create for direct access
app.post('/api/algorand/nft/create', (req, res, next) => {
  console.log('NFT create request received at /api/algorand/nft/create');
  console.log('Request body:', req.body);
  
  // Forward to the NFT controller which handles database creation properly
  const nftController = require('../server/src/controllers/nftController');
  
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
  const { authenticateToken } = require('../server/src/middleware/auth');
  authenticateToken(req, res, () => nftController.createNFT(req, res, next));
});

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to VoiceVerse API' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: err.message || 'Something went wrong on the server',
  });
});

// Export the Express app for Vercel
module.exports = app;