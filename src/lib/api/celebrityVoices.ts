import api from '../api';

// Celebrity Voice API
export const celebrityVoiceAPI = {
  // Get celebrity voices with actual ElevenLabs IDs
  getCelebrityVoices: async () => {
    const response = await api.get('/voice/celebrity/voices');
    return response.data;
  }
};

// Export individual functions for easier importing
export const getCelebrityVoices = celebrityVoiceAPI.getCelebrityVoices;