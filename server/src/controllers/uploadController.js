const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const { getAudioDurationInSeconds } = require('get-audio-duration');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const mm = require('music-metadata');
const sharp = require('sharp');

// Check if ffprobe is available
const checkFFprobe = async () => {
  try {
    await execPromise('ffprobe -version');
    return true;
  } catch (error) {
    console.warn('FFprobe not found. Audio duration detection will be limited.');
    return false;
  }
};

// Alternative method to get audio file info when ffprobe is not available
const getAudioInfoFallback = async (filePath) => {
  try {
    // Try to use music-metadata to get audio duration
    const metadata = await mm.parseFile(filePath);
    if (metadata && metadata.format && metadata.format.duration) {
      return { duration: metadata.format.duration };
    }
  } catch (error) {
    console.warn('Failed to get audio duration with music-metadata:', error.message);
  }
  
  // If all else fails, return a default duration
  return { duration: 0 };
};

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'audio', 'original');
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueFilename = `${Date.now()}_${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

// File filter to accept only audio files
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'audio/webm'
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only audio files are allowed.'), false);
  }
};

// Configure multer upload
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max file size
  }
});

// Configure image storage for NFT cover images
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'images', 'nft');
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueFilename = `${Date.now()}_${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

// File filter to accept only image files
const imageFileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'), false);
  }
};

// Configure multer upload for images
const uploadImage = multer({
  storage: imageStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max file size
  }
});

/**
 * Upload audio file
 * @route POST /api/upload/audio
 * @access Private
 */
exports.uploadAudio = [
  upload.single('audio'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          status: 'error',
          message: 'No audio file uploaded'
        });
      }

      // Get file details
      const { filename, originalname, path: filePath, size, mimetype } = req.file;
      
      // Verify the file exists and is readable
      if (!fs.existsSync(filePath)) {
        return res.status(500).json({
          status: 'error',
          message: 'Uploaded file not found on server'
        });
      }
      
      // Get audio duration with robust error handling
      let duration = 0;
      let durationSource = 'default';
      
      try {
        // First try FFprobe if available
        const ffprobeAvailable = await checkFFprobe();
        
        if (ffprobeAvailable) {
          try {
            duration = await getAudioDurationInSeconds(filePath);
            durationSource = 'ffprobe';
          } catch (error) {
            console.warn('Could not determine audio duration with FFprobe:', error.message);
            // Fall back to alternative method
            const audioInfo = await getAudioInfoFallback(filePath);
            duration = audioInfo.duration;
            durationSource = 'music-metadata';
          }
        } else {
          // Use fallback method directly if FFprobe is not available
          const audioInfo = await getAudioInfoFallback(filePath);
          duration = audioInfo.duration;
          durationSource = 'music-metadata';
        }
      } catch (error) {
        console.warn('All duration detection methods failed:', error.message);
        // Continue with default duration (0)
      }
      
      console.log(`Audio duration determined (${durationSource}): ${duration} seconds`);
      
      // Create relative storage path
      const storagePath = path.relative(process.cwd(), filePath);
      
      try {
        // Check if we're using the development user
        const isDevelopmentUser = req.user.id === 'dev-user-id';
        
        // If in development mode with a mock user, try to find a real user to use
        let userId = req.user.id;
        
        if (isDevelopmentUser) {
          // Try to find any user in the database to use for development
          const anyUser = await req.prisma.user.findFirst({
            select: { id: true }
          });
          
          if (anyUser) {
            userId = anyUser.id;
            console.log(`Using existing user ID for development: ${userId}`);
          } else {
            // If no user exists, create a development user
            try {
              const devUser = await req.prisma.user.create({
                data: {
                  username: 'devuser',
                  email: 'dev@example.com',
                  password: 'hashedpassword', // In a real app, this would be properly hashed
                  displayName: 'Development User',
                  createdAt: new Date(),
                  updatedAt: new Date()
                }
              });
              userId = devUser.id;
              console.log(`Created development user with ID: ${userId}`);
            } catch (userCreateError) {
              console.error('Failed to create development user:', userCreateError);
              // Continue with the original ID, which might fail
            }
          }
        }
        
        // Create audio file record in database
        const audioFile = await req.prisma.audioFile.create({
          data: {
            id: uuidv4(),
            userId: userId,
            originalFilename: originalname,
            storagePath,
            fileSize: size,
            duration,
            mimeType: mimetype,
            isPublic: false,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        
        res.status(201).json({
          status: 'success',
          data: audioFile
        });
      } catch (dbError) {
        console.error('Database error when saving audio file:', dbError);
        res.status(500).json({
          status: 'error',
          message: 'Failed to save audio file information to database'
        });
      }
    } catch (error) {
      console.error('Error uploading audio:', error);
      
      // Clean up the uploaded file if it exists and there was an error
      if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        try {
          fs.unlinkSync(req.file.path);
          console.log(`Cleaned up file: ${req.file.path}`);
        } catch (cleanupError) {
          console.error('Error cleaning up file:', cleanupError);
        }
      }
      
      res.status(500).json({
        status: 'error',
        message: 'Failed to process audio file'
      });
    }
  }
];

/**
 * Upload file for NFT creation (audio or image)
 * @route POST /api/upload
 * @access Private
 */
exports.uploadNFTFile = (req, res, next) => {
  try {
    // Create a middleware to handle the file upload first
    const handleUpload = (req, res, next) => {
      // We'll determine the file type from the form data after it's parsed
      const uploadMiddleware = multer({
        storage: multer.diskStorage({
          destination: (req, file, cb) => {
            // Determine destination based on content type
            let uploadDir;
            if (file.mimetype.startsWith('audio/')) {
              uploadDir = path.join(process.cwd(), 'uploads', 'audio', 'original');
            } else if (file.mimetype.startsWith('image/')) {
              uploadDir = path.join(process.cwd(), 'uploads', 'images', 'nft');
            } else {
              return cb(new Error('Invalid file type'), null);
            }
            
            fs.mkdirSync(uploadDir, { recursive: true });
            cb(null, uploadDir);
          },
          filename: (req, file, cb) => {
            const uniqueFilename = `${Date.now()}_${uuidv4()}${path.extname(file.originalname)}`;
            cb(null, uniqueFilename);
          }
        }),
        fileFilter: (req, file, cb) => {
          // Accept both audio and image files
          const allowedAudioTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm'];
          const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
          
          if (allowedAudioTypes.includes(file.mimetype) || allowedImageTypes.includes(file.mimetype)) {
            cb(null, true);
          } else {
            cb(new Error('Invalid file type. Only audio (MP3, WAV) and image (JPEG, PNG, WebP) files are allowed.'), false);
          }
        },
        limits: {
          fileSize: 50 * 1024 * 1024 // 50MB max file size
        }
      }).single('file');
      
      // Execute the upload middleware
      uploadMiddleware(req, res, (err) => {
        if (err) {
          console.error('Multer error:', err);
          return res.status(400).json({
            status: 'error',
            message: err.message
          });
        }
        
        // Continue to the next middleware
        next();
      });
    };
    
    // Apply the upload middleware
    handleUpload(req, res, async () => {
      // Now we can access req.file and req.body
      if (!req.file) {
        return res.status(400).json({
          status: 'error',
          message: 'No file uploaded'
        });
      }
      
      // Get the file type from the request body
      const fileType = req.body.type;
      
      if (!fileType || !['audio', 'image'].includes(fileType)) {
        // Clean up the uploaded file
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
          try {
            fs.unlinkSync(req.file.path);
          } catch (cleanupError) {
            console.error('Error cleaning up file:', cleanupError);
          }
        }
        
        return res.status(400).json({
          status: 'error',
          message: 'Invalid file type. Must be "audio" or "image".'
        });
      }
      
      // Process the file based on its type
      if (fileType === 'audio') {
        if (!req.file.mimetype.startsWith('audio/')) {
          // Clean up the uploaded file
          if (req.file && req.file.path && fs.existsSync(req.file.path)) {
            try {
              fs.unlinkSync(req.file.path);
            } catch (cleanupError) {
              console.error('Error cleaning up file:', cleanupError);
            }
          }
          
          return res.status(400).json({
            status: 'error',
            message: 'File type mismatch. Expected audio file but received another type.'
          });
        }
        
        await processAudioFile(req, res);
      } else if (fileType === 'image') {
        if (!req.file.mimetype.startsWith('image/')) {
          // Clean up the uploaded file
          if (req.file && req.file.path && fs.existsSync(req.file.path)) {
            try {
              fs.unlinkSync(req.file.path);
            } catch (cleanupError) {
              console.error('Error cleaning up file:', cleanupError);
            }
          }
          
          return res.status(400).json({
            status: 'error',
            message: 'File type mismatch. Expected image file but received another type.'
          });
        }
        
        await processImageFile(req, res);
      }
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to process file upload'
    });
  }
};

/**
 * Process uploaded audio file for NFT
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const processAudioFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No audio file uploaded'
      });
    }

    // Get file details
    const { filename, originalname, path: filePath, size, mimetype } = req.file;
    
    // Verify the file exists and is readable
    if (!fs.existsSync(filePath)) {
      return res.status(500).json({
        status: 'error',
        message: 'Uploaded file not found on server'
      });
    }
    
    // Get audio duration
    let duration = 0;
    try {
      const ffprobeAvailable = await checkFFprobe();
      
      if (ffprobeAvailable) {
        duration = await getAudioDurationInSeconds(filePath);
      } else {
        const audioInfo = await getAudioInfoFallback(filePath);
        duration = audioInfo.duration;
      }
    } catch (error) {
      console.warn('Failed to determine audio duration:', error.message);
    }
    
    // Create relative storage path
    const storagePath = path.relative(process.cwd(), filePath);
    
    // Check if we're using the development user
    const isDevelopmentUser = req.user.id === 'dev-user-id';
    
    // If in development mode with a mock user, try to find a real user to use
    let userId = req.user.id;
    
    if (isDevelopmentUser) {
      // Try to find any user in the database to use for development
      const anyUser = await req.prisma.user.findFirst({
        select: { id: true }
      });
      
      if (anyUser) {
        userId = anyUser.id;
        console.log(`Using existing user ID for development: ${userId}`);
      } else {
        // If no user exists, create a development user
        try {
          const devUser = await req.prisma.user.create({
            data: {
              username: 'devuser',
              email: 'dev@example.com',
              password: 'hashedpassword', // In a real app, this would be properly hashed
              displayName: 'Development User',
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });
          userId = devUser.id;
          console.log(`Created development user with ID: ${userId}`);
        } catch (userCreateError) {
          console.error('Failed to create development user:', userCreateError);
          // Continue with the original ID, which might fail
        }
      }
    }
    
    // Create audio file record in database
    const audioFile = await req.prisma.audioFile.create({
      data: {
        id: uuidv4(),
        userId: userId,
        originalFilename: originalname,
        storagePath,
        fileSize: size,
        duration,
        mimeType: mimetype,
        isPublic: true, // NFT audio files are public
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    // Return the file ID and URL for NFT creation
    res.status(201).json({
      status: 'success',
      fileId: audioFile.id,
      fileUrl: `/api/audio/${audioFile.id}`,
      duration: audioFile.duration,
      message: 'Audio file uploaded successfully'
    });
  } catch (error) {
    console.error('Error processing audio file:', error);
    
    // Clean up the uploaded file if it exists and there was an error
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
      }
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to process audio file'
    });
  }
};

/**
 * Process uploaded image file for NFT
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const processImageFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No image file uploaded'
      });
    }

    // Get file details
    const { filename, originalname, path: filePath, size, mimetype } = req.file;
    
    // Verify the file exists and is readable
    if (!fs.existsSync(filePath)) {
      return res.status(500).json({
        status: 'error',
        message: 'Uploaded file not found on server'
      });
    }
    
    // Process the image (resize, optimize)
    const optimizedImagePath = filePath.replace(/\.\w+$/, '_optimized.jpg');
    
    try {
      await sharp(filePath)
        .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toFile(optimizedImagePath);
      
      // Use the optimized image path for storage
      const storagePath = path.relative(process.cwd(), optimizedImagePath);
      
      // Return the file URL for NFT creation
      res.status(201).json({
        status: 'success',
        fileUrl: `/api/images/nft/${path.basename(optimizedImagePath)}`,
        message: 'Image file uploaded and processed successfully'
      });
    } catch (imageError) {
      console.error('Error processing image:', imageError);
      
      // If image processing fails, use the original file
      const storagePath = path.relative(process.cwd(), filePath);
      
      res.status(201).json({
        status: 'success',
        fileUrl: `/api/images/nft/${path.basename(filePath)}`,
        message: 'Image file uploaded successfully (without optimization)'
      });
    }
  } catch (error) {
    console.error('Error processing image file:', error);
    
    // Clean up the uploaded file if it exists and there was an error
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
      }
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to process image file'
    });
  }
};