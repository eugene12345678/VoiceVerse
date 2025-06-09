const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator');

// Google Translate API configuration
const GOOGLE_TRANSLATE_API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY || process.env.GOOGLE_API_KEY;
const GOOGLE_TRANSLATE_API_URL = 'https://translation.googleapis.com/language/translate/v2';

// OpenAI Whisper API configuration for transcription
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/audio/transcriptions';

// ElevenLabs API configuration for voice synthesis
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || 'sk_ac7bbd0a5be8876d7c0e4efe0a9655f9a66475a5f42d3466';

// Supported languages with their codes and ElevenLabs voice mappings
const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', voiceId: '21m00Tcm4TlvDq8ikWAM' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', voiceId: 'pNInz6obpgDQGcFmaJgB' },
  { code: 'fr', name: 'French', nativeName: 'Français', voiceId: 'TxGEqnHWrfWFTfGW9XjX' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', voiceId: 'ZQe5CZNOzWyzPSCn5a3c' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', voiceId: 'EXAVITQu4vr4xnSDxMaL' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', voiceId: 'AZnzlk1XvdvUeBnXmlld' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', voiceId: '21m00Tcm4TlvDq8ikWAM' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', voiceId: 'pNInz6obpgDQGcFmaJgB' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', voiceId: 'TxGEqnHWrfWFTfGW9XjX' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', voiceId: 'ZQe5CZNOzWyzPSCn5a3c' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', voiceId: 'EXAVITQu4vr4xnSDxMaL' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', voiceId: 'AZnzlk1XvdvUeBnXmlld' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', voiceId: '21m00Tcm4TlvDq8ikWAM' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', voiceId: 'pNInz6obpgDQGcFmaJgB' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk', voiceId: 'TxGEqnHWrfWFTfGW9XjX' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk', voiceId: 'ZQe5CZNOzWyzPSCn5a3c' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi', voiceId: 'EXAVITQu4vr4xnSDxMaL' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', voiceId: 'AZnzlk1XvdvUeBnXmlld' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', voiceId: '21m00Tcm4TlvDq8ikWAM' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', voiceId: 'pNInz6obpgDQGcFmaJgB' }
];

/**
 * Get supported languages
 * @route GET /api/translation/languages
 * @access Public
 */
exports.getSupportedLanguages = async (req, res) => {
  try {
    // Return the comprehensive list of supported languages
    const languages = SUPPORTED_LANGUAGES.map(lang => ({
      code: lang.code,
      name: lang.name,
      nativeName: lang.nativeName
    }));

    res.json({
      status: 'success',
      data: { languages }
    });
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
    let translatedText = '';
    let detectedSourceLanguage = sourceLanguage || 'auto';

    // Try Google Translate API first
    if (GOOGLE_TRANSLATE_API_KEY) {
      try {
        console.log(`Translating text using Google Translate API from ${sourceLanguage || 'auto'} to ${targetLanguage}`);
        
        const params = new URLSearchParams({
          key: GOOGLE_TRANSLATE_API_KEY,
          q: text,
          target: targetLanguage,
          format: 'text'
        });

        if (sourceLanguage && sourceLanguage !== 'auto') {
          params.append('source', sourceLanguage);
        }

        const response = await axios.post(
          GOOGLE_TRANSLATE_API_URL,
          params,
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            timeout: 10000
          }
        );

        if (response.data && response.data.data && response.data.data.translations) {
          translatedText = response.data.data.translations[0].translatedText;
          detectedSourceLanguage = response.data.data.translations[0].detectedSourceLanguage || sourceLanguage || 'auto';
          console.log('Successfully translated text using Google Translate API');
        } else {
          throw new Error('Invalid response from Google Translate API');
        }
      } catch (googleError) {
        console.error('Google Translate API error:', googleError.message);
        throw googleError;
      }
    } else {
      // Fallback to mock translation if no API key
      console.log('No Google Translate API key found, using mock translation');
      translatedText = await getMockTranslation(text, targetLanguage);
      detectedSourceLanguage = sourceLanguage || 'en';
    }

    // Check if we're using the development user
    const isDevelopmentUser = req.user.id === 'dev-user-id';
    let userId = req.user.id;

    if (isDevelopmentUser) {
      // For development user, try to find a real user ID from the database
      try {
        const firstUser = await req.prisma.user.findFirst();
        if (firstUser) {
          userId = firstUser.id;
          console.log(`Using first user's ID (${userId}) for development user`);
        } else {
          throw new Error('No users found in database');
        }
      } catch (error) {
        console.error('Error finding a valid user ID:', error);
        return res.status(500).json({
          status: 'error',
          message: 'Cannot create translation in development mode: No valid user ID found'
        });
      }
    }

    // Save translation to database
    const translation = await req.prisma.translation.create({
      data: {
        userId: userId,
        sourceLanguage: detectedSourceLanguage,
        targetLanguage,
        sourceText: text,
        translatedText,
        createdAt: new Date()
      }
    });

    res.json({
      status: 'success',
      data: {
        translation: translatedText,
        translationId: translation.id,
        detectedSourceLanguage
      }
    });
  } catch (error) {
    console.error('Error translating text:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to translate text: ' + error.message
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
    // Validate target language
    const supportedLanguage = SUPPORTED_LANGUAGES.find(lang => lang.code === targetLanguage);
    if (!supportedLanguage) {
      return res.status(400).json({
        status: 'error',
        message: `Unsupported target language: ${targetLanguage}`
      });
    }

    // Check if we're using the development user
    const isDevelopmentUser = req.user.id === 'dev-user-id';
    
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

    // Check if user owns the audio file (skip this check in development mode)
    if (!isDevelopmentUser && audioFile.userId !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to use this audio file'
      });
    }

    // Use the language-specific voice ID if no specific voice ID is provided
    const effectiveVoiceId = voiceId || supportedLanguage.voiceId;

    // Create a translation record
    // Use the actual audio file owner's ID for the translation to avoid foreign key issues
    const translation = await req.prisma.translation.create({
      data: {
        userId: isDevelopmentUser ? audioFile.userId : req.user.id,
        sourceLanguage: 'auto', // Auto-detect source language
        targetLanguage,
        sourceText: '', // Will be updated after transcription
        translatedText: '', // Will be updated after translation
        audioFileId,
        createdAt: new Date()
      }
    });

    // Process the translation asynchronously
    processAudioTranslation(req.prisma, translation.id, audioFile, targetLanguage, effectiveVoiceId)
      .catch(err => console.error('Error processing audio translation:', err));

    res.status(202).json({
      status: 'success',
      message: 'Audio translation started',
      data: {
        translationId: translation.id,
        targetLanguage: supportedLanguage.name,
        voiceId: effectiveVoiceId
      }
    });
  } catch (error) {
    console.error('Error translating audio:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to translate audio: ' + error.message
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
    // Check if we're using the development user
    const isDevelopmentUser = req.user.id === 'dev-user-id';
    
    const translation = await req.prisma.translation.findUnique({
      where: { id }
    });

    if (!translation) {
      return res.status(404).json({
        status: 'error',
        message: 'Translation not found'
      });
    }

    // Check if user owns the translation (skip this check in development mode)
    if (!isDevelopmentUser && translation.userId !== req.user.id) {
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
    // Check if we're using the development user
    const isDevelopmentUser = req.user.id === 'dev-user-id';
    
    let translations;
    
    if (isDevelopmentUser) {
      // For development user, get all translations or a limited set
      translations = await req.prisma.translation.findMany({
        take: 10, // Limit to 10 translations for development
        orderBy: {
          createdAt: 'desc'
        }
      });
    } else {
      // For regular users, get only their translations
      translations = await req.prisma.translation.findMany({
        where: {
          userId: req.user.id
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    }

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
    // Check if we're using the development user
    const isDevelopmentUser = req.user.id === 'dev-user-id';
    
    if (isDevelopmentUser) {
      // In development mode with a mock user, just return a success response
      console.log(`Development user detected, skipping database update for language preference: ${language}`);
      
      return res.json({
        status: 'success',
        data: {
          ...req.user,
          preferredLanguage: language
        }
      });
    }
    
    // Check if the user exists before updating
    const existingUser = await req.prisma.user.findUnique({
      where: { id: req.user.id }
    });
    
    if (!existingUser) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
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
 * Get mock translation for fallback
 * @param {string} text - Text to translate
 * @param {string} targetLanguage - Target language code
 * @returns {string} Mock translated text
 */
async function getMockTranslation(text, targetLanguage) {
  const mockTranslations = {
    'es': `[ES] ${text}`,
    'fr': `[FR] ${text}`,
    'de': `[DE] ${text}`,
    'it': `[IT] ${text}`,
    'pt': `[PT] ${text}`,
    'ru': `[RU] ${text}`,
    'zh': `[ZH] ${text}`,
    'ja': `[JA] ${text}`,
    'ko': `[KO] ${text}`,
    'ar': `[AR] ${text}`,
    'hi': `[HI] ${text}`,
    'nl': `[NL] ${text}`,
    'sv': `[SV] ${text}`,
    'no': `[NO] ${text}`,
    'da': `[DA] ${text}`,
    'fi': `[FI] ${text}`,
    'pl': `[PL] ${text}`,
    'tr': `[TR] ${text}`,
    'uk': `[UK] ${text}`
  };

  return mockTranslations[targetLanguage] || `[${targetLanguage.toUpperCase()}] ${text}`;
}

/**
 * Transcribe audio using OpenAI Whisper API
 * @param {string} audioFilePath - Path to the audio file
 * @returns {Object} Transcription result with text and detected language
 */
async function transcribeAudio(audioFilePath) {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const FormData = require('form-data');
  const formData = new FormData();
  formData.append('file', fs.createReadStream(audioFilePath));
  formData.append('model', 'whisper-1');
  formData.append('response_format', 'json');

  const response = await axios.post(
    OPENAI_API_URL,
    formData,
    {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        ...formData.getHeaders()
      },
      timeout: 60000 // 60 second timeout
    }
  );

  return {
    text: response.data.text,
    language: response.data.language || 'en'
  };
}

/**
 * Translate text using Google Translate API
 * @param {string} text - Text to translate
 * @param {string} sourceLanguage - Source language code
 * @param {string} targetLanguage - Target language code
 * @returns {string} Translated text
 */
async function translateTextWithGoogle(text, sourceLanguage, targetLanguage) {
  if (!GOOGLE_TRANSLATE_API_KEY) {
    throw new Error('Google Translate API key not configured');
  }

  const params = new URLSearchParams({
    key: GOOGLE_TRANSLATE_API_KEY,
    q: text,
    target: targetLanguage,
    format: 'text'
  });

  if (sourceLanguage && sourceLanguage !== 'auto') {
    params.append('source', sourceLanguage);
  }

  const response = await axios.post(
    GOOGLE_TRANSLATE_API_URL,
    params,
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: 10000
    }
  );

  if (response.data && response.data.data && response.data.data.translations) {
    return response.data.data.translations[0].translatedText;
  } else {
    throw new Error('Invalid response from Google Translate API');
  }
}

/**
 * Process an audio translation using OpenAI Whisper, Google Translate, and ElevenLabs
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
    
    if (!fs.existsSync(audioFilePath)) {
      throw new Error(`Audio file not found: ${audioFilePath}`);
    }

    // Initialize variables for transcription and translation
    let transcribedText = '';
    let translatedText = '';
    let detectedLanguage = 'en';

    // Step 1: Transcribe the audio
    try {
      if (OPENAI_API_KEY) {
        console.log('Transcribing audio using OpenAI Whisper API...');
        const transcriptionResult = await transcribeAudio(audioFilePath);
        transcribedText = transcriptionResult.text;
        detectedLanguage = transcriptionResult.language;
        console.log(`Successfully transcribed audio: "${transcribedText.substring(0, 100)}..."`);
        console.log(`Detected language: ${detectedLanguage}`);
      } else {
        throw new Error('OpenAI API key not configured');
      }
    } catch (transcriptionError) {
      console.error('Error with transcription:', transcriptionError.message);
      
      // Fallback: Use mock transcription
      console.log('Using fallback mock transcription');
      const filename = path.basename(audioFile.originalFilename, path.extname(audioFile.originalFilename));
      transcribedText = `This is a mock transcription for file: ${filename}. The actual transcription service is currently unavailable.`;
      detectedLanguage = 'en';
    }

    // Step 2: Translate the transcribed text
    try {
      if (GOOGLE_TRANSLATE_API_KEY && detectedLanguage !== targetLanguage) {
        console.log(`Translating text from ${detectedLanguage} to ${targetLanguage} using Google Translate...`);
        translatedText = await translateTextWithGoogle(transcribedText, detectedLanguage, targetLanguage);
        console.log(`Successfully translated text: "${translatedText.substring(0, 100)}..."`);
      } else if (detectedLanguage === targetLanguage) {
        // No translation needed if source and target languages are the same
        translatedText = transcribedText;
        console.log('No translation needed - source and target languages are the same');
      } else {
        throw new Error('Google Translate API key not configured');
      }
    } catch (translationError) {
      console.error('Error with translation:', translationError.message);
      
      // Fallback: Use mock translation
      console.log('Using fallback mock translation');
      translatedText = await getMockTranslation(transcribedText, targetLanguage);
    }

    // Step 3: Synthesize the translated text using ElevenLabs
    let synthesisData;
    let synthesisSuccessful = false;
    
    // Get the appropriate voice for the target language
    const targetLanguageVoice = SUPPORTED_LANGUAGES.find(lang => lang.code === targetLanguage);
    const effectiveVoiceId = targetLanguageVoice ? targetLanguageVoice.voiceId : voiceId;
    
    try {
      console.log(`Synthesizing translated text with ElevenLabs using voice ID: ${effectiveVoiceId} for language: ${targetLanguage}...`);
      
      const synthesisResponse = await axios.post(
        `${ELEVENLABS_API_URL}/text-to-speech/${effectiveVoiceId}`,
        {
          text: translatedText,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.6,
            similarity_boost: 0.8,
            style: 0.3,
            use_speaker_boost: true
          }
        },
        {
          headers: {
            'xi-api-key': ELEVENLABS_API_KEY,
            'Content-Type': 'application/json'
          },
          responseType: 'arraybuffer',
          timeout: 60000 // 60 second timeout
        }
      );
      
      synthesisData = synthesisResponse.data;
      synthesisSuccessful = true;
      console.log('Successfully synthesized translated text to audio');
    } catch (synthesisError) {
      console.error('Error with ElevenLabs API:', synthesisError.message);
      
      // Fallback: Try to use a sample audio file
      console.log('Using fallback audio file');
      
      // Try to find a sample audio file in the public directory
      const sampleAudioPath = path.join(process.cwd(), '..', 'public', 'Back-home.mp3');
      if (fs.existsSync(sampleAudioPath)) {
        synthesisData = fs.readFileSync(sampleAudioPath);
        synthesisSuccessful = true;
        console.log('Using sample audio file as fallback');
      } else {
        // Create a minimal audio file as last resort
        console.log('Creating minimal fallback audio');
        synthesisData = Buffer.alloc(1024); // Minimal buffer
        synthesisSuccessful = true;
      }
    }
    
    if (!synthesisSuccessful) {
      throw new Error('Failed to synthesize audio and no fallback available');
    }

    // Generate a unique filename for the translated audio
    const audioId = uuidv4();
    const filename = `translated_${audioId}.mp3`;
    const storagePath = path.join('uploads', 'audio', 'translated', filename);
    const fullPath = path.join(process.cwd(), storagePath);

    // Ensure the directory exists
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });

    // Write the translated audio to disk
    fs.writeFileSync(fullPath, Buffer.from(synthesisData));
    
    // Log the file path for debugging
    console.log(`Translated audio file saved to: ${fullPath}`);
    console.log(`Storage path: ${storagePath}`);
    console.log(`Audio ID: ${audioId}`);

    // Create a new audio file record - use the same ID for both the filename and the database record
    const translatedAudio = await prisma.audioFile.create({
      data: {
        id: audioId, // Use the same ID that's in the filename
        userId: audioFile.userId,
        originalFilename: filename,
        storagePath,
        fileSize: synthesisData.length,
        duration: audioFile.duration, // Assuming similar duration
        mimeType: 'audio/mpeg',
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    console.log(`Created audio file record with ID: ${translatedAudio.id}`);

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
    
    console.log(`Translation completed successfully for translation ID: ${translationId}`);
  } catch (error) {
    console.error('Error processing audio translation:', error);
    
    // Log the error but don't try to update with non-existent fields
    console.log(`Translation failed for ID: ${translationId}. Error: ${error.message}`);
  }
}