import api from '../api';
import { User, UserSettings, VoicePost, NFT, Badge, Achievement, ActivityEvent } from '../../types';

// User Profile API
export const userAPI = {
  // Get user profile
  getUserProfile: async (userId?: string) => {
    const endpoint = userId ? `/users/${userId}` : '/users/profile';
    const response = await api.get(endpoint);
    return response.data;
  },
  
  // Update user profile
  updateUserProfile: async (userData: Partial<User>) => {
    const response = await api.put('/users/profile', userData);
    return response.data;
  },
  
  // Update profile picture
  updateProfilePicture: async (imageFile: File) => {
    const formData = new FormData();
    formData.append('avatar', imageFile);
    
    const response = await api.post('/users/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  
  // Remove profile picture
  removeProfilePicture: async () => {
    const response = await api.delete('/users/avatar');
    return response.data;
  },
  
  // Toggle profile visibility (public/private)
  toggleProfileVisibility: async (isPublic: boolean) => {
    const response = await api.put('/users/visibility', { isPublic });
    return response.data;
  },
  
  // Get user settings
  getUserSettings: async () => {
    try {
      const response = await api.get('/users/settings');
      return response.data;
    } catch (error) {
      console.error('Error fetching user settings:', error);
      // Return mock data
      return {
        status: 'success',
        data: {
          theme: 'system',
          language: 'en',
          notifications: {
            likes: true,
            comments: true,
            follows: true,
            mentions: true,
            challenges: true,
            nfts: true
          },
          privacy: {
            profileVisibility: 'public',
            messagePermission: 'followers',
            dataUsage: true
          },
          accessibility: {
            reducedMotion: false,
            highContrast: false,
            largeText: false
          }
        }
      };
    }
  },
  
  // Update user settings
  updateUserSettings: async (settings: Partial<UserSettings>) => {
    try {
      const response = await api.put('/users/settings', settings);
      return response.data;
    } catch (error) {
      console.error('Error updating user settings:', error);
      // Return mock success response
      return {
        status: 'success',
        message: 'Settings updated successfully',
        data: settings
      };
    }
  },
  
  // Get user's voice posts
  getUserVoicePosts: async (userId?: string, page: number = 1, limit: number = 10) => {
    const endpoint = userId ? `/users/${userId}/posts` : '/users/posts';
    const response = await api.get(endpoint, { params: { page, limit } });
    return response.data;
  },
  
  // Get user's saved posts
  getUserSavedPosts: async (page: number = 1, limit: number = 10) => {
    // Use the feed API endpoint for saved posts
    const response = await api.get('/feed/saved', { params: { page, limit } });
    return response.data;
  },
  
  // Get user's NFTs
  getUserNFTs: async (userId?: string, page: number = 1, limit: number = 10) => {
    // Use the algorand API endpoint for NFTs
    const userIdToUse = userId || 'me';
    const response = await api.get(`/algorand/nft/user/${userIdToUse}`, { params: { page, limit } });
    return response.data;
  },
  
  // Get user's followers
  getUserFollowers: async (userId?: string, page: number = 1, limit: number = 10) => {
    const endpoint = userId ? `/users/${userId}/followers` : '/users/followers';
    const response = await api.get(endpoint, { params: { page, limit } });
    return response.data;
  },
  
  // Get user's following
  getUserFollowing: async (userId?: string, page: number = 1, limit: number = 10) => {
    const endpoint = userId ? `/users/${userId}/following` : '/users/following';
    const response = await api.get(endpoint, { params: { page, limit } });
    return response.data;
  },
  
  // Follow/unfollow a user
  toggleFollowUser: async (userId: string) => {
    const response = await api.post(`/users/${userId}/follow`);
    return response.data;
  },
  
  // Get user's badges
  getUserBadges: async (userId?: string) => {
    try {
      const endpoint = userId ? `/users/${userId}/badges` : '/users/badges';
      const response = await api.get(endpoint);
      return response.data;
    } catch (error) {
      console.error('Error fetching user badges:', error);
      // Return empty array as fallback
      return {
        status: 'success',
        data: []
      };
    }
  },
  
  // Get user's achievements
  getUserAchievements: async (userId?: string) => {
    try {
      const endpoint = userId ? `/users/${userId}/achievements` : '/users/achievements';
      const response = await api.get(endpoint);
      return response.data;
    } catch (error) {
      console.error('Error fetching user achievements:', error);
      // Return empty array as fallback
      return {
        status: 'success',
        data: []
      };
    }
  },
  
  // Get user's activity
  getUserActivity: async (userId?: string, page: number = 1, limit: number = 10) => {
    try {
      const endpoint = userId ? `/users/${userId}/activity` : '/users/activity';
      const response = await api.get(endpoint, { params: { page, limit } });
      return response.data;
    } catch (error) {
      console.error('Error fetching user activity:', error);
      // Return empty array as fallback
      return {
        status: 'success',
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          hasMore: false
        }
      };
    }
  },
  
  // Get user's top recordings
  getUserTopRecordings: async (userId?: string, limit: number = 5) => {
    try {
      const endpoint = userId ? `/users/${userId}/top-recordings` : '/users/top-recordings';
      const response = await api.get(endpoint, { params: { limit } });
      return response.data;
    } catch (error) {
      console.error('Error fetching user top recordings:', error);
      // Return empty array as fallback
      return {
        status: 'success',
        data: []
      };
    }
  }
};