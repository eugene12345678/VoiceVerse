const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator');

// ElevenLabs API configuration
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || 'sk_6af57f84281bf52dc471d7751253dd26647034b32025d667';

/**
 * Get all available voice effects
 * @route GET /api/voice/effects
 * @access Public
 */
exports.getVoiceEffects = async (req, res) => {
  try {
    const effects = await req.prisma.voiceEffect.findMany({
      orderBy: {
        popularity: 'desc'
      }
    });

    res.json({
      status: 'success',
      data: effects
    });
  } catch (error) {
    console.error('Error fetching voice effects:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch voice effects'
    });
  }
};

/**
 * Get all voice models for a user
 * @route GET /api/voice/models
 * @access Private
 */
exports.getUserVoiceModels = async (req, res) => {
  try {
    const models = await req.prisma.voiceModel.findMany({
      where: {
        OR: [
          { userId: req.user.id },
          { isPublic: true }
        ]
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      status: 'success',
      data: models
    });
  } catch (error) {
    console.error('Error fetching voice models:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch voice models'
    });
  }
};

/**
 * Get available ElevenLabs voices
 * @route GET /api/voice/elevenlabs/voices
 * @access Private
 */
exports.getElevenLabsVoices = async (req, res) => {
  try {
    const response = await axios.get(`${ELEVENLABS_API_URL}/voices`, {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY
      }
    });

    res.json({
      status: 'success',
      data: response.data.voices
    });
  } catch (error) {
    console.error('Error fetching ElevenLabs voices:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch ElevenLabs voices'
    });
  }
};

/**
 * Clone a voice using ElevenLabs
 * @route POST /api/voice/clone
 * @access Private
 */
exports.cloneVoice = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'error', errors: errors.array() });
  }

  const { name, description, audioFileId } = req.body;

  try {
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

    // Check if user owns the audio file
    if (audioFile.userId !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to use this audio file'
      });
    }

    // Read the audio file
    const audioFilePath = path.join(process.cwd(), audioFile.storagePath);
    const audioData = fs.readFileSync(audioFilePath);

    // Create a form data object for the ElevenLabs API
    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description || '');
    
    // Create a Blob from the audio data
    const audioBlob = new Blob([audioData], { type: audioFile.mimeType });
    formData.append('files', audioBlob, path.basename(audioFile.originalFilename));

    // Clone the voice using ElevenLabs API
    const response = await axios.post(
      `${ELEVENLABS_API_URL}/voices/add`,
      formData,
      {
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    // Save the voice model to the database
    const voiceModel = await req.prisma.voiceModel.create({
      data: {
        userId: req.user.id,
        name,
        description,
        elevenLabsVoiceId: response.data.voice_id,
        isCloned: true,
        originalAudioId: audioFileId,
        settings: JSON.stringify(response.data.settings || {})
      }
    });

    res.status(201).json({
      status: 'success',
      data: voiceModel
    });
  } catch (error) {
    console.error('Error cloning voice:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to clone voice'
    });
  }
};

/**
 * Transform audio using a voice effect
 * @route POST /api/voice/transform
 * @access Private
 */
exports.transformAudio = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'error', errors: errors.array() });
  }

  const { audioFileId, effectId, settings } = req.body;

  try {
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

    // Check if user owns the audio file
    if (audioFile.userId !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to use this audio file'
      });
    }

    // Get the voice effect
    const effect = await req.prisma.voiceEffect.findUnique({
      where: { effectId }
    });

    if (!effect) {
      return res.status(404).json({
        status: 'error',
        message: 'Voice effect not found'
      });
    }

    // Check if effect is pro-only and user is not pro
    if (effect.isProOnly && !req.user.isPro) {
      return res.status(403).json({
        status: 'error',
        message: 'This effect is only available to Pro users'
      });
    }

    // Create a transformation record
    const transformation = await req.prisma.voiceTransformation.create({
      data: {
        userId: req.user.id,
        sourceAudioId: audioFileId,
        effectId: effect.effectId,
        effectName: effect.name,
        effectCategory: effect.category,
        settings: JSON.stringify(settings || {}),
        status: 'processing',
        updatedAt: new Date()
      }
    });

    // Process the transformation asynchronously
    processTransformation(req.prisma, transformation.id, audioFile, effect, settings)
      .catch(err => console.error('Error processing transformation:', err));

    res.status(202).json({
      status: 'success',
      message: 'Audio transformation started',
      data: {
        transformationId: transformation.id
      }
    });
  } catch (error) {
    console.error('Error transforming audio:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to transform audio'
    });
  }
};

/**
 * Get transformation status
 * @route GET /api/voice/transform/:id
 * @access Private
 */
exports.getTransformationStatus = async (req, res) => {
  const { id } = req.params;

  try {
    const transformation = await req.prisma.voiceTransformation.findUnique({
      where: { id },
      include: {
        transformedAudio: true
      }
    });

    if (!transformation) {
      return res.status(404).json({
        status: 'error',
        message: 'Transformation not found'
      });
    }

    // Check if user owns the transformation
    if (transformation.userId !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to view this transformation'
      });
    }

    res.json({
      status: 'success',
      data: transformation
    });
  } catch (error) {
    console.error('Error fetching transformation status:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch transformation status'
    });
  }
};

/**
 * Get user's transformation history
 * @route GET /api/voice/history
 * @access Private
 */
exports.getTransformationHistory = async (req, res) => {
  try {
    const transformations = await req.prisma.voiceTransformation.findMany({
      where: {
        userId: req.user.id
      },
      include: {
        sourceAudio: true,
        transformedAudio: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      status: 'success',
      data: transformations
    });
  } catch (error) {
    console.error('Error fetching transformation history:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch transformation history'
    });
  }
};

/**
 * Process a voice transformation using ElevenLabs
 * @param {PrismaClient} prisma - Prisma client instance
 * @param {string} transformationId - ID of the transformation to process
 * @param {Object} audioFile - Source audio file
 * @param {Object} effect - Voice effect to apply
 * @param {Object} settings - Transformation settings
 */
async function processTransformation(prisma, transformationId, audioFile, effect, settings) {
  try {
    // Read the audio file
    const audioFilePath = path.join(process.cwd(), audioFile.storagePath);
    const audioData = fs.readFileSync(audioFilePath);

    // Get the ElevenLabs voice ID to use
    const voiceId = effect.elevenLabsVoiceId;
    if (!voiceId) {
      throw new Error('No ElevenLabs voice ID associated with this effect');
    }

    // Prepare the settings for ElevenLabs
    const voiceSettings = {
      stability: settings?.stability || 0.5,
      similarity_boost: settings?.similarity_boost || 0.75,
      style: settings?.style || 0,
      use_speaker_boost: settings?.use_speaker_boost || true
    };

    // Create a form data object for the ElevenLabs API
    const formData = new FormData();
    
    // Create a Blob from the audio data
    const audioBlob = new Blob([audioData], { type: audioFile.mimeType });
    formData.append('audio', audioBlob);
    formData.append('model_id', 'eleven_monolingual_v1');
    formData.append('voice_settings', JSON.stringify(voiceSettings));

    // Start time for processing duration calculation
    const startTime = Date.now();

    // Transform the audio using ElevenLabs API
    const response = await axios.post(
      `${ELEVENLABS_API_URL}/voices/${voiceId}/audio/stream`,
      formData,
      {
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'multipart/form-data'
        },
        responseType: 'arraybuffer'
      }
    );

    // Calculate processing time
    const processingTime = (Date.now() - startTime) / 1000;

    // Generate a unique filename for the transformed audio
    const filename = `transformed_${uuidv4()}.mp3`;
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

    // Update effect popularity
    await prisma.voiceEffect.update({
      where: { id: effect.id },
      data: {
        popularity: {
          increment: 1
        }
      }
    });
  } catch (error) {
    console.error('Error processing transformation:', error);

    // Update the transformation record with error
    await prisma.voiceTransformation.update({
      where: { id: transformationId },
      data: {
        status: 'failed',
        errorMessage: error.message || 'Unknown error occurred',
        updatedAt: new Date()
      }
    });
  }
}