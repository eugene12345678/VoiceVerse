const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator');

// ElevenLabs API configuration
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || 'sk_ac7bbd0a5be8876d7c0e4efe0a9655f9a66475a5f42d3466';

// Emotion voice mappings with ElevenLabs voice IDs and settings
const EMOTION_VOICES = {
  happy: {
    id: 'EXAVITQu4vr4xnSDxMaL', // Bella - cheerful female voice
    name: 'Happy Voice',
    description: 'Cheerful and upbeat voice that conveys joy and excitement',
    settings: {
      stability: 0.3,
      similarity_boost: 0.8,
      style: 0.7,
      use_speaker_boost: true
    }
  },
  sad: {
    id: 'TxGEqnHWrfWFTfGW9XjX', // Josh - can be modulated for sadness
    name: 'Sad Voice',
    description: 'Melancholic and somber voice that conveys sadness and emotion',
    settings: {
      stability: 0.7,
      similarity_boost: 0.6,
      style: 0.2,
      use_speaker_boost: false
    }
  },
  angry: {
    id: 'pNInz6obpgDQGcFmaJgB', // Adam - strong male voice for anger
    name: 'Angry Voice',
    description: 'Intense and forceful voice that conveys anger and frustration',
    settings: {
      stability: 0.4,
      similarity_boost: 0.9,
      style: 0.8,
      use_speaker_boost: true
    }
  },
  calm: {
    id: 'ZQe5CZNOzWyzPSCn5a3c', // James - calm and soothing
    name: 'Calm Voice',
    description: 'Peaceful and soothing voice that conveys tranquility and relaxation',
    settings: {
      stability: 0.8,
      similarity_boost: 0.5,
      style: 0.1,
      use_speaker_boost: false
    }
  },
  excited: {
    id: 'AZnzlk1XvdvUeBnXmlld', // Domi - energetic female voice
    name: 'Excited Voice',
    description: 'Energetic and enthusiastic voice that conveys excitement and passion',
    settings: {
      stability: 0.2,
      similarity_boost: 0.9,
      style: 0.9,
      use_speaker_boost: true
    }
  }
};

/**
 * Get all available emotion voices
 * @route GET /api/voice/emotion/voices
 * @access Public
 */
exports.getEmotionVoices = async (req, res) => {
  try {
    const emotionVoices = Object.entries(EMOTION_VOICES).map(([key, voice]) => ({
      id: key,
      effectId: key,
      name: voice.name,
      category: 'emotion',
      description: voice.description,
      popularity: getEmotionPopularity(key),
      isProOnly: false,
      elevenLabsVoiceId: voice.id,
      settings: voice.settings
    }));

    res.json({
      status: 'success',
      data: emotionVoices
    });
  } catch (error) {
    console.error('Error fetching emotion voices:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch emotion voices'
    });
  }
};

/**
 * Transform audio with emotion effect
 * @route POST /api/voice/emotion/transform
 * @access Private
 */
exports.transformWithEmotion = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'error', errors: errors.array() });
  }

  const { audioFileId, emotionId, customSettings } = req.body;

  try {
    // Validate emotion ID
    if (!EMOTION_VOICES[emotionId]) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid emotion ID'
      });
    }

    // Get the audio file
    const audioFile = await req.prisma.audioFile.findUnique({
      where: { id: audioFileId }
    });

    if (!audioFile) {
      return res.status(404).json({
        status: 'error',
        message: 'Audio file not found'
      });
    }

    // Check if we're using the development user
    const isDevelopmentUser = req.user.id === 'dev-user-id';
    
    // Check if user owns the audio file (skip this check in development mode)
    if (!isDevelopmentUser && audioFile.userId !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to use this audio file'
      });
    }

    // For development user, we need to find a real user ID from the database
    let userId = req.user.id;
    
    if (req.user.id === 'dev-user-id') {
      try {
        userId = audioFile.userId;
        console.log(`Using audio file owner's ID (${userId}) for development user`);
      } catch (error) {
        console.error('Error finding a valid user ID:', error);
        return res.status(500).json({
          status: 'error',
          message: 'Cannot create transformation in development mode: No valid user ID found'
        });
      }
    }

    // Get or create the emotion effect in the database
    let emotionEffect = await req.prisma.voiceEffect.findUnique({
      where: { effectId: emotionId }
    });

    if (!emotionEffect) {
      const emotionVoice = EMOTION_VOICES[emotionId];
      emotionEffect = await req.prisma.voiceEffect.create({
        data: {
          effectId: emotionId,
          name: emotionVoice.name,
          category: 'emotion',
          description: emotionVoice.description,
          popularity: getEmotionPopularity(emotionId),
          isProOnly: false,
          elevenLabsVoiceId: emotionVoice.id,
          settings: JSON.stringify(emotionVoice.settings)
        }
      });
    }

    // Create a transformation record
    const transformation = await req.prisma.voiceTransformation.create({
      data: {
        userId: userId,
        sourceAudioId: audioFileId,
        effectId: emotionId,
        effectName: emotionEffect.name,
        effectCategory: 'emotion',
        settings: JSON.stringify(customSettings || EMOTION_VOICES[emotionId].settings),
        status: 'processing',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Process the transformation asynchronously
    processEmotionTransformation(
      req.prisma, 
      transformation.id, 
      audioFile, 
      emotionId, 
      customSettings || EMOTION_VOICES[emotionId].settings
    ).catch(err => console.error('Error processing emotion transformation:', err));

    res.status(202).json({
      status: 'success',
      message: 'Emotion transformation started',
      data: {
        transformationId: transformation.id,
        emotion: emotionId,
        estimatedTime: '10-30 seconds'
      }
    });
  } catch (error) {
    console.error('Error starting emotion transformation:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to start emotion transformation'
    });
  }
};

/**
 * Get emotion transformation status
 * @route GET /api/voice/emotion/transform/:id
 * @access Private
 */
exports.getEmotionTransformationStatus = async (req, res) => {
  const { id } = req.params;

  try {
    const transformation = await req.prisma.voiceTransformation.findUnique({
      where: { id },
      include: {
        transformedAudio: true,
        sourceAudio: true
      }
    });

    if (!transformation) {
      return res.status(404).json({
        status: 'error',
        message: 'Transformation not found'
      });
    }

    // Check if we're using the development user
    const isDevelopmentUser = req.user.id === 'dev-user-id';
    
    // Check if user owns the transformation (skip this check in development mode)
    if (!isDevelopmentUser && transformation.userId !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to view this transformation'
      });
    }

    res.json({
      status: 'success',
      data: {
        ...transformation,
        audioUrl: transformation.transformedAudio ? 
          `/api/audio/transformed/${path.basename(transformation.transformedAudio.storagePath)}` : 
          null
      }
    });
  } catch (error) {
    console.error('Error fetching emotion transformation status:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch transformation status'
    });
  }
};

/**
 * Process emotion transformation using ElevenLabs
 * @param {PrismaClient} prisma - Prisma client instance
 * @param {string} transformationId - ID of the transformation to process
 * @param {Object} audioFile - Source audio file
 * @param {string} emotionId - Emotion ID (happy, sad, angry, calm, excited)
 * @param {Object} settings - Voice settings
 */
async function processEmotionTransformation(prisma, transformationId, audioFile, emotionId, settings) {
  console.log(`Processing emotion transformation: ${emotionId}`);
  
  try {
    // Get emotion voice configuration
    const emotionVoice = EMOTION_VOICES[emotionId];
    if (!emotionVoice) {
      throw new Error(`Unknown emotion: ${emotionId}`);
    }

    // Read the audio file
    const audioFilePath = path.join(process.cwd(), audioFile.storagePath);
    
    if (!fs.existsSync(audioFilePath)) {
      throw new Error(`Audio file not found: ${audioFilePath}`);
    }

    const audioData = fs.readFileSync(audioFilePath);

    // Prepare voice settings with emotion-specific adjustments
    const voiceSettings = {
      stability: settings.stability || emotionVoice.settings.stability,
      similarity_boost: settings.similarity_boost || emotionVoice.settings.similarity_boost,
      style: settings.style || emotionVoice.settings.style,
      use_speaker_boost: settings.use_speaker_boost !== undefined ? 
        settings.use_speaker_boost : emotionVoice.settings.use_speaker_boost
    };

    console.log(`Using voice ID: ${emotionVoice.id} with settings:`, voiceSettings);

    // Create form data for ElevenLabs Speech-to-Speech API
    const formData = new FormData();
    
    // Create a Blob from the audio data
    const audioBlob = new Blob([audioData], { type: audioFile.mimeType });
    formData.append('audio', audioBlob);
    formData.append('model_id', 'eleven_english_sts_v2');
    formData.append('voice_settings', JSON.stringify(voiceSettings));

    // Start time for processing duration calculation
    const startTime = Date.now();

    // Transform the audio using ElevenLabs Speech-to-Speech API
    const response = await axios.post(
      `${ELEVENLABS_API_URL}/speech-to-speech/${emotionVoice.id}`,
      formData,
      {
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'multipart/form-data'
        },
        responseType: 'arraybuffer',
        timeout: 60000 // 60 second timeout
      }
    );

    // Calculate processing time
    const processingTime = (Date.now() - startTime) / 1000;

    // Generate a unique filename for the transformed audio
    const filename = `emotion_${emotionId}_${uuidv4()}.mp3`;
    const storagePath = path.join('uploads', 'audio', 'transformed', filename);
    const fullPath = path.join(process.cwd(), storagePath);

    // Ensure the directory exists
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });

    // Write the transformed audio to disk
    fs.writeFileSync(fullPath, Buffer.from(response.data));

    // Create a new audio file record
    const transformedAudio = await prisma.audioFile.create({
      data: {
        id: uuidv4(),
        userId: audioFile.userId,
        originalFilename: filename,
        storagePath,
        fileSize: response.data.length,
        duration: audioFile.duration, // Assuming same duration as source
        mimeType: 'audio/mpeg',
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Update the transformation record
    await prisma.voiceTransformation.update({
      where: { id: transformationId },
      data: {
        transformedAudioId: transformedAudio.id,
        processingTime,
        status: 'completed',
        updatedAt: new Date()
      }
    });

    // Update emotion effect popularity
    await prisma.voiceEffect.update({
      where: { effectId: emotionId },
      data: {
        popularity: {
          increment: 1
        }
      }
    });

    console.log(`Emotion transformation completed: ${emotionId} -> ${filename}`);
  } catch (error) {
    console.error(`Error processing emotion transformation (${emotionId}):`, error);

    // Update the transformation record with error
    await prisma.voiceTransformation.update({
      where: { id: transformationId },
      data: {
        status: 'failed',
        errorMessage: (error.message || 'Unknown error occurred').substring(0, 255),
        updatedAt: new Date()
      }
    });
  }
}

/**
 * Get popularity score for an emotion
 * @param {string} emotionId - Emotion ID
 * @returns {number} Popularity score
 */
function getEmotionPopularity(emotionId) {
  const popularityMap = {
    happy: 85,
    excited: 83,
    calm: 82,
    angry: 80,
    sad: 78
  };
  
  return popularityMap[emotionId] || 75;
}

/**
 * Validate emotion settings
 * @param {Object} settings - Voice settings to validate
 * @returns {Object} Validated settings
 */
function validateEmotionSettings(settings) {
  return {
    stability: Math.max(0, Math.min(1, settings.stability || 0.5)),
    similarity_boost: Math.max(0, Math.min(1, settings.similarity_boost || 0.75)),
    style: Math.max(0, Math.min(1, settings.style || 0.5)),
    use_speaker_boost: Boolean(settings.use_speaker_boost)
  };
}

module.exports = {
  getEmotionVoices: exports.getEmotionVoices,
  transformWithEmotion: exports.transformWithEmotion,
  getEmotionTransformationStatus: exports.getEmotionTransformationStatus,
  EMOTION_VOICES,
  validateEmotionSettings
};