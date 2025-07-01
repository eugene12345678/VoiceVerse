/**
 * Utility functions for downloading audio files
 */

interface DownloadAudioOptions {
  audioUrl: string;
  filename?: string;
  audioFile?: {
    mimeType?: string;
  };
  transformationType?: 'translated' | 'transformed' | 'original';
  effectName?: string;
  voiceName?: string;
  languageName?: string;
}

/**
 * Downloads an audio file with appropriate filename and format
 */
export const downloadAudio = async (options: DownloadAudioOptions): Promise<void> => {
  try {
    const {
      audioUrl,
      filename: customFilename,
      audioFile,
      transformationType = 'original',
      effectName,
      voiceName,
      languageName
    } = options;

    if (!audioUrl) {
      throw new Error('No audio URL provided for download');
    }

    // Generate appropriate filename
    let filename = customFilename || 'voice-creation';
    
    if (!customFilename) {
      switch (transformationType) {
        case 'translated':
          filename = `voice-translated-${languageName || 'unknown'}`;
          break;
        case 'transformed':
          if (effectName) {
            filename = `voice-${effectName.toLowerCase().replace(/\s+/g, '-')}`;
          } else if (voiceName) {
            filename = `voice-${voiceName.toLowerCase().replace(/\s+/g, '-')}`;
          } else {
            filename = 'voice-transformed';
          }
          break;
        default:
          filename = 'voice-original';
      }
    }

    // Add timestamp to make filename unique
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
    filename = `${filename}-${timestamp}`;

    // Determine file extension based on audio URL or MIME type
    let extension = '.mp3'; // default
    if (audioFile?.mimeType) {
      if (audioFile.mimeType.includes('webm')) {
        extension = '.webm';
      } else if (audioFile.mimeType.includes('wav')) {
        extension = '.wav';
      } else if (audioFile.mimeType.includes('ogg')) {
        extension = '.ogg';
      } else if (audioFile.mimeType.includes('mp4') || audioFile.mimeType.includes('m4a')) {
        extension = '.m4a';
      }
    } else if (audioUrl.includes('.webm')) {
      extension = '.webm';
    } else if (audioUrl.includes('.wav')) {
      extension = '.wav';
    } else if (audioUrl.includes('.ogg')) {
      extension = '.ogg';
    }

    filename += extension;

    // Create download link
    const link = document.createElement('a');

    // If it's a blob URL, use it directly
    if (audioUrl.startsWith('blob:')) {
      link.href = audioUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      console.log(`Downloaded audio file: ${filename}`);
      return;
    }

    // For server URLs, fetch the audio data and create a blob
    try {
      const response = await fetch(audioUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the blob URL after a short delay
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 1000);

      console.log(`Downloaded audio file: ${filename}`);
    } catch (fetchError) {
      console.error('Error fetching audio for download:', fetchError);
      throw new Error('Failed to download audio file. Please try again.');
    }

  } catch (error) {
    console.error('Error downloading audio:', error);
    throw error;
  }
};

/**
 * Creates a download handler function for use in React components
 */
export const createDownloadHandler = (getAudioContext: () => any) => {
  return async () => {
    try {
      const context = getAudioContext();
      const {
        translatedAudio,
        transformedAudio,
        recordedAudio,
        audioFile,
        selectedEffect,
        selectedEmotion,
        selectedVoiceId,
        elevenLabsVoices = [],
        voiceEffects = [],
        emotionVoices = [],
        languages = [],
        selectedLanguage,
        setErrorMessage
      } = context;

      // Determine which audio to download (priority: translated > transformed > original)
      const audioUrl = translatedAudio || transformedAudio || recordedAudio;
      
      if (!audioUrl) {
        if (setErrorMessage) {
          setErrorMessage('No audio available to download');
        }
        return;
      }

      // Determine transformation type and names
      let transformationType: 'translated' | 'transformed' | 'original' = 'original';
      let effectName = '';
      let voiceName = '';
      let languageName = '';

      if (translatedAudio) {
        transformationType = 'translated';
        const language = languages.find((lang: any) => lang.code === selectedLanguage);
        languageName = language?.name || selectedLanguage;
      } else if (transformedAudio) {
        transformationType = 'transformed';
        if (selectedEffect) {
          const effect = voiceEffects.find((e: any) => e.effectId === selectedEffect);
          effectName = effect?.name || 'transformed';
        } else if (selectedEmotion) {
          const emotion = emotionVoices.find((e: any) => e.effectId === selectedEmotion);
          effectName = emotion?.name || 'emotion';
        } else if (selectedVoiceId) {
          const voice = elevenLabsVoices.find((v: any) => v.voice_id === selectedVoiceId);
          voiceName = voice?.name || 'celebrity';
        }
      }

      await downloadAudio({
        audioUrl,
        audioFile,
        transformationType,
        effectName,
        voiceName,
        languageName
      });

      // Clear any error messages on successful download
      if (setErrorMessage) {
        setErrorMessage(null);
      }

    } catch (error) {
      console.error('Error in download handler:', error);
      const context = getAudioContext();
      if (context.setErrorMessage) {
        context.setErrorMessage('Failed to download audio file');
      }
    }
  };
};