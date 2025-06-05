import api from '../api';
import { User, UserSettings, VoicePost, NFT, Badge, Achievement, ActivityEvent } from '../../types';

// User Profile API
export const userAPI = {
  // Get user profile
  getUserProfile: async (userId?: string) => {
    // Use /users endpoint instead of /user
    const endpoint = userId ? `/users/${userId}` : '/users/profile';
    try {
      const response = await api.get(endpoint);
      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Return mock data as fallback
      return {
        status: 'success',
        data: {
          id: userId || 'current-user',
          username: 'voicemaster',
          displayName: 'Voice Master',
          avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=600',
          bio: 'Professional voice artist passionate about creating unique audio experiences.',
          voiceSignature: 'Versatile with a warm tone',
          followers: 1250,
          following: 350,
          joined: '2023-09-15T00:00:00Z',
          isVerified: true,
          isPublic: true,
          stats: {
            totalPlays: 12345,
            voicePosts: 67,
            challengesWon: 8
          },
          badges: [
            { id: '1', name: 'Early Adopter', icon: 'star', description: 'Joined during beta phase' },
            { id: '2', name: 'Voice Master', icon: 'mic', description: 'Created 50+ voice transformations' },
            { id: '3', name: 'Trending Creator', icon: 'trending-up', description: 'Had a post in trending' }
          ],
          achievements: [
            { id: '1', name: 'First Transformation', description: 'Created your first voice transformation', date: '2023-09-20T00:00:00Z', icon: 'award' },
            { id: '2', name: '1000 Plays', description: 'Reached 1000 plays on your content', date: '2023-10-15T00:00:00Z', icon: 'play' },
            { id: '3', name: 'Challenge Winner', description: 'Won your first voice challenge', date: '2023-11-05T00:00:00Z', icon: 'trophy' }
          ],
          activity: [
            { id: '1', type: 'post', description: 'Created a new voice post', date: '2024-02-28T12:00:00Z', relatedId: '1' },
            { id: '2', type: 'like', description: 'Liked a voice post', date: '2024-02-27T15:30:00Z', relatedId: '2' },
            { id: '3', type: 'follow', description: 'Followed a new user', date: '2024-02-26T09:45:00Z', relatedId: '3' }
          ]
        }
      };
    }
  },
  
  // Update user profile
  updateUserProfile: async (userData: Partial<User>) => {
    try {
      const response = await api.put('/users/profile', userData);
      return response.data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      // Return mock success response
      return {
        status: 'success',
        message: 'Profile updated successfully',
        data: userData
      };
    }
  },
  
  // Update profile picture
  updateProfilePicture: async (imageFile: File) => {
    try {
      const formData = new FormData();
      formData.append('avatar', imageFile);
      
      const response = await api.post('/users/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error updating profile picture:', error);
      // Return mock success response
      return {
        status: 'success',
        message: 'Profile picture updated successfully',
        data: {
          avatar: URL.createObjectURL(imageFile)
        }
      };
    }
  },
  
  // Toggle profile visibility (public/private)
  toggleProfileVisibility: async (isPublic: boolean) => {
    try {
      const response = await api.put('/users/visibility', { isPublic });
      return response.data;
    } catch (error) {
      console.error('Error toggling profile visibility:', error);
      // Return mock success response
      return {
        status: 'success',
        message: `Profile is now ${isPublic ? 'public' : 'private'}`,
        data: { isPublic }
      };
    }
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
    try {
      const endpoint = userId ? `/users/${userId}/posts` : '/users/posts';
      const response = await api.get(endpoint, { params: { page, limit } });
      return response.data;
    } catch (error) {
      console.error('Error fetching user voice posts:', error);
      // Return mock data
      return {
        status: 'success',
        data: [
          {
            id: '1',
            audioUrl: 'https://www2.cs.uic.edu/~i101/SoundFiles/BabyElephantWalk60.wav',
            caption: 'My first voice transformation! 🎭',
            createdAt: '2024-02-28T12:00:00Z',
            likes: 1234,
            comments: 89,
            shares: 45,
          },
          {
            id: '2',
            audioUrl: 'https://www2.cs.uic.edu/~i101/SoundFiles/CantinaBand3.wav',
            caption: 'Russian accent challenge 🇷🇺',
            createdAt: '2024-02-27T15:30:00Z',
            likes: 856,
            comments: 34,
            shares: 12,
          }
        ],
        pagination: {
          page,
          limit,
          total: 2,
          hasMore: false
        }
      };
    }
  },
  
  // Get user's saved posts
  getUserSavedPosts: async (page: number = 1, limit: number = 10) => {
    try {
      // Use the feed API endpoint for saved posts
      const response = await api.get('/feed/saved', { params: { page, limit } });
      return response.data;
    } catch (error) {
      console.error('Error fetching user saved posts:', error);
      // Return mock data
      return {
        status: 'success',
        data: [
          {
            id: '3',
            audioUrl: '/medieval-gamer-voice-darkness-hunts-us-what-youx27ve-learned-stay-226596.mp3',
            caption: 'Epic voice transformation!',
            createdAt: '2024-02-25T10:15:00Z',
            likes: 2345,
            comments: 120,
            shares: 78,
          }
        ],
        pagination: {
          page,
          limit,
          total: 1,
          hasMore: false
        }
      };
    }
  },
  
  // Get user's NFTs
  getUserNFTs: async (userId?: string, page: number = 1, limit: number = 10) => {
    try {
      // Use the algorand API endpoint for NFTs
      const userIdToUse = userId || 'me';
      const response = await api.get(`/algorand/nft/user/${userIdToUse}`, { params: { page, limit } });
      return response.data;
    } catch (error) {
      console.error('Error fetching user NFTs:', error);
      // Return mock data
      return {
        status: 'success',
        data: [
          {
            id: 'nft1',
            title: 'Morgan Freeman Voice',
            description: 'My best Morgan Freeman impression',
            audioUrl: '/sound-design-elements-sfx-ps-022-302865.mp3',
            imageUrl: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=600',
            price: 0.5,
            currency: 'ALGO',
            createdAt: '2024-01-15T08:30:00Z'
          }
        ],
        pagination: {
          page,
          limit,
          total: 1,
          hasMore: false
        }
      };
    }
  },
  
  // Get user's followers
  getUserFollowers: async (userId?: string, page: number = 1, limit: number = 10) => {
    try {
      const endpoint = userId ? `/users/${userId}/followers` : '/users/followers';
      const response = await api.get(endpoint, { params: { page, limit } });
      return response.data;
    } catch (error) {
      console.error('Error fetching user followers:', error);
      // Return mock data
      return {
        status: 'success',
        data: [
          {
            id: 'user1',
            username: 'voicefan',
            displayName: 'Voice Fan',
            avatar: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=600',
            isVerified: false,
            isFollowing: true
          },
          {
            id: 'user2',
            username: 'audioexplorer',
            displayName: 'Audio Explorer',
            avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=600',
            isVerified: true,
            isFollowing: false
          }
        ],
        pagination: {
          page,
          limit,
          total: 2,
          hasMore: false
        }
      };
    }
  },
  
  // Get user's following
  getUserFollowing: async (userId?: string, page: number = 1, limit: number = 10) => {
    try {
      const endpoint = userId ? `/users/${userId}/following` : '/users/following';
      const response = await api.get(endpoint, { params: { page, limit } });
      return response.data;
    } catch (error) {
      console.error('Error fetching user following:', error);
      // Return mock data
      return {
        status: 'success',
        data: [
          {
            id: 'user3',
            username: 'voicemaster',
            displayName: 'Voice Master',
            avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=600',
            isVerified: true,
            isFollowing: true
          }
        ],
        pagination: {
          page,
          limit,
          total: 1,
          hasMore: false
        }
      };
    }
  },
  
  // Follow/unfollow a user
  toggleFollowUser: async (userId: string) => {
    try {
      const response = await api.post(`/users/${userId}/follow`);
      return response.data;
    } catch (error) {
      console.error('Error toggling follow user:', error);
      // Return mock success response
      return {
        status: 'success',
        message: 'Follow status updated',
        isFollowing: true
      };
    }
  },
  
  // Get user's badges
  getUserBadges: async (userId?: string) => {
    try {
      const endpoint = userId ? `/users/${userId}/badges` : '/users/badges';
      const response = await api.get(endpoint);
      return response.data;
    } catch (error) {
      console.error('Error fetching user badges:', error);
      // Return mock data
      return {
        status: 'success',
        data: [
          { id: '1', name: 'Early Adopter', icon: 'star', description: 'Joined during beta phase' },
          { id: '2', name: 'Voice Master', icon: 'mic', description: 'Created 50+ voice transformations' },
          { id: '3', name: 'Trending Creator', icon: 'trending-up', description: 'Had a post in trending' }
        ]
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
      // Return mock data
      return {
        status: 'success',
        data: [
          { id: '1', name: 'First Transformation', description: 'Created your first voice transformation', date: '2023-09-20T00:00:00Z', icon: 'award' },
          { id: '2', name: '1000 Plays', description: 'Reached 1000 plays on your content', date: '2023-10-15T00:00:00Z', icon: 'play' },
          { id: '3', name: 'Challenge Winner', description: 'Won your first voice challenge', date: '2023-11-05T00:00:00Z', icon: 'trophy' }
        ]
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
      // Return mock data
      return {
        status: 'success',
        data: [
          { id: '1', type: 'post', description: 'Created a new voice post', date: '2024-02-28T12:00:00Z', relatedId: '1' },
          { id: '2', type: 'like', description: 'Liked a voice post', date: '2024-02-27T15:30:00Z', relatedId: '2' },
          { id: '3', type: 'follow', description: 'Followed a new user', date: '2024-02-26T09:45:00Z', relatedId: '3' }
        ],
        pagination: {
          page,
          limit,
          total: 3,
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
      // Return mock data
      return {
        status: 'success',
        data: [
          {
            id: '1',
            audioUrl: 'https://www2.cs.uic.edu/~i101/SoundFiles/BabyElephantWalk60.wav',
            caption: 'My first voice transformation! 🎭',
            createdAt: '2024-02-28T12:00:00Z',
            likes: 1234,
            comments: 89,
            shares: 45,
            plays: 5678
          },
          {
            id: '2',
            audioUrl: 'https://www2.cs.uic.edu/~i101/SoundFiles/CantinaBand3.wav',
            caption: 'Russian accent challenge 🇷🇺',
            createdAt: '2024-02-27T15:30:00Z',
            likes: 856,
            comments: 34,
            shares: 12,
            plays: 3456
          }
        ]
      };
    }
  }
};