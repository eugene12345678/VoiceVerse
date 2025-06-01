const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const authRoutes = require('./routes/auth');
const voiceRoutes = require('./routes/voice');
const translationRoutes = require('./routes/translation');
const uploadRoutes = require('./routes/upload');
const feedRoutes = require('./routes/feed');
const challengeRoutes = require('./routes/challenge');
const algorandRoutes = require('./routes/algorand');
require('dotenv').config();

// Initialize Express app
const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use('/api/audio', express.static(path.join(process.cwd(), 'uploads', 'audio')));
app.use('/api/images/nft', express.static(path.join(process.cwd(), 'uploads', 'images', 'nft')));

// Make Prisma available to routes
app.use((req, res, next) => {
  req.prisma = prisma;
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/translation', translationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/algorand', algorandRoutes);

// Direct NFT route for backward compatibility
app.post('/nft/create', (req, res, next) => {
  console.log('NFT create request received at /nft/create, forwarding to nftController.createNFT');
  console.log('Request body:', req.body);
  
  // Forward to the NFT controller which handles database creation properly
  const nftController = require('./controllers/nftController');
  
  // Skip authentication in development mode
  const isDevelopment = process.env.NODE_ENV === 'development' || true;
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
  const isDevelopment = process.env.NODE_ENV === 'development' || true;
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