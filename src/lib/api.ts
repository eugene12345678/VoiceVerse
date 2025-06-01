// api.ts
import axios from 'axios';

// Use environment variable for API URL if available, otherwise use default
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const ALGORAND_API_KEY = '98D9CE80660AD243893D56D9F125CD2D';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': ALGORAND_API_KEY
  },
});

// Create axios instance for file uploads
export const uploadApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

// Add request interceptor to include auth token for both instances
const addAuthToken = (config: any) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

api.interceptors.request.use(addAuthToken, (error) => Promise.reject(error));
uploadApi.interceptors.request.use(addAuthToken, (error) => Promise.reject(error));

// Add response interceptor to handle errors globally
const handleResponseError = (error: any) => {
  // Handle common errors here
  if (error.response) {
    // Server responded with an error status
    console.error('API Error:', error.response.data);
    
    // Handle authentication errors
    if (error.response.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
  } else if (error.request) {
    // Request was made but no response received
    console.error('API Request Error:', error.request);
  } else {
    // Something else happened
    console.error('API Error:', error.message);
  }
  
  return Promise.reject(error);
};

api.interceptors.response.use((response) => response, handleResponseError);
uploadApi.interceptors.response.use((response) => response, handleResponseError);

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data; // Backend returns { status, user, token }
  },
  
  signup: async (username: string, email: string, password: string) => {
    const response = await api.post('/auth/signup', { username, email, password });
    return response.data; // Backend returns { status, user, token }
  },
  
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data; // Backend returns { status, user }
  },
};

// Voice API
export const voiceAPI = {
  // Get all available voice effects
  getVoiceEffects: async () => {
    const response = await api.get('/voice/effects');
    return response.data;
  },
  
  // Get user's voice models
  getUserVoiceModels: async () => {
    const response = await api.get('/voice/models');
    return response.data;
  },
  
  // Get available ElevenLabs voices
  getElevenLabsVoices: async () => {
    const response = await api.get('/voice/elevenlabs/voices');
    return response.data;
  },
  
  // Clone a voice using ElevenLabs
  cloneVoice: async (name: string, description: string, audioFileId: string) => {
    const response = await api.post('/voice/clone', { name, description, audioFileId });
    return response.data;
  },
  
  // Transform audio using a voice effect
  transformAudio: async (audioFileId: string, effectId: string, settings?: any) => {
    const response = await api.post('/voice/transform', { audioFileId, effectId, settings });
    return response.data;
  },
  
  // Get transformation status
  getTransformationStatus: async (transformationId: string) => {
    const response = await api.get(`/voice/transform/${transformationId}`);
    return response.data;
  },
  
  // Get user's transformation history
  getTransformationHistory: async () => {
    const response = await api.get('/voice/history');
    return response.data;
  }
};

// Translation API
export const translationAPI = {
  // Get supported languages
  getSupportedLanguages: async () => {
    const response = await api.get('/translation/languages');
    return response.data;
  },
  
  // Translate text
  translateText: async (text: string, sourceLanguage: string, targetLanguage: string) => {
    const response = await api.post('/translation/text', { text, sourceLanguage, targetLanguage });
    return response.data;
  },
  
  // Translate audio
  translateAudio: async (audioFileId: string, targetLanguage: string, voiceId: string) => {
    const response = await api.post('/translation/audio', { audioFileId, targetLanguage, voiceId });
    return response.data;
  },
  
  // Get translation status
  getTranslationStatus: async (translationId: string) => {
    const response = await api.get(`/translation/${translationId}`);
    return response.data;
  },
  
  // Get user's translation history
  getTranslationHistory: async () => {
    const response = await api.get('/translation/history');
    return response.data;
  },
  
  // Update user language preference
  updateLanguagePreference: async (language: string) => {
    const response = await api.put('/translation/preference', { language });
    return response.data;
  }
};

// Upload API
export const uploadAPI = {
  // Upload audio file
  uploadAudio: async (audioFile: File) => {
    const formData = new FormData();
    formData.append('audio', audioFile);
    
    const response = await uploadApi.post('/upload/audio', formData);
    return response.data;
  }
};

// Feed API
export const feedAPI = {
  // Get feed posts
  getFeedPosts: async (filter: string = 'trending', page: number = 1, limit: number = 10) => {
    const response = await api.get('/feed', { params: { filter, page, limit } });
    return response.data;
  },
  
  // Create a new feed post
  createFeedPost: async (audioFileId: string, caption: string, description?: string, tags?: string[]) => {
    const response = await api.post('/feed', { audioFileId, caption, description, tags });
    return response.data;
  },
  
  // Get a specific feed post
  getFeedPost: async (postId: string) => {
    const response = await api.get(`/feed/${postId}`);
    return response.data;
  },
  
  // Like a feed post
  likeFeedPost: async (postId: string) => {
    const response = await api.post(`/feed/${postId}/like`);
    return response.data;
  },
  
  // Save a feed post
  saveFeedPost: async (postId: string) => {
    const response = await api.post(`/feed/${postId}/save`);
    return response.data;
  },
  
  // Share a feed post
  shareFeedPost: async (postId: string, platform?: string) => {
    const response = await api.post(`/feed/${postId}/share`, { platform });
    return response.data;
  },
  
  // Get comments for a feed post
  getFeedPostComments: async (postId: string, page: number = 1, limit: number = 10) => {
    const response = await api.get(`/feed/${postId}/comments`, { params: { page, limit } });
    return response.data;
  },
  
  // Add a comment to a feed post
  addFeedPostComment: async (postId: string, content: string) => {
    const response = await api.post(`/feed/${postId}/comments`, { content });
    return response.data;
  },
  
  // Like a comment
  likeComment: async (commentId: string) => {
    const response = await api.post(`/feed/comments/${commentId}/like`);
    return response.data;
  },
  
  // Get saved posts
  getSavedPosts: async (page: number = 1, limit: number = 10) => {
    const response = await api.get('/feed/saved', { params: { page, limit } });
    return response.data;
  }
};

// Challenge API
export const challengeAPI = {
  // Get all challenges
  getChallenges: async (filter: string = 'all', page: number = 1, limit: number = 10, search?: string) => {
    const params = { filter, page, limit, search };
    const response = await api.get('/challenges', { params });
    return response.data;
  },
  
  // Get a specific challenge
  getChallenge: async (challengeId: string) => {
    const response = await api.get(`/challenges/${challengeId}`);
    return response.data;
  },
  
  // Create a new challenge
  createChallenge: async (challengeData: {
    title: string;
    description: string;
    audioPrompt?: string;
    reward?: string;
    endDate: string;
    tags: string[];
    difficulty: 'easy' | 'medium' | 'hard';
    requirements?: string[];
  }) => {
    const response = await api.post('/challenges', challengeData);
    return response.data;
  },
  
  // Join a challenge with participant information
  joinChallenge: async (
    challengeId: string, 
    participantInfo: {
      name: string;
      email: string;
      motivation?: string;
      experience?: string;
      socialMediaHandle?: string;
      agreeToTerms: boolean;
    }
  ) => {
    const response = await api.post(`/challenges/${challengeId}/join`, participantInfo);
    return response.data;
  },
  
  // Submit to a challenge
  submitToChallenge: async (challengeId: string, audioFileId: string, description?: string) => {
    const response = await api.post(`/challenges/${challengeId}/submit`, { audioFileId, description });
    return response.data;
  },
  
  // Get challenge submissions
  getChallengeSubmissions: async (challengeId: string, page: number = 1, limit: number = 10) => {
    const response = await api.get(`/challenges/${challengeId}/submissions`, { params: { page, limit } });
    return response.data;
  },
  
  // Vote for a challenge submission
  voteForSubmission: async (submissionId: string) => {
    const response = await api.post(`/challenges/submissions/${submissionId}/vote`);
    return response.data;
  },
  
  // Get user's challenge participation
  getUserChallenges: async (status: 'joined' | 'created' | 'completed' = 'joined') => {
    const response = await api.get('/challenges/user/challenges', { params: { status } });
    return response.data;
  }
};

// Algorand API
export const algorandAPI = {
  // Connect wallet
  connectWallet: async (userId: string, walletAddress: string) => {
    const response = await api.post('/algorand/wallet/connect', { userId, walletAddress });
    return response.data;
  },
  
  // Get wallet info
  getWalletInfo: async (userId: string) => {
    const response = await api.get(`/algorand/wallet/${userId}`);
    return response.data;
  },
  
  // Create NFT
  createNFT: async (nftData: {
    userId: string;
    title: string;
    description: string;
    audioFileId: string;
    imageUrl: string;
    price: number;
    royalty?: number;
  }) => {
    const response = await api.post('/algorand/nft/create', nftData);
    return response.data;
  },
  
  // List NFT for sale
  listNFTForSale: async (nftId: string, price: number, userId: string) => {
    const response = await api.post('/algorand/nft/list', { nftId, price, userId });
    return response.data;
  },
  
  // Buy NFT
  buyNFT: async (nftId: string, buyerId: string) => {
    const response = await api.post('/algorand/nft/buy', { nftId, buyerId });
    return response.data;
  },
  
  // Get marketplace NFTs
  getMarketplaceNFTs: async (page: number = 1, limit: number = 10, filter?: string, sortBy?: string) => {
    const params = { page, limit, filter, sortBy };
    const response = await api.get('/algorand/nft/marketplace', { params });
    return response.data;
  },
  
  // Get user's NFTs
  getUserNFTs: async (userId: string, page: number = 1, limit: number = 10) => {
    const params = { page, limit };
    const response = await api.get(`/algorand/nft/user/${userId}`, { params });
    return response.data;
  },
  
  // Get NFTs created by a user
  getCreatedNFTs: async (userId: string, page: number = 1, limit: number = 10) => {
    const params = { page, limit };
    const response = await api.get(`/algorand/nft/created/${userId}`, { params });
    return response.data;
  },
  
  // Get NFT details
  getNFTDetails: async (nftId: string) => {
    const response = await api.get(`/algorand/nft/${nftId}`);
    return response.data;
  },
  
  // Like NFT
  likeNFT: async (nftId: string, userId: string) => {
    const response = await api.post('/algorand/nft/like', { nftId, userId });
    return response.data;
  },
  
  // Get transaction history for an NFT
  getNFTTransactionHistory: async (nftId: string) => {
    const response = await api.get(`/algorand/nft/${nftId}/transactions`);
    return response.data;
  },
  
  // Get transaction status
  getTransactionStatus: async (transactionId: string) => {
    const response = await api.get(`/algorand/transaction/${transactionId}`);
    return response.data;
  }
};

export default api;