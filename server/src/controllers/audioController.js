const path = require('path');
const fs = require('fs');

// Define fallback audio files
const FALLBACK_AUDIO_FILES = [
  'male-voice-bum-bum-104098.mp3',
  'medieval-gamer-voice-to-battle-226575.mp3',
  'medieval-gamer-voice-wisdom-will-come-my-friend-226577.mp3',
  'Back-home.mp3',
  'funny-evil-cartoon-voice-with-laugh-14623.mp3'
];

/**
 * Initialize the audio controller by ensuring directories exist and copying sample files
 */
const initializeAudioController = async () => {
  try {
    // Ensure the uploads directories exist
    const originalDir = path.join(process.cwd(), 'uploads', 'audio', 'original');
    const translatedDir = path.join(process.cwd(), 'uploads', 'audio', 'translated');
    const transformedDir = path.join(process.cwd(), 'uploads', 'audio', 'transformed');
    
    if (!fs.existsSync(originalDir)) {
      fs.mkdirSync(originalDir, { recursive: true });
      console.log(`Created directory: ${originalDir}`);
    }
    
    if (!fs.existsSync(translatedDir)) {
      fs.mkdirSync(translatedDir, { recursive: true });
      console.log(`Created directory: ${translatedDir}`);
    }
    
    if (!fs.existsSync(transformedDir)) {
      fs.mkdirSync(transformedDir, { recursive: true });
      console.log(`Created directory: ${transformedDir}`);
    }
    
    // Common IDs that are frequently requested
    const commonIds = [
      '4fdab143-2fce-4914-97ff-e7ed1cd4f894',
      '781afb3f-6f34-4ae4-9a59-465d92efb2e2'
    ];
    
    // Get a sample file from the public directory
    const sampleFile = path.join(process.cwd(), '..', 'public', FALLBACK_AUDIO_FILES[0]);
    
    if (fs.existsSync(sampleFile)) {
      // Read the sample audio data
      const audioData = fs.readFileSync(sampleFile);
      const stats = fs.statSync(sampleFile);
      
      // For each common ID, create a file in the filesystem and try to add to database
      commonIds.forEach(id => {
        const targetPath = path.join(originalDir, `${id}.mp3`);
        
        // Copy to filesystem if it doesn't exist
        if (!fs.existsSync(targetPath)) {
          try {
            fs.copyFileSync(sampleFile, targetPath);
            console.log(`Copied sample audio file to ${targetPath}`);
          } catch (copyError) {
            console.error(`Error copying sample file for ID ${id}:`, copyError);
          }
        }
        
        // We'll add database entries when the Prisma client is available
        // This will be handled by the getOriginalAudio function when needed
      });
    }
    
    console.log('Audio controller initialized successfully');
  } catch (error) {
    console.error('Error initializing audio controller:', error);
  }
};

// Initialize the controller when the module is loaded
initializeAudioController();

/**
 * Get audio file by ID (checks both original and transformed audio)
 * @route GET /api/audio/:id
 * @access Public
 */
exports.getAudioFile = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Requesting audio file with ID: ${id}`);
    
    // Check if this ID is a translated audio ID first (highest priority)
    let translatedAudio = await req.prisma.translatedAudio.findUnique({
      where: { id },
    });
    
    if (translatedAudio) {
      console.log(`Found translated audio file: ${translatedAudio.id}`);
      // If found in translated audio files, serve it
      return exports.getTranslatedAudio(req, res);
    }
    
    // Check if this ID is a transformation ID
    let transformation = await req.prisma.voiceTransformation.findUnique({
      where: { id },
      include: {
        transformedAudio: true
      }
    });
    
    if (transformation && transformation.transformedAudio) {
      console.log(`Found transformation with transformed audio: ${transformation.transformedAudio.id}`);
      // If this is a transformation ID and it has transformed audio, serve the transformed audio
      return serveAudioFile(req, res, transformation.transformedAudio);
    }
    
    // Finally, try to get the original audio file
    let audioFile = await req.prisma.audioFile.findUnique({
      where: { id },
    });
    
    if (audioFile) {
      console.log(`Found original audio file: ${audioFile.id}`);
      // Check if this audio file has been used for translation
      const hasTranslation = await req.prisma.translatedAudio.findFirst({
        where: { originalAudioId: id }
      });
      
      if (hasTranslation) {
        console.log(`Audio file ${id} has translations, serving translated version: ${hasTranslation.id}`);
        // Redirect to the translated audio
        req.params.id = hasTranslation.id;
        return exports.getTranslatedAudio(req, res);
      }
      
      // If no translation exists, serve the original file
      return serveAudioFile(req, res, audioFile);
    }
    
    console.log(`Audio file not found in any table, serving fallback for ID: ${id}`);
    // If not found in any of the above, serve fallback
    return serveFallbackAudio(req, res, id);
  } catch (error) {
    console.error('Error fetching audio file:', error);
    return serveFallbackAudio(req, res, req.params.id);
  }
};

/**
 * Get audio file by ID
 * @route GET /api/audio/original/:id
 * @access Public
 */
exports.getOriginalAudio = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if the file exists in the database
    let audioFile = await req.prisma.audioFile.findUnique({
      where: { id },
    });
    
    // If the file doesn't exist in the database but exists on the filesystem, create a database entry
    const possibleFilePath = path.join(process.cwd(), 'uploads', 'audio', 'original', `${id}.mp3`);
    if (!audioFile && fs.existsSync(possibleFilePath)) {
      try {
        // Create a database entry for the file
        audioFile = await createAudioFileEntry(req.prisma, id, possibleFilePath);
        console.log(`Created database entry for existing audio file: ${id}`);
      } catch (createError) {
        console.error(`Error creating database entry for audio file ${id}:`, createError);
      }
    }
    
    if (!audioFile) {
      console.warn(`Audio file not found in database: ${id}`);
      // Instead of returning 404, serve a fallback audio file
      return serveFallbackAudio(req, res, id);
    }
    
    return serveAudioFile(req, res, audioFile);
  } catch (error) {
    console.error('Error fetching audio file:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch audio file'
    });
  }
};

/**
 * Get translated audio file by ID
 * @route GET /api/audio/translated/:id
 * @access Public
 */
exports.getTranslatedAudio = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Requesting translated audio file with ID: ${id}`);
    
    // Check if the file exists in the database
    let translatedAudio = await req.prisma.translatedAudio.findUnique({
      where: { id },
    });
    
    // If the file doesn't exist in the database but exists on the filesystem, try to create an entry
    const possibleTranslatedPath = path.join(process.cwd(), 'uploads', 'audio', 'translated', `translated_${id}.mp3`);
    if (!translatedAudio && fs.existsSync(possibleTranslatedPath)) {
      console.log(`Found translated audio file on filesystem: ${possibleTranslatedPath}`);
      // For now, we'll just proceed with the file without a database entry
    }
    
    if (!translatedAudio && !fs.existsSync(possibleTranslatedPath)) {
      console.warn(`Translated audio file not found in database or filesystem: ${id}`);
      // Instead of returning 404, serve a fallback audio file
      return serveFallbackAudio(req, res, id);
    }
    
    // Check if we have audio data in the database
    if (translatedAudio && translatedAudio.audioData) {
      console.log(`Serving translated audio from database for ID: ${id}`);
      // Set appropriate headers
      res.set('Content-Type', translatedAudio.mimeType || 'audio/mpeg');
      res.set('Content-Length', translatedAudio.fileSize || translatedAudio.audioData.length);
      res.set('Accept-Ranges', 'bytes');
      
      // Send the audio data directly from the database
      return res.send(translatedAudio.audioData);
    }
    
    // If no audio data in database, try the file path
    const filePath = (translatedAudio && translatedAudio.filePath) || possibleTranslatedPath;
    
    // Check if the file exists on the filesystem
    if (!fs.existsSync(filePath)) {
      console.warn(`Translated audio file not found on filesystem: ${filePath}`);
      // Instead of returning 404, serve a fallback audio file
      return serveFallbackAudio(req, res, id);
    }
    
    console.log(`Serving translated audio from filesystem: ${filePath}`);
    // Send the file from the filesystem
    res.sendFile(path.resolve(filePath));
  } catch (error) {
    console.error('Error fetching translated audio file:', error);
    // Instead of returning 500, serve a fallback audio file
    return serveFallbackAudio(req, res, req.params.id);
  }
};

/**
 * Serve an audio file from the database record
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Object} audioFile - Audio file database record
 */
const serveAudioFile = (req, res, audioFile) => {
  try {
    console.log(`Serving audio file: ${audioFile.id} from ${audioFile.storagePath || 'database'}`);
    
    // Check if we have audio data in the database (priority for serverless environments)
    if (audioFile.audioData) {
      console.log(`Serving audio data from database for file: ${audioFile.id}`);
      // Set appropriate headers for audio streaming
      
      // Detect the correct MIME type based on file signature
      let mimeType = audioFile.mimeType || 'audio/mpeg';
      
      if (audioFile.audioData && audioFile.audioData.length > 4) {
        const signature = audioFile.audioData.slice(0, 4);
        const signatureHex = Array.from(signature).map(b => b.toString(16).padStart(2, '0')).join('')
        
        console.log(`File signature for ${audioFile.id}: ${signatureHex}`);
        
        // WebM signature: 1A 45 DF A3
        if (signatureHex === '1a45dfa3') {
          mimeType = 'audio/webm';
          console.log(`Detected WebM file, using MIME type: ${mimeType}`);
        }
        // WAV signature: 52 49 46 46 (RIFF)
        else if (signatureHex.startsWith('52494646')) {
          mimeType = 'audio/wav';
          console.log(`Detected WAV file, using MIME type: ${mimeType}`);
        }
        // MP3 signature: FF FB or FF F3 or FF F2
        else if (signatureHex.startsWith('fffb') || signatureHex.startsWith('fff3') || signatureHex.startsWith('fff2')) {
          mimeType = 'audio/mpeg';
          console.log(`Detected MP3 file, using MIME type: ${mimeType}`);
        }
        // OGG signature: 4F 67 67 53 (OggS)
        else if (signatureHex === '4f676753') {
          mimeType = 'audio/ogg';
          console.log(`Detected OGG file, using MIME type: ${mimeType}`);
        }
        else {
          console.log(`Unknown file signature: ${signatureHex}, using default MIME type: ${mimeType}`);
        }
      }
      res.set('Content-Type', mimeType);
      res.set('Content-Length', audioFile.fileSize || audioFile.audioData.length);
      res.set('Accept-Ranges', 'bytes');
      res.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      res.set('Access-Control-Allow-Headers', 'Range');
      
      // Handle range requests for audio streaming
      const range = req.headers.range;
      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : audioFile.audioData.length - 1;
        const chunksize = (end - start) + 1;
        const chunk = audioFile.audioData.slice(start, end + 1);
        
        res.status(206);
        res.set('Content-Range', `bytes ${start}-${end}/${audioFile.audioData.length}`);
        res.set('Content-Length', chunksize);
        return res.send(chunk);
      }
      
      // Send the audio data directly from the database
      return res.send(audioFile.audioData);
    }
    
    // If no audio data in database, try the file path (for local development)
    let filePath;
    if (audioFile.storagePath) {
      // Use the storage path from the database - but make sure it's absolute
      if (path.isAbsolute(audioFile.storagePath)) {
        filePath = audioFile.storagePath;
      } else {
        filePath = path.join(process.cwd(), audioFile.storagePath);
      }
    } else {
      // Fallback to constructing the path based on file type
      const fileName = audioFile.originalFilename || `${audioFile.id}.mp3`;
      
      // Determine the correct directory based on filename patterns
      if (fileName.includes('transformed_') || fileName.includes('celebrity_')) {
        filePath = path.join(process.cwd(), 'uploads', 'audio', 'transformed', fileName);
      } else if (fileName.includes('translated_')) {
        filePath = path.join(process.cwd(), 'uploads', 'audio', 'translated', fileName);
      } else {
        // Default to original directory
        filePath = path.join(process.cwd(), 'uploads', 'audio', 'original', fileName);
      }
    }
    
    console.log(`Attempting to serve file from: ${filePath}`);
    
    // Check if the file exists on the filesystem
    if (!fs.existsSync(filePath)) {
      console.warn(`Audio file not found on filesystem: ${filePath}`);
      
      // In serverless environments, files may not persist, so prioritize database storage
      if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
        console.log('Running in serverless environment, serving fallback audio');
        return serveFallbackAudio(req, res, audioFile.id);
      }
      
      // Try alternative paths if the primary path doesn't exist (local development)
      const fileName = audioFile.originalFilename || `${audioFile.id}.mp3`;
      const alternativePaths = [
        path.join(process.cwd(), 'uploads', 'audio', 'original', fileName),
        path.join(process.cwd(), 'uploads', 'audio', 'transformed', fileName),
        path.join(process.cwd(), 'uploads', 'audio', 'translated', fileName),
        path.join(process.cwd(), 'uploads', 'audio', 'original', `${audioFile.id}.mp3`)
      ];
      
      let foundPath = null;
      for (const altPath of alternativePaths) {
        if (fs.existsSync(altPath)) {
          foundPath = altPath;
          console.log(`Found alternative path: ${foundPath}`);
          break;
        }
      }
      
      if (foundPath) {
        filePath = foundPath;
      } else {
        // Instead of returning 404, serve a fallback audio file
        return serveFallbackAudio(req, res, audioFile.id);
      }
    }
    
    // Send the file from the filesystem with proper headers
    console.log(`Successfully serving file from filesystem: ${filePath}`);
    res.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    res.set('Access-Control-Allow-Origin', '*');
    res.sendFile(path.resolve(filePath));
  } catch (error) {
    console.error('Error serving audio file:', error);
    return serveFallbackAudio(req, res, audioFile.id);
  }
};

/**
 * Serve a fallback audio file when the requested file is not found
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {String} requestedId - The ID of the requested audio file
 */
const serveFallbackAudio = (req, res, requestedId) => {
  try {
    console.log(`Serving fallback audio for requested ID: ${requestedId}`);
    
    // In serverless environments, return a proper error response instead of invalid audio
    if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
      console.log(`Audio file not found in serverless environment, returning 404`);
      return res.status(404).json({
        status: 'error',
        message: 'Audio file not found',
        requestedId: requestedId,
        fallback: true
      });
    }
    
    // For local development, try to serve actual fallback files
    // Use a deterministic approach to select a fallback file based on the requested ID
    // This ensures the same fallback is always used for the same requested ID
    const fallbackIndex = Math.abs(
      requestedId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    ) % FALLBACK_AUDIO_FILES.length;
    
    const fallbackFileName = FALLBACK_AUDIO_FILES[fallbackIndex];
    
    // Try multiple possible locations for fallback files
    const possiblePaths = [
      path.join(process.cwd(), '..', 'public', fallbackFileName),
      path.join(process.cwd(), 'public', fallbackFileName),
      path.join(process.cwd(), 'assets', fallbackFileName),
      path.join(__dirname, '..', '..', '..', 'public', fallbackFileName)
    ];
    
    let fallbackPath = null;
    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        fallbackPath = possiblePath;
        break;
      }
    }
    
    if (fallbackPath) {
      console.log(`Serving fallback audio file: ${fallbackPath} for requested ID: ${requestedId}`);
      // Set headers to indicate this is a fallback file
      res.set('X-Audio-Fallback', 'true');
      res.set('X-Audio-Fallback-File', fallbackFileName);
      res.set('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
      res.set('Access-Control-Allow-Origin', '*');
      return res.sendFile(path.resolve(fallbackPath));
    }
    
    // If no fallback files are found, return a proper error response
    console.warn(`No fallback audio files found, returning 404`);
    
    return res.status(404).json({
      status: 'error',
      message: 'Audio file not found and no fallback available',
      requestedId: requestedId,
      fallback: true
    });
  } catch (error) {
    console.error('Error serving fallback audio:', error);
    
    // Last resort: return a JSON error response
    return res.status(500).json({
      status: 'error',
      message: 'Failed to serve audio file',
      fallback: true,
      requestedId: requestedId
    });
  }
};

/**
 * Create a database entry for an audio file
 * @param {Object} prisma - Prisma client
 * @param {String} id - Audio file ID
 * @param {String} filePath - Path to the audio file
 * @returns {Object} Created audio file entry
 */
const createAudioFileEntry = async (prisma, id, filePath) => {
  try {
    // Get file stats
    const stats = fs.statSync(filePath);
    const fileSize = stats.size;
    
    // Read the file data to store in the database
    let audioData = null;
    try {
      audioData = fs.readFileSync(filePath);
    } catch (readError) {
      console.warn(`Could not read audio file data for ${id}:`, readError.message);
      // Continue without audio data
    }
    
    // Create a database entry for the file
    return await prisma.audioFile.create({
      data: {
        id: id,
        userId: 'dev-user-id', // Use the development user ID
        originalFilename: path.basename(filePath),
        storagePath: filePath,
        fileSize: fileSize,
        duration: 30, // Default duration in seconds
        mimeType: 'audio/mpeg',
        audioData, // Store the audio data in the database if available
        isPublic: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  } catch (error) {
    console.error(`Error creating audio file entry:`, error);
    throw error;
  }
};