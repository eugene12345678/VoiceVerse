import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Calendar, 
  Award, 
  TrendingUp, 
  Play, 
  Heart, 
  MessageCircle, 
  Share2,
  Edit3
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';
import { WaveformVisualizer } from '../components/audio/WaveformVisualizer';
import { formatNumber, formatTimeAgo } from '../lib/utils';
import { useAuthStore } from '../store/authStore';

const mockUserPosts = [
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
  },
];

interface AudioPostCardProps {
  post: typeof mockUserPosts[0];
}

const AudioPostCard: React.FC<AudioPostCardProps> = ({ post }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <Card className="p-4">
      <p className="text-dark-800 dark:text-dark-200 mb-4">
        {post.caption}
      </p>
      <div className="mb-4">
        <WaveformVisualizer
          audioUrl={post.audioUrl}
          isPlaying={isPlaying}
          onPlayPause={() => setIsPlaying(!isPlaying)}
          height={64}
        />
      </div>
      <div className="flex items-center justify-between text-sm text-dark-500 dark:text-dark-400">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Heart className="h-4 w-4" />
            {formatNumber(post.likes)}
          </div>
          <div className="flex items-center gap-1">
            <MessageCircle className="h-4 w-4" />
            {formatNumber(post.comments)}
          </div>
          <div className="flex items-center gap-1">
            <Share2 className="h-4 w-4" />
            {formatNumber(post.shares)}
          </div>
        </div>
        <div>{formatTimeAgo(post.createdAt)}</div>
      </div>
    </Card>
  );
};

export const ProfilePage = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('posts');

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <Card className="p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <Avatar
              src={user.avatar}
              alt={user.displayName}
              size="xl"
              isVerified={user.isVerified}
            />
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-display font-bold text-dark-900 dark:text-white mb-2">
                {user.displayName}
              </h1>
              <p className="text-dark-500 dark:text-dark-400 mb-4">
                @{user.username}
              </p>
              <p className="text-dark-700 dark:text-dark-300 mb-6">
                {user.bio}
              </p>
              <div className="flex flex-wrap justify-center md:justify-start gap-6 text-sm">
                <div className="flex items-center gap-2 text-dark-600 dark:text-dark-400">
                  <Users className="h-4 w-4" />
                  <span>{formatNumber(user.followers)} followers</span>
                </div>
                <div className="flex items-center gap-2 text-dark-600 dark:text-dark-400">
                  <Calendar className="h-4 w-4" />
                  <span>Joined {new Date(user.joined).toLocaleDateString()}</span>
                </div>
                {user.isVerified && (
                  <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400">
                    <Award className="h-4 w-4" />
                    <span>Verified Creator</span>
                  </div>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              leftIcon={<Edit3 className="h-4 w-4" />}
            >
              Edit Profile
            </Button>
          </div>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6 text-center">
            <TrendingUp className="h-6 w-6 mx-auto mb-2 text-primary-600 dark:text-primary-400" />
            <div className="text-2xl font-bold text-dark-900 dark:text-white mb-1">
              {formatNumber(12345)}
            </div>
            <div className="text-dark-500 dark:text-dark-400">Total Plays</div>
          </Card>
          <Card className="p-6 text-center">
            <Play className="h-6 w-6 mx-auto mb-2 text-primary-600 dark:text-primary-400" />
            <div className="text-2xl font-bold text-dark-900 dark:text-white mb-1">
              {formatNumber(67)}
            </div>
            <div className="text-dark-500 dark:text-dark-400">Voice Posts</div>
          </Card>
          <Card className="p-6 text-center">
            <Award className="h-6 w-6 mx-auto mb-2 text-primary-600 dark:text-primary-400" />
            <div className="text-2xl font-bold text-dark-900 dark:text-white mb-1">
              {formatNumber(8)}
            </div>
            <div className="text-dark-500 dark:text-dark-400">Challenges Won</div>
          </Card>
        </div>

        {/* Content Tabs */}
        <div className="mb-6">
          <div className="flex gap-4 border-b border-gray-200 dark:border-dark-700">
            {['posts', 'saved', 'nfts'].map((tab) => (
              <button
                key={tab}
                className={`px-4 py-2 text-sm font-medium capitalize transition-colors relative ${
                  activeTab === tab
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-dark-500 dark:text-dark-400 hover:text-dark-900 dark:hover:text-white'
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
                {activeTab === tab && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-400"
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Posts Grid */}
        <div className="grid gap-4">
          {mockUserPosts.map(post => (
            <AudioPostCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </div>
  );
};