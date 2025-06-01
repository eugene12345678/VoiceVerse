// User types
export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  bio: string;
  voiceSignature?: string;
  followers: number;
  following: number;
  joined: string;
  isVerified: boolean;
}

// Authentication types
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Voice content types
export interface VoicePost {
  id: string;
  userId: string;
  user: User;
  audioUrl: string;
  caption: string;
  duration: number;
  waveform: number[];
  likes: number;
  comments: number;
  shares: number;
  tags: string[];
  createdAt: string;
  isLiked: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  user: User;
  content: string;
  audioReply?: string;
  createdAt: string;
  likes: number;
  isLiked: boolean;
}

// Voice transformation types
export interface VoiceEffect {
  id: string;
  name: string;
  category: 'celebrity' | 'emotion' | 'language';
  icon: string;
  previewUrl?: string;
}

// Challenge types
export interface Challenge {
  id: string;
  title: string;
  description: string;
  creatorId: string;
  creator: User;
  audioPrompt?: string;
  participants: number;
  submissions: number;
  reward?: string;
  startDate: string;
  endDate: string;
  tags: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  requirements?: string[];
  engagement?: number;
  trending?: boolean;
  featured?: boolean;
  sampleAudio?: string;
  isJoined?: boolean;
}

export interface ChallengeSubmission {
  id: string;
  challengeId: string;
  userId: string;
  user: User;
  audioUrl: string;
  description?: string;
  createdAt: string;
  votes: number;
  hasVoted: boolean;
}

// NFT types
export interface NFT {
  id: string;
  title: string;
  description: string;
  creatorId: string;
  creator: User;
  ownerId: string;
  owner: User;
  audioUrl: string;
  waveform: number[];
  imageUrl: string;
  price: number;
  currency: string;
  royalty: number;
  likes: number;
  isLiked: boolean;
  createdAt: string;
  isForSale: boolean;
}

// Analytics types
export interface AnalyticsData {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  followers: number;
  engagementRate: number;
  dailyStats: {
    date: string;
    views: number;
    likes: number;
    comments: number;
    shares: number;
    followers: number;
  }[];
}

// Notification types
export interface Notification {
  id: string;
  userId: string;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'challenge' | 'nft';
  actorId: string;
  actor: User;
  contentId?: string;
  content?: string;
  createdAt: string;
  isRead: boolean;
}

// Settings types
export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: {
    likes: boolean;
    comments: boolean;
    follows: boolean;
    mentions: boolean;
    challenges: boolean;
    nfts: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'followers' | 'private';
    messagePermission: 'everyone' | 'followers' | 'nobody';
    dataUsage: boolean;
  };
  accessibility: {
    reducedMotion: boolean;
    highContrast: boolean;
    largeText: boolean;
  };
}