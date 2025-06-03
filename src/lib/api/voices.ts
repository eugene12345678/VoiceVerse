import { api } from './api';
import { feedAPI } from '../api';

// Voices API - Using existing feed API endpoints
export const voicesAPI = {
  // Get all voice posts
  getVoicePosts: async (page: number = 1, limit: number = 10) => {
    // Use the existing feed API
    return feedAPI.getFeedPosts('trending', page, limit);
  },
  
  // Get a specific voice post
  getVoicePost: async (postId: string) => {
    return feedAPI.getFeedPost(postId);
  },
  
  // Like a voice post
  likeVoicePost: async (postId: string) => {
    return feedAPI.likeFeedPost(postId);
  },
  
  // Save a voice post
  saveVoicePost: async (postId: string) => {
    return feedAPI.saveFeedPost(postId);
  },
  
  // Share a voice post
  shareVoicePost: async (postId: string) => {
    return feedAPI.shareFeedPost(postId);
  },
  
  // Follow a user - No direct equivalent, so we'll create a mock implementation
  followUser: async (userId: string) => {
    // Mock implementation since there's no direct endpoint
    return {
      status: 'success',
      isFollowing: true,
      message: 'User followed successfully'
    };
  },
  
  // Get user profile - No direct equivalent, so we'll create a mock implementation
  getUserProfile: async (userId: string) => {
    // Mock implementation since there's no direct endpoint
    return {
      status: 'success',
      data: {
        id: userId,
        username: 'user' + userId,
        displayName: 'User ' + userId,
        avatarUrl: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=600',
        isVerified: Math.random() > 0.5,
        bio: 'This is a mock user profile for testing purposes.',
        followerCount: Math.floor(Math.random() * 10000),
        followingCount: Math.floor(Math.random() * 1000),
        postsCount: Math.floor(Math.random() * 100),
        userInteractions: {
          isFollowing: Math.random() > 0.5
        }
      }
    };
  },
  
  // Get user's voice posts - No direct equivalent, so we'll create a mock implementation
  getUserVoicePosts: async (userId: string, page: number = 1, limit: number = 10) => {
    // Use the existing feed API but filter client-side
    const response = await feedAPI.getFeedPosts('trending', page, limit);
    
    // Mock filtering by user ID
    if (response.status === 'success' && response.data) {
      return {
        ...response,
        data: response.data.filter((post: any) => post.user && post.user.id === userId)
      };
    }
    
    return response;
  },
  
  // Get comments for a voice post
  getVoicePostComments: async (postId: string, page: number = 1, limit: number = 10) => {
    return feedAPI.getFeedPostComments(postId, page, limit);
  },
  
  // Add a comment to a voice post
  addVoicePostComment: async (postId: string, content: string) => {
    return feedAPI.addFeedPostComment(postId, content);
  },
  
  // Like a comment
  likeComment: async (commentId: string) => {
    return feedAPI.likeComment(commentId);
  }
};