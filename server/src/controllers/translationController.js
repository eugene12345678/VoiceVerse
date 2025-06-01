const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator');

// Lingo API configuration
const LINGO_API_URL = 'https://api.lingoapi.dev/v1';
const LINGO_API_KEY = process.env.LINGO_API_KEY || 'api_caqw6dgkiuaek7exmi3c0zi66';

// ElevenLabs API configuration for voice synthesis
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || 'sk_6af57f84281bf52dc471d7751253dd26647034b32025d667';

/**
 * Get supported languages
 * @route GET /api/translation/languages
 * @access Public
 */
exports.getSupportedLanguages = async (req, res) => {
  try {
    // For now, return a static list of languages to avoid API issues
    // This can be replaced with the actual API call when the API is working
    const languages = [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'es', name: 'Spanish', nativeName: 'Español' },
      { code: 'fr', name: 'French', nativeName: 'Français' },
      { code: 'de', name: 'German', nativeName: 'Deutsch' },
      { code: 'it', name: 'Italian', nativeName: 'Italiano' },
      { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
      { code: 'ru', name: 'Russian', nativeName: 'Русский' },
      { code: 'zh', name: 'Chinese', nativeName: '中文' },
      { code: 'ja', name: 'Japanese', nativeName: '日本語' },
      { code: 'ko', name: 'Korean', nativeName: '한국어' },
      { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
      { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' }
    ];

    res.json({
      status: 'success',
      data: { languages }
    });

    /* Commented out the API call for now
    const response = await axios.get(`${LINGO_API_URL}/languages`, {
      headers: {
        'Authorization': `Bearer ${LINGO_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    res.json({
      status: 'success',
      data: response.data
    });
    */
  } catch (error) {
    console.error('Error fetching supported languages:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch supported languages'
    });
  }
};

/**
 * Translate text
 * @route POST /api/translation/text
 * @access Private
 */
exports.translateText = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'error', errors: errors.array() });
  }

  const { text, sourceLanguage, targetLanguage } = req.body;

  try {
    const response = await axios.post(
      `${LINGO_API_URL}/translate`,
      {
        text,
        source_lang: sourceLanguage,
        target_lang: targetLanguage
      },
      {
        headers: {
          'Authorization': `Bearer ${LINGO_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Save translation to database
    const translation = await req.prisma.translation.create({
      data: {
        userId: req.user.id,
        sourceLanguage,
        targetLanguage,
        sourceText: text,
        translatedText: response.data.translated_text,
        createdAt: new Date()
      }
    });

    res.json({
      status: 'success',
      data: {
        translation: response.data.translated_text,
        translationId: translation.id
      }
    });
  } catch (error) {
    console.error('Error translating text:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to translate text'
    });
  }
};

/**
 * Translate audio
 * @route POST /api/translation/audio
 * @access Private
 */
exports.translateAudio = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'error', errors: errors.array() });
  }

  const { audioFileId, targetLanguage, voiceId } = req.body;

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

    // Create a translation record
    const translation = await req.prisma.translation.create({
      data: {
        userId: req.user.id,
        sourceLanguage: 'auto', // Auto-detect source language
        targetLanguage,
        sourceText: '', // Will be updated after transcription
        translatedText: '', // Will be updated after translation
        audioFileId,
        createdAt: new Date()
      }
    });

    // Process the translation asynchronously
    processAudioTranslation(req.prisma, translation.id, audioFile, targetLanguage, voiceId)
      .catch(err => console.error('Error processing audio translation:', err));

    res.status(202).json({
      status: 'success',
      message: 'Audio translation started',
      data: {
        translationId: translation.id
      }
    });
  } catch (error) {
    console.error('Error translating audio:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to translate audio'
    });
  }
};

/**
 * Get translation status
 * @route GET /api/translation/:id
 * @access Private
 */
exports.getTranslationStatus = async (req, res) => {
  const { id } = req.params;

  try {
    const translation = await req.prisma.translation.findUnique({
      where: { id }
    });

    if (!translation) {
      return res.status(404).json({
        status: 'error',
        message: 'Translation not found'
      });
    }

    // Check if user owns the translation
    if (translation.userId !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to view this translation'
      });
    }

    res.json({
      status: 'success',
      data: translation
    });
  } catch (error) {
    console.error('Error fetching translation status:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch translation status'
    });
  }
};

/**
 * Get user's translation history
 * @route GET /api/translation/history
 * @access Private
 */
exports.getTranslationHistory = async (req, res) => {
  try {
    const translations = await req.prisma.translation.findMany({
      where: {
        userId: req.user.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      status: 'success',
      data: translations
    });
  } catch (error) {
    console.error('Error fetching translation history:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch translation history'
    });
  }
};

/**
 * Update user language preference
 * @route PUT /api/translation/preference
 * @access Private
 */
exports.updateLanguagePreference = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'error', errors: errors.array() });
  }

  const { language } = req.body;

  try {
    // Update user's preferred language
    const user = await req.prisma.user.update({
      where: { id: req.user.id },
      data: {
        preferredLanguage: language
      }
    });

    // Return user data without password
    const { password, ...userWithoutPassword } = user;

    res.json({
      status: 'success',
      data: userWithoutPassword
    });
  } catch (error) {
    console.error('Error updating language preference:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update language preference'
    });
  }
};

/**
 * Process an audio translation using Lingo API and ElevenLabs
 * @param {PrismaClient} prisma - Prisma client instance
 * @param {string} translationId - ID of the translation to process
 * @param {Object} audioFile - Source audio file
 * @param {string} targetLanguage - Target language code
 * @param {string} voiceId - ElevenLabs voice ID for synthesis
 */
async function processAudioTranslation(prisma, translationId, audioFile, targetLanguage, voiceId) {
  try {
    // Read the audio file
    const audioFilePath = path.join(process.cwd(), audioFile.storagePath);
    const audioData = fs.readFileSync(audioFilePath);

    // Step 1: Transcribe the audio using Lingo API
    // Use FormData-like functionality with form-data package
    const FormData = require('form-data');
    const formData = new FormData();
    formData.append('audio', fs.createReadStream(audioFilePath));
    formData.append('language', 'auto'); // Auto-detect language

    const transcriptionResponse = await axios.post(
      `${LINGO_API_URL}/transcribe`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${LINGO_API_KEY}`,
          ...formData.getHeaders()
        }
      }
    );

    const transcribedText = transcriptionResponse.data.text;
    const detectedLanguage = transcriptionResponse.data.detected_language || 'en';

    // Step 2: Translate the transcribed text
    const translationResponse = await axios.post(
      `${LINGO_API_URL}/translate`,
      {
        text: transcribedText,
        source_lang: detectedLanguage,
        target_lang: targetLanguage
      },
      {
        headers: {
          'Authorization': `Bearer ${LINGO_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const translatedText = translationResponse.data.translated_text;

    // Step 3: Synthesize the translated text using ElevenLabs
    const synthesisResponse = await axios.post(
      `${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`,
      {
        text: translatedText,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      },
      {
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer'
      }
    );

    // Generate a unique filename for the translated audio
    const filename = `translated_${uuidv4()}.mp3`;
    const storagePath = path.join('uploads', 'audio', 'translated', filename);
    const fullPath = path.join(process.cwd(), storagePath);

    // Ensure the directory exists
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });

    // Write the translated audio to disk
    fs.writeFileSync(fullPath, Buffer.from(synthesisResponse.data));

    // Create a new audio file record
    const translatedAudio = await prisma.audioFile.create({
      data: {
        id: uuidv4(),
        userId: audioFile.userId,
        originalFilename: filename,
        storagePath,
        fileSize: synthesisResponse.data.length,
        duration: audioFile.duration, // Assuming similar duration
        mimeType: 'audio/mpeg',
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Update the translation record
    await prisma.translation.update({
      where: { id: translationId },
      data: {
        sourceLanguage: detectedLanguage,
        sourceText: transcribedText,
        translatedText,
        translatedAudioId: translatedAudio.id
      }
    });
  } catch (error) {
    console.error('Error processing audio translation:', error);
    // The translation record remains with empty fields to indicate failure
  }
}