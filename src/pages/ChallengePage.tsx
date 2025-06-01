import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Trophy,
  Clock,
  Users,
  Star,
  ChevronRight,
  Plus,
  TrendingUp,
  Award,
  Gift,
  Zap,
  Crown,
  Target,
  Calendar,
  Filter,
  Search,
  ArrowUp,
  MessageCircle,
  Share2
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';
import { IconButton } from '../components/ui/IconButton';
import { WaveformVisualizer } from '../components/audio/WaveformVisualizer';
import { formatNumber } from '../lib/utils';
import { challengeAPI } from '../lib/api';
import { Challenge } from '../types';

const mockChallenges = [
  {
    id: '1',
    title: 'Morgan Freeman Impression Challenge',
    description: 'Create your best Morgan Freeman narration of a daily activity.',
    creator: {
      id: 'user1',
      displayName: 'Voice Master',
      avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=600',
      isVerified: true
    },
    participants: 1234,
    submissions: 567,
    reward: '1000 ALGO',
    endDate: '2024-03-15T00:00:00Z',
    difficulty: 'medium' as const,
    tags: ['celebrity', 'impression', 'narration'],
    sampleAudio: 'https://www2.cs.uic.edu/~i101/SoundFiles/BabyElephantWalk60.wav',
    requirements: [
      'Must be at least 30 seconds long',
      'Include natural pauses and timing',
      'Clear audio quality required'
    ],
    engagement: 95,
    trending: true,
    featured: true
  },
  {
    id: '2',
    title: 'Multilingual Song Challenge',
    description: 'Sing the same verse in 3 different languages.',
    creator: {
      id: 'user2',
      displayName: 'Language Master',
      avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=600',
      isVerified: false
    },
    participants: 856,
    submissions: 342,
    reward: '500 ALGO',
    endDate: '2024-03-20T00:00:00Z',
    difficulty: 'hard' as const,
    tags: ['multilingual', 'singing', 'languages'],
    sampleAudio: 'https://www2.cs.uic.edu/~i101/SoundFiles/CantinaBand3.wav',
    requirements: [
      'Must include English, Spanish, and French',
      'Same verse in all languages',
      'Proper pronunciation required'
    ],
    engagement: 88,
    trending: false,
    featured: true
  }
];

export const ChallengePage: React.FC = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isCreatingChallenge, setIsCreatingChallenge] = useState(false);
  const [joiningChallengeId, setJoiningChallengeId] = useState<string | null>(null);
  const [participantFormData, setParticipantFormData] = useState({
    name: '',
    email: '',
    motivation: '',
    experience: '',
    socialMediaHandle: '',
    agreeToTerms: false
  });
  const [challengeFormData, setChallengeFormData] = useState({
    title: '',
    description: '',
    reward: '',
    endDate: '',
    tags: [] as string[],
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    requirements: [] as string[]
  });
  const navigate = useNavigate();

  // Fetch challenges from API
  const fetchChallenges = async (reset = false) => {
    try {
      setIsLoading(true);
      setError(null);
      const currentPage = reset ? 1 : page;
      
      try {
        const response = await challengeAPI.getChallenges(
          filter, 
          currentPage, 
          10, 
          searchQuery
        );
        
        const fetchedChallenges = response.challenges || [];
        const moreAvailable = response.hasMore || false;
        
        if (reset) {
          setChallenges(fetchedChallenges);
          setPage(1);
        } else {
          setChallenges(prev => [...prev, ...fetchedChallenges]);
          setPage(currentPage + 1);
        }
        
        setHasMore(moreAvailable);
      } catch (apiError) {
        console.error('API error, using mock data:', apiError);
        
        // Use mock data as fallback during development
        const filteredMockChallenges = mockChallenges
          .filter(challenge => {
            if (searchQuery && !challenge.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
                !challenge.description.toLowerCase().includes(searchQuery.toLowerCase())) {
              return false;
            }
            
            if (filter === 'trending' && !challenge.trending) return false;
            if (filter === 'featured' && !challenge.featured) return false;
            
            return true;
          })
          .map(challenge => ({
            ...challenge,
            startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
            creatorId: challenge.creator.id,
            isJoined: false
          }));
        
        if (reset) {
          setChallenges(filteredMockChallenges);
          setPage(1);
        } else {
          setChallenges(prev => [...prev, ...filteredMockChallenges]);
          setPage(currentPage + 1);
        }
        
        setHasMore(false); // No more mock data to load
      }
    } catch (err) {
      setError('Failed to load challenges. Please try again.');
      console.error('Error in fetchChallenges:', err);
      
      // Fallback to empty state
      if (reset) {
        setChallenges([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchChallenges(true);
  }, [filter]);

  // Handle search
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchQuery !== undefined) {
        fetchChallenges(true);
      }
    }, 500);

    return () => clearTimeout(delaySearch);
  }, [searchQuery]);

  // Handle challenge creation
  const handleCreateChallenge = async () => {
    try {
      setIsLoading(true);
      const response = await challengeAPI.createChallenge(challengeFormData);
      const newChallenge = response.challenge;
      setChallenges(prev => [newChallenge, ...prev]);
      setIsCreatingChallenge(false);
      setChallengeFormData({
        title: '',
        description: '',
        reward: '',
        endDate: '',
        tags: [],
        difficulty: 'medium',
        requirements: []
      });
    } catch (err) {
      setError('Failed to create challenge. Please try again.');
      console.error('Error creating challenge:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Open join challenge form
  const handleOpenJoinForm = (challengeId: string) => {
    setJoiningChallengeId(challengeId);
    // Reset form data
    setParticipantFormData({
      name: '',
      email: '',
      motivation: '',
      experience: '',
      socialMediaHandle: '',
      agreeToTerms: false
    });
  };

  // Handle joining a challenge
  const handleJoinChallenge = async () => {
    if (!joiningChallengeId) return;
    
    try {
      await challengeAPI.joinChallenge(joiningChallengeId, participantFormData);
      
      // Update challenges state
      setChallenges(prev => 
        prev.map(challenge => 
          challenge.id === joiningChallengeId 
            ? { ...challenge, isJoined: true, participants: challenge.participants + 1 } 
            : challenge
        )
      );
      
      // Close the form
      setJoiningChallengeId(null);
    } catch (err) {
      setError('Failed to join challenge. Please try again.');
      console.error('Error joining challenge:', err);
    }
  };

  // Handle viewing challenge details
  const handleViewChallengeDetails = (challengeId: string) => {
    navigate(`/challenges/${challengeId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Voice Challenges</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Compete, create, and win rewards</p>
          </div>
          <Button 
            className="flex items-center gap-2"
            onClick={() => setIsCreatingChallenge(true)}
          >
            <Plus size={20} />
            Create Challenge
          </Button>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search challenges..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="relative">
            <select
              className="appearance-none pl-4 pr-10 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="trending">Trending</option>
              <option value="featured">Featured</option>
              <option value="newest">Newest</option>
              <option value="ending-soon">Ending Soon</option>
            </select>
            <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Challenge Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading && challenges.length === 0 ? (
            // Loading skeleton
            Array.from({ length: 6 }).map((_, index) => (
              <Card key={`skeleton-${index}`} className="overflow-hidden animate-pulse">
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                      <div>
                        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded mt-2"></div>
                      </div>
                    </div>
                  </div>
                  <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                  <div className="h-20 w-full bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                  <div className="flex justify-between mt-6">
                    <div className="h-10 w-28 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-10 w-28 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                </div>
              </Card>
            ))
          ) : challenges.length === 0 ? (
            <div className="col-span-3 text-center py-12">
              <div className="text-gray-500 dark:text-gray-400 text-lg">
                No challenges found. Try adjusting your search or filter.
              </div>
            </div>
          ) : (
            challenges.map((challenge) => (
              <Card key={challenge.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col h-full">
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Avatar src={challenge.creator.avatar} alt={challenge.creator.displayName} />
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{challenge.creator.displayName}</h3>
                        <p className="text-sm text-gray-500">{challenge.creator.isVerified ? 'Verified Creator' : 'Creator'}</p>
                      </div>
                    </div>
                    <IconButton variant="ghost">
                      <Share2 size={20} />
                    </IconButton>
                  </div>

                  <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white break-words">{challenge.title}</h2>
                  <div 
                    className="text-gray-600 dark:text-gray-400 mb-4 whitespace-pre-wrap break-words" 
                    style={{ 
                      overflowWrap: 'break-word', 
                      wordWrap: 'break-word',
                      hyphens: 'auto',
                      maxWidth: '100%'
                    }}
                  >
                    {challenge.description}
                  </div>

                  <div className="space-y-4 flex-grow">
                    <WaveformVisualizer audioUrl={challenge.sampleAudio} />
                    
                    <div className="flex flex-wrap gap-2">
                      {challenge.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 break-words"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Users size={18} />
                        <span className="break-words">{formatNumber(challenge.participants)} participants</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Trophy size={18} />
                        <span className="break-words">{challenge.reward}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Clock size={18} />
                        <span className="break-words">Ends {new Date(challenge.endDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Star size={18} />
                        <span className="break-words">{challenge.difficulty}</span>
                      </div>
                    </div>
                    
                    {challenge.requirements && challenge.requirements.length > 0 && (
                      <div className="mt-4">
                        <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Requirements:</h3>
                        <ul className="list-disc pl-5 space-y-1">
                          {challenge.requirements.map((req, index) => (
                            <li key={index} className="text-gray-600 dark:text-gray-400 break-words">{req}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 flex justify-center items-center w-full">
                    <Button 
                      className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-2 text-base"
                      onClick={() => handleOpenJoinForm(challenge.id)}
                      disabled={challenge.isJoined}
                    >
                      {challenge.isJoined ? 'Joined' : 'Join the Movement'}
                      {!challenge.isJoined && <ChevronRight size={18} />}
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Load More Button */}
        {hasMore && challenges.length > 0 && (
          <div className="flex justify-center mt-8">
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => fetchChallenges()}
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Load More'}
              {isLoading ? null : <ArrowUp className="rotate-180" size={18} />}
            </Button>
          </div>
        )}
      </div>

      {/* Create Challenge Modal */}
      <AnimatePresence>
        {isCreatingChallenge && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setIsCreatingChallenge(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Create New Challenge</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={challengeFormData.title}
                    onChange={(e) => setChallengeFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter challenge title"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[150px]"
                    value={challengeFormData.description}
                    onChange={(e) => setChallengeFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your challenge in detail - your full description will be displayed on the challenge card"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Reward
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={challengeFormData.reward}
                      onChange={(e) => setChallengeFormData(prev => ({ ...prev, reward: e.target.value }))}
                      placeholder="e.g. 500 ALGO"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={challengeFormData.endDate}
                      onChange={(e) => setChallengeFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. singing, impression, voice acting"
                    onChange={(e) => {
                      const tagsArray = e.target.value.split(',').map(tag => tag.trim()).filter(Boolean);
                      setChallengeFormData(prev => ({ ...prev, tags: tagsArray }));
                    }}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Difficulty
                  </label>
                  <select
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={challengeFormData.difficulty}
                    onChange={(e) => setChallengeFormData(prev => ({ 
                      ...prev, 
                      difficulty: e.target.value as 'easy' | 'medium' | 'hard' 
                    }))}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Requirements (one per line)
                  </label>
                  <textarea
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                    placeholder="Enter requirements, one per line"
                    onChange={(e) => {
                      const requirementsArray = e.target.value.split('\n').map(req => req.trim()).filter(Boolean);
                      setChallengeFormData(prev => ({ ...prev, requirements: requirementsArray }));
                    }}
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreatingChallenge(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateChallenge}
                  disabled={!challengeFormData.title || !challengeFormData.description || !challengeFormData.endDate}
                >
                  Create Challenge
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Join Challenge Modal */}
      <AnimatePresence>
        {joiningChallengeId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setJoiningChallengeId(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Join the Challenge</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Please provide your information to join this challenge. We're excited to see what you create!
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={participantFormData.name}
                    onChange={(e) => setParticipantFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Your full name"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={participantFormData.email}
                    onChange={(e) => setParticipantFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Your email address"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Motivation
                  </label>
                  <textarea
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                    value={participantFormData.motivation}
                    onChange={(e) => setParticipantFormData(prev => ({ ...prev, motivation: e.target.value }))}
                    placeholder="Why do you want to join this challenge?"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Experience
                  </label>
                  <textarea
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                    value={participantFormData.experience}
                    onChange={(e) => setParticipantFormData(prev => ({ ...prev, experience: e.target.value }))}
                    placeholder="Briefly describe your relevant experience"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Social Media Handle
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={participantFormData.socialMediaHandle}
                    onChange={(e) => setParticipantFormData(prev => ({ ...prev, socialMediaHandle: e.target.value }))}
                    placeholder="e.g. @username"
                  />
                </div>
                
                <div className="flex items-start mt-4">
                  <div className="flex items-center h-5">
                    <input
                      id="terms"
                      type="checkbox"
                      className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-blue-300 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-blue-600"
                      checked={participantFormData.agreeToTerms}
                      onChange={(e) => setParticipantFormData(prev => ({ ...prev, agreeToTerms: e.target.checked }))}
                      required
                    />
                  </div>
                  <label htmlFor="terms" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    I agree to the <a href="#" className="text-blue-600 hover:underline dark:text-blue-500">terms and conditions</a> <span className="text-red-500">*</span>
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => setJoiningChallengeId(null)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleJoinChallenge}
                  disabled={!participantFormData.name || !participantFormData.email || !participantFormData.agreeToTerms}
                >
                  Join Challenge
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChallengePage;