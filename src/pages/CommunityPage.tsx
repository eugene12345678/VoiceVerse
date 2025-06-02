import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  MessageCircle,
  Heart,
  Share2,
  Globe,
  Award,
  Sparkles,
  TrendingUp,
  Search,
  Filter,
  Plus,
  ChevronRight,
  ArrowRight,
  Star
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';
import { formatTimeAgo } from '../lib/utils';

const discussions = [
  {
    id: '1',
    title: 'Best practices for voice acting in games',
    content: 'I\'m working on a game project and need advice on voice acting techniques...',
    author: {
      name: 'Sarah Johnson',
      avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=600',
      role: 'Voice Artist'
    },
    category: 'Voice Acting',
    tags: ['Gaming', 'Voice Acting', 'Tips'],
    likes: 234,
    comments: 45,
    createdAt: '2024-03-01T10:00:00Z',
    isPopular: true
  },
  {
    id: '2',
    title: 'How to achieve natural-sounding voice transformations',
    content: 'Looking for tips on making AI voice transformations sound more natural...',
    author: {
      name: 'David Chen',
      avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=600',
      role: 'Pro Member'
    },
    category: 'Technical',
    tags: ['AI', 'Voice Tech', 'Tutorial'],
    likes: 189,
    comments: 32,
    createdAt: '2024-02-29T15:30:00Z',
    isPopular: true
  }
];

const featuredMembers = [
  {
    name: 'Emily Rodriguez',
    avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=600',
    role: 'Voice Artist',
    contributions: 156,
    followers: 1200
  },
  {
    name: 'Michael Chang',
    avatar: 'https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=600',
    role: 'Audio Engineer',
    contributions: 243,
    followers: 890
  },
  {
    name: 'Lisa Thompson',
    avatar: 'https://images.pexels.com/photos/1065084/pexels-photo-1065084.jpeg?auto=compress&cs=tinysrgb&w=600',
    role: 'Content Creator',
    contributions: 178,
    followers: 2300
  }
];

const categories = [
  { name: 'Voice Acting', count: 156 },
  { name: 'Technical', count: 98 },
  { name: 'Tutorials', count: 234 },
  { name: 'Showcase', count: 167 },
  { name: 'Questions', count: 321 }
];

export const CommunityPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  return (
    <div className="min-h-screen bg-gradient-mesh dark:bg-dark-950">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl font-display font-bold text-dark-900 dark:text-white mb-4">
              VoiceVerse Community
            </h1>
            <p className="text-xl text-dark-600 dark:text-dark-400 max-w-2xl mx-auto">
              Connect with voice artists, share experiences, and learn from the community
            </p>
          </motion.div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {[
            { icon: <Users />, label: 'Members', value: '50K+' },
            { icon: <MessageCircle />, label: 'Discussions', value: '12K+' },
            { icon: <Globe />, label: 'Countries', value: '150+' },
            { icon: <Award />, label: 'Expert Users', value: '500+' }
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 mb-4">
                  {stat.icon}
                </div>
                <div className="text-2xl font-bold text-dark-900 dark:text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-dark-600 dark:text-dark-400">
                  {stat.label}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Search and Filters */}
            <div className="flex gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400" />
                <input
                  type="text"
                  placeholder="Search discussions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <Button
                variant="outline"
                leftIcon={<Filter className="h-5 w-5" />}
              >
                Filter
              </Button>
              <Button
                leftIcon={<Plus className="h-5 w-5" />}
              >
                New Post
              </Button>
            </div>

            {/* Discussions */}
            <div className="space-y-6">
              {discussions.map((discussion, index) => (
                <motion.div
                  key={discussion.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar
                        src={discussion.author.avatar}
                        alt={discussion.author.name}
                        size="md"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-dark-900 dark:text-white">
                            {discussion.author.name}
                          </h3>
                          <span className="text-dark-500 dark:text-dark-400 text-sm">
                            • {formatTimeAgo(discussion.createdAt)}
                          </span>
                        </div>
                        <div className="text-sm text-dark-500 dark:text-dark-400 mb-3">
                          {discussion.author.role}
                        </div>
                        <h2 className="text-xl font-semibold text-dark-900 dark:text-white mb-2">
                          {discussion.title}
                        </h2>
                        <p className="text-dark-600 dark:text-dark-400 mb-4">
                          {discussion.content}
                        </p>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {discussion.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-sm rounded-full"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-6">
                          <button className="flex items-center gap-2 text-dark-500 dark:text-dark-400 hover:text-primary-600 dark:hover:text-primary-400">
                            <Heart className="h-5 w-5" />
                            <span>{discussion.likes}</span>
                          </button>
                          <button className="flex items-center gap-2 text-dark-500 dark:text-dark-400 hover:text-primary-600 dark:hover:text-primary-400">
                            <MessageCircle className="h-5 w-5" />
                            <span>{discussion.comments}</span>
                          </button>
                          <button className="flex items-center gap-2 text-dark-500 dark:text-dark-400 hover:text-primary-600 dark:hover:text-primary-400">
                            <Share2 className="h-5 w-5" />
                            <span>Share</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Featured Members */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-dark-900 dark:text-white mb-6 flex items-center gap-2">
                <Star className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                Featured Members
              </h2>
              <div className="space-y-4">
                {featuredMembers.map((member, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <Avatar
                      src={member.avatar}
                      alt={member.name}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-dark-900 dark:text-white truncate">
                        {member.name}
                      </h3>
                      <p className="text-sm text-dark-500 dark:text-dark-400">
                        {member.role}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Follow
                    </Button>
                  </div>
                ))}
              </div>
            </Card>

            {/* Categories */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-dark-900 dark:text-white mb-6">
                Categories
              </h2>
              <div className="space-y-2">
                {categories.map((category, index) => (
                  <button
                    key={index}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors"
                    onClick={() => setSelectedCategory(category.name)}
                  >
                    <span className="text-dark-600 dark:text-dark-400">
                      {category.name}
                    </span>
                    <span className="text-dark-500 dark:text-dark-400 text-sm">
                      {category.count}
                    </span>
                  </button>
                ))}
              </div>
            </Card>

            {/* Join Community */}
            <Card className="p-6 bg-gradient-to-r from-primary-500 to-accent-500 text-white">
              <h2 className="text-xl font-semibold mb-4">
                Join Our Community
              </h2>
              <p className="text-primary-100 mb-6">
                Connect with voice artists, share your work, and learn from experts.
              </p>
              <Button
                className="w-full bg-white text-primary-600 hover:bg-primary-50"
                leftIcon={<Users className="h-5 w-5" />}
                rightIcon={<ArrowRight className="h-5 w-5" />}
              >
                Join Now
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};