const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const { getAudioDurationInSeconds } = require('get-audio-duration');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const mm = require('music-metadata');

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
        // Create audio file record in database
        const audioFile = await req.prisma.audioFile.create({
          data: {
            id: uuidv4(),
            userId: req.user.id,
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