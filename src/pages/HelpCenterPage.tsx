import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Book,
  HelpCircle,
  Video,
  FileText,
  MessageCircle,
  ArrowRight,
  ChevronRight,
  Lightbulb,
  Zap,
  Shield,
  Settings,
  PlayCircle,
  Mic2
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

const categories = [
  {
    icon: <Book />,
    title: 'Getting Started',
    articles: [
      'Quick Start Guide',
      'Creating Your First Voice',
      'Understanding Voice Models',
      'Account Setup'
    ]
  },
  {
    icon: <Mic2 />,
    title: 'Voice Studio',
    articles: [
      'Recording Best Practices',
      'Voice Effects Guide',
      'Export Settings',
      'Quality Tips'
    ]
  },
  {
    icon: <Shield />,
    title: 'Security',
    articles: [
      'Account Security',
      'Data Protection',
      'Privacy Settings',
      'Safe Sharing'
    ]
  },
  {
    icon: <Settings />,
    title: 'Account Settings',
    articles: [
      'Profile Management',
      'Subscription Options',
      'Billing FAQ',
      'Notifications'
    ]
  }
];

const popularArticles = [
  {
    title: 'How to Create Professional Voice Overs',
    views: 12500,
    category: 'Tutorial',
    time: '5 min read'
  },
  {
    title: 'Voice Model Training Guide',
    views: 9800,
    category: 'Advanced',
    time: '8 min read'
  },
  {
    title: 'Troubleshooting Audio Quality',
    views: 8200,
    category: 'Support',
    time: '4 min read'
  }
];

const videoTutorials = [
  {
    title: 'Getting Started with VoiceVerse',
    duration: '5:32',
    thumbnail: 'https://images.pexels.com/photos/2773498/pexels-photo-2773498.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
  },
  {
    title: 'Advanced Voice Transformation',
    duration: '8:15',
    thumbnail: 'https://images.pexels.com/photos/3779409/pexels-photo-3779409.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
  },
  {
    title: 'Pro Tips & Tricks',
    duration: '6:45',
    thumbnail: 'https://images.pexels.com/photos/3779410/pexels-photo-3779410.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
  }
];

export const HelpCenterPage = () => {
  const [searchQuery, setSearchQuery] = useState('');

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
              How can we help?
            </h1>
            <p className="text-xl text-dark-600 dark:text-dark-400 max-w-2xl mx-auto mb-8">
              Find answers to your questions and learn how to get the most out of VoiceVerse
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-dark-400" />
              <input
                type="text"
                placeholder="Search for help articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-lg"
              />
            </div>
          </motion.div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {categories.map((category, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="p-6 hover:border-primary-500 transition-colors cursor-pointer">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg text-primary-600 dark:text-primary-400">
                    {category.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-dark-900 dark:text-white">
                    {category.title}
                  </h3>
                </div>
                <ul className="space-y-2">
                  {category.articles.map((article, i) => (
                    <li key={i} className="flex items-center gap-2 text-dark-600 dark:text-dark-400 hover:text-primary-600 dark:hover:text-primary-400">
                      <ChevronRight className="h-4 w-4" />
                      <span>{article}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Popular Articles */}
        <div className="mb-16">
          <h2 className="text-2xl font-display font-bold text-dark-900 dark:text-white mb-8 flex items-center gap-2">
            <Lightbulb className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            Popular Articles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {popularArticles.map((article, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="p-6 hover:border-primary-500 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-dark-900 dark:text-white">
                      {article.title}
                    </h3>
                    <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-sm rounded-full">
                      {article.category}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-dark-500 dark:text-dark-400 text-sm">
                    <span>{article.views.toLocaleString()} views</span>
                    <span>{article.time}</span>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Video Tutorials */}
        <div className="mb-16">
          <h2 className="text-2xl font-display font-bold text-dark-900 dark:text-white mb-8 flex items-center gap-2">
            <PlayCircle className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            Video Tutorials
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {videoTutorials.map((video, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="overflow-hidden hover:border-primary-500 transition-colors cursor-pointer">
                  <div className="relative aspect-video">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <PlayCircle className="h-12 w-12 text-white" />
                    </div>
                    <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 text-white text-sm rounded">
                      {video.duration}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-dark-900 dark:text-white">
                      {video.title}
                    </h3>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Contact Support */}
        <Card className="p-8 bg-gradient-to-r from-primary-500 to-accent-500 text-white">
          <div className="text-center">
            <h2 className="text-2xl font-display font-bold mb-4">
              Still Need Help?
            </h2>
            <p className="text-primary-100 mb-6">
              Can't find what you're looking for? Our support team is here to help!
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                className="bg-white text-primary-600 hover:bg-primary-50"
                leftIcon={<MessageCircle className="h-5 w-5" />}
                rightIcon={<ArrowRight className="h-5 w-5" />}
              >
                Contact Support
              </Button>
              <Button
                variant="outline"
                className="border-white text-white hover:bg-white/10"
                leftIcon={<Video className="h-5 w-5" />}
              >
                Schedule a Demo
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};