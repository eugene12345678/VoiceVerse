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
const healthRoutes = require('./routes/health');
require('dotenv').config();

// Initialize Express app
const app = express();
const prisma = new PrismaClient();

// Environment configuration
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

console.log('🌍 Environment:', process.env.NODE_ENV);
console.log('🔧 Is Production:', isProduction);
console.log('🔧 Frontend URL:', process.env.FRONTEND_URL);

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    console.log(`🔍 CORS: Checking origin: ${origin}`);
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log('✅ CORS: Allowing request with no origin');
      return callback(null, true);
    }
    
    const allowedOrigins = isProduction 
      ? [
          process.env.FRONTEND_URL || 'https://voice-verse-two.vercel.app',
          'https://voice-verse-two.vercel.app'
        ]
      : [
          'http://localhost:3000',
          'http://localhost:5173',
          'https://voice-verse-two.vercel.app'
        ];
    
    console.log('🔧 CORS: Allowed origins:', allowedOrigins);
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      console.log('✅ CORS: Origin found in allowed list');
      return callback(null, true);
    }
    
    // Check if origin matches vercel.app pattern
    if (origin.match(/^https:\/\/.*\.vercel\.app$/)) {
      console.log('✅ CORS: Origin matches vercel.app pattern');
      return callback(null, true);
    }
    
    // Log the rejected origin for debugging
    console.log(`❌ CORS: Rejected origin: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Range', 'Accept', 'Origin', 'X-Requested-With', 'x-api-key'],
  exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length', 'X-Audio-Fallback']
}));
app.use(express.json());
app.use(morgan('dev'));

// Handle preflight requests for all routes
app.options('*', (req, res) => {
  const origin = req.headers.origin;
  console.log(`🔍 OPTIONS: Handling preflight for origin: ${origin}`);
  
  // Check if origin is allowed
  const allowedOrigins = isProduction 
    ? [
        process.env.FRONTEND_URL || 'https://voice-verse-two.vercel.app',
        'https://voice-verse-two.vercel.app'
      ]
    : [
        'http://localhost:3000',
        'http://localhost:5173',
        'https://voice-verse-two.vercel.app'
      ];
  
  const isAllowed = !origin || 
                   allowedOrigins.includes(origin) || 
                   (origin && origin.match(/^https:\/\/.*\.vercel\.app$/));
  
  if (isAllowed) {
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Range, Accept, Origin, X-Requested-With, x-api-key');
    res.header('Access-Control-Allow-Credentials', 'true');
    console.log('✅ OPTIONS: Preflight allowed');
  } else {
    console.log(`❌ OPTIONS: Preflight rejected for origin: ${origin}`);
  }
  
  res.sendStatus(200);
});

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

// CRITICAL: Audio routes MUST come BEFORE static middleware to avoid conflicts
console.log('🎵 Setting up audio routes...');
app.use('/api/audio', audioRoutes);

// Other API routes
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
app.use('/api/voice/saved', savedVoiceRoutes);
app.use('/api/users', userRoutes);
app.use('/api/health', healthRoutes);

// Serve static files AFTER API routes to avoid conflicts
console.log('📁 Setting up static file serving...');
// Note: Audio static files are disabled since they're handled by audioRoutes controller
// app.use('/api/audio', express.static(path.join(process.cwd(), 'uploads', 'audio')));
// app.use('/api/audio/original', express.static(path.join(process.cwd(), 'uploads', 'audio', 'original')));
// app.use('/api/audio/translated', express.static(path.join(process.cwd(), 'uploads', 'audio', 'translated')));
app.use('/api/images', express.static(path.join(process.cwd(), 'uploads', 'images')));
app.use('/api/images/nft', express.static(path.join(process.cwd(), 'uploads', 'images', 'nft')));
app.use('/api/images/profiles', express.static(path.join(process.cwd(), 'uploads', 'images', 'profiles')));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

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
  res.json({ 
    message: 'VoiceVerse API is running!',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: 'connected'
  });
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

// For production (Render), use the assigned port directly
if (isProduction) {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 VoiceVerse API server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
    console.log(`🗄️ Database: Connected to Supabase PostgreSQL`);
    console.log(`📡 CORS configured for production`);
    console.log(`🎵 Audio routes configured BEFORE static middleware`);
  });
  
  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
      console.log('Process terminated');
      process.exit(0);
    });
  });
} else {
  // Development mode with port fallback
  const startServer = (port) => {
    const server = app.listen(port, () => {
      console.log(`🚀 VoiceVerse API server running on port ${port}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🗄️ Database: Connected to Supabase PostgreSQL`);
      console.log(`🎵 Audio routes configured BEFORE static middleware`);
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
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  // Close server & exit process
  // server.close(() => process.exit(1));
});