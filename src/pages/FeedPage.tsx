import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  TrendingUp,
  Filter,
  Clock,
  Award,
  Sparkles,
  MoreHorizontal,
  Play,
  Pause,
  ChevronDown,
  Zap,
  X
} from 'lucide-react';
import { Avatar } from '../components/ui/Avatar';
import { IconButton } from '../components/ui/IconButton';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { WaveformVisualizer } from '../components/audio/WaveformVisualizer';
import { formatNumber, formatTimeAgo } from '../lib/utils';
import { feedAPI, uploadAPI } from '../lib/api';

const mockPosts = [
  {
    id: '1',
    audioUrl: 'https://www2.cs.uic.edu/~i101/SoundFiles/BabyElephantWalk60.wav',
    caption: 'Just tried the Morgan Freeman voice effect! 🎭 #VoiceAI #Transformation',
    description: 'Check out my attempt at the Morgan Freeman voice. Let me know what you think! 🎙️',
    tags: ['VoiceAI', 'Transformation', 'Celebrity'],
    user: {
      id: 'user1',
      displayName: 'Voice Master',
      username: 'voicemaster',
      avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=600',
      isVerified: true
    },
    createdAt: '2024-02-28T12:00:00Z',
    likes: 1234,
    comments: 89,
    shares: 45,
    isLiked: false,
    isSaved: false,
    isSponsored: false,
    engagement: 95,
    duration: '00:45'
  },
  {
    id: '2',
    audioUrl: 'https://www2.cs.uic.edu/~i101/SoundFiles/CantinaBand3.wav',
    caption: 'Check out my Russian accent transformation! 🇷🇺 #VoiceChallenge',
    description: 'Participated in the weekly accent challenge. Russian edition! 🎭',
    tags: ['VoiceChallenge', 'Accent', 'Russian'],
    user: {
      id: 'user2',
      displayName: 'Audio Explorer',
      username: 'audioexplorer',
      avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=600',
      isVerified: false
    },
    createdAt: '2024-02-28T10:30:00Z',
    likes: 856,
    comments: 34,
    shares: 12,
    isLiked: true,
    isSaved: false,
    isSponsored: true,
    engagement: 87,
    duration: '01:30'
  }
];

interface AudioPostProps {
  post: FeedPost;
  onLike: (postId: string) => void;
  onSave: (postId: string) => void;
  onShare: (postId: string) => void;
  newComment: { [key: string]: string };
  setNewComment: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
  handleSubmitComment: (postId: string) => void;
  isSubmittingComment: boolean;
  postComments: { [key: string]: Comment[] };
  fetchComments: (postId: string) => void;
  handleLikeComment: (commentId: string, postId: string) => void;
}

const AudioPost: React.FC<AudioPostProps> = ({ 
  post, 
  onLike, 
  onSave, 
  onShare,
  newComment,
  setNewComment,
  handleSubmitComment,
  isSubmittingComment,
  postComments,
  fetchComments,
  handleLikeComment
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const postRef = useRef<HTMLDivElement>(null);

  return (
    <motion.div
      ref={postRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      layout
    >
      <Card className="overflow-hidden">
        {/* Post Header */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar
              src={post.user.avatar}
              alt={post.user.displayName}
              size="md"
              isVerified={post.user.isVerified}
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-dark-900 dark:text-white">
                  {post.user.displayName}
                </span>
                {post.isSponsored && (
                  <span className="text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 px-2 py-0.5 rounded-full">
                    Sponsored
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-dark-500 dark:text-dark-400">
                <span>@{post.user.username}</span>
                <span>•</span>
                <span>{formatTimeAgo(post.createdAt)}</span>
              </div>
            </div>
          </div>
          <IconButton
            variant="ghost"
            size="sm"
            icon={<MoreHorizontal className="h-5 w-5" />}
            aria-label="More options"
          />
        </div>

        {/* Post Content */}
        <div className="px-4 pb-4">
          <p className="text-dark-800 dark:text-dark-200 mb-2">
            {isExpanded ? post.description : `${post.description.slice(0, 100)}...`}
            {post.description.length > 100 && (
              <button
                className="text-primary-600 dark:text-primary-400 ml-1 hover:underline"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? 'Show less' : 'Read more'}
              </button>
            )}
          </p>

          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-sm bg-gray-100 dark:bg-dark-800 text-dark-600 dark:text-dark-400 px-2 py-1 rounded-full hover:bg-gray-200 dark:hover:bg-dark-700 cursor-pointer transition-colors"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Audio Player */}
          <div className="bg-gray-50 dark:bg-dark-800/50 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <IconButton
                  variant={isPlaying ? 'accent' : 'primary'}
                  size="sm"
                  icon={isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  onClick={() => setIsPlaying(!isPlaying)}
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                />
                <span className="text-sm font-medium text-dark-600 dark:text-dark-400">
                  {post.duration}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-dark-500 dark:text-dark-400 flex items-center gap-1">
                  <Zap className="h-4 w-4" />
                  {post.engagement}% Match
                </span>
              </div>
            </div>

            <WaveformVisualizer
              audioUrl={post.audioUrl || ''}
              isPlaying={isPlaying}
              onPlayPause={() => setIsPlaying(!isPlaying)}
              height={80}
            />
          </div>

          {/* Interaction Stats */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <button
                className="flex items-center gap-2 text-dark-600 dark:text-dark-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                onClick={() => onLike(post.id)}
              >
                <Heart
                  className={`h-5 w-5 ${
                    post.isLiked ? 'fill-primary-600 text-primary-600 dark:fill-primary-400 dark:text-primary-400' : ''
                  }`}
                />
                <span>{formatNumber(post.likes)}</span>
              </button>
              <button
                className="flex items-center gap-2 text-dark-600 dark:text-dark-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                onClick={() => setShowComments(!showComments)}
              >
                <MessageCircle className="h-5 w-5" />
                <span>{formatNumber(post.comments)}</span>
              </button>
              <button
                className="flex items-center gap-2 text-dark-600 dark:text-dark-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                onClick={() => onShare(post.id)}
              >
                <Share2 className="h-5 w-5" />
                <span>{formatNumber(post.shares)}</span>
              </button>
            </div>
            <IconButton
              variant="ghost"
              size="sm"
              icon={<Bookmark className={post.isSaved ? 'fill-current' : ''} />}
              onClick={() => onSave(post.id)}
              aria-label={post.isSaved ? 'Remove from saved' : 'Save post'}
            />
          </div>
        </div>

        {/* Comments Section */}
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-gray-200 dark:border-dark-700"
            >
              <div className="p-4">
                <div className="flex items-center gap-3 mb-4">
                <Avatar
                size="sm"
                src="https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=600"
                alt="Current user"
                />
                <input
                type="text"
                placeholder="Add a comment..."
                className="flex-1 bg-gray-100 dark:bg-dark-800 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={newComment[post.id] || ''}
                onChange={(e) => setNewComment({...newComment, [post.id]: e.target.value})}
                onKeyPress={(e) => e.key === 'Enter' && handleSubmitComment(post.id)}
                />
                <Button 
                size="sm" 
                onClick={() => handleSubmitComment(post.id)}
                isLoading={isSubmittingComment}
                disabled={isSubmittingComment || !newComment[post.id]?.trim()}
                >
                Post
                </Button>
                </div>
                
                <div className="space-y-4">
                {/* Load comments if not already loaded */}
                {!postComments[post.id] && post.comments > 0 && (
                <div className="text-center py-2">
                <Button 
                variant="ghost" 
                size="sm"
                onClick={() => fetchComments(post.id)}
                >
                Load comments
                </Button>
                </div>
                )}
                
                {/* Display comments */}
                {postComments[post.id]?.length === 0 && (
                <div className="text-center py-2 text-dark-500 dark:text-dark-400 text-sm">
                No comments yet. Be the first to comment!
                </div>
                )}
                
                {postComments[post.id]?.map(comment => (
                <div key={comment.id} className="flex items-start gap-3">
                <Avatar
                size="sm"
                src={comment.user.avatar}
                alt={comment.user.displayName}
                />
                <div>
                <div className="bg-gray-100 dark:bg-dark-800 rounded-xl p-3">
                <div className="font-medium text-dark-900 dark:text-white mb-1">
                {comment.user.displayName}
                {comment.user.isVerified && (
                <span className="inline-block ml-1 text-primary-600 dark:text-primary-400">
                ✓
                </span>
                )}
                </div>
                <p className="text-dark-600 dark:text-dark-400 text-sm">
                {comment.content}
                </p>
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm text-dark-500 dark:text-dark-400">
                <button 
                className={`hover:text-primary-600 dark:hover:text-primary-400 ${
                comment.isLiked ? 'text-primary-600 dark:text-primary-400' : ''
                }`}
                onClick={() => handleLikeComment(comment.id, post.id)}
                >
                {comment.isLiked ? 'Liked' : 'Like'} • {comment.likes}
                </button>
                <button className="hover:text-primary-600 dark:hover:text-primary-400">
                Reply
                </button>
                <span>{formatTimeAgo(comment.createdAt)}</span>
                </div>
                </div>
                </div>
                ))}
                </div>

                <button
                  className="mt-4 text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
                  onClick={() => setShowComments(false)}
                >
                  Hide comments
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
};

// Define interface for feed post
interface FeedPost {
  id: string;
  audioUrl?: string;
  caption: string;
  description?: string;
  tags: string[];
  user: {
    id: string;
    displayName: string;
    username: string;
    avatar: string;
    isVerified: boolean;
  };
  createdAt: string;
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  isSaved: boolean;
  isSponsored: boolean;
  engagement: number;
  duration: string;
  audioFile?: {
    id: string;
    storagePath: string;
    duration: number;
  };
}

// Define interface for comment
interface Comment {
  id: string;
  content: string;
  user: {
    id: string;
    displayName: string;
    username: string;
    avatar: string;
    isVerified: boolean;
  };
  createdAt: string;
  likes: number;
  isLiked: boolean;
}

export const FeedPage = () => {
  const [posts, setPosts] = useState<FeedPost[]>(mockPosts);
  const [filter, setFilter] = useState('trending');
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPostCaption, setNewPostCaption] = useState('');
  const [newPostDescription, setNewPostDescription] = useState('');
  const [newPostTags, setNewPostTags] = useState('');
  const [selectedAudioFile, setSelectedAudioFile] = useState<File | null>(null);
  const [uploadedAudioId, setUploadedAudioId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [postComments, setPostComments] = useState<{ [key: string]: Comment[] }>({});
  const [newComment, setNewComment] = useState<{ [key: string]: string }>({});
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Fetch posts on component mount and when filter changes
  useEffect(() => {
    fetchPosts();
  }, [filter]);

  // Fetch posts from API
  const fetchPosts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await feedAPI.getFeedPosts(filter);
      if (response.status === 'success') {
        // Transform API response to match our FeedPost interface
        const transformedPosts = response.data.map((post: any) => ({
          id: post.id,
          audioUrl: post.audioFile ? `/api/audio/original/${post.audioFile.id}` : undefined,
          caption: post.caption,
          description: post.description || '',
          tags: post.tags || [],
          user: {
            id: post.user.id,
            displayName: post.user.displayName || post.user.username,
            username: post.user.username,
            avatar: post.user.avatar || 'https://via.placeholder.com/150',
            isVerified: post.user.isVerified
          },
          createdAt: post.createdAt,
          likes: post.likes,
          comments: post.comments,
          shares: post.shares,
          isLiked: post.isLiked,
          isSaved: post.isSaved,
          isSponsored: post.isSponsored || false,
          engagement: post.engagement || 85,
          duration: post.audioFile ? `${Math.floor(post.audioFile.duration / 60)}:${String(Math.floor(post.audioFile.duration % 60)).padStart(2, '0')}` : '00:00',
          audioFile: post.audioFile
        }));
        setPosts(transformedPosts);
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Failed to load feed posts. Please try again later.');
      // Use mock data as fallback
      setPosts(mockPosts);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle like action
  const handleLike = async (postId: string) => {
    try {
      const response = await feedAPI.likeFeedPost(postId);
      if (response.status === 'success') {
        setPosts(posts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              isLiked: response.isLiked,
              likes: response.isLiked ? post.likes + 1 : post.likes - 1
            };
          }
          return post;
        }));
      }
    } catch (err) {
      console.error('Error liking post:', err);
      // Fallback to client-side update if API fails
      setPosts(posts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            isLiked: !post.isLiked,
            likes: post.isLiked ? post.likes - 1 : post.likes + 1
          };
        }
        return post;
      }));
    }
  };

  // Handle save action
  const handleSave = async (postId: string) => {
    try {
      const response = await feedAPI.saveFeedPost(postId);
      if (response.status === 'success') {
        setPosts(posts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              isSaved: response.isSaved
            };
          }
          return post;
        }));
      }
    } catch (err) {
      console.error('Error saving post:', err);
      // Fallback to client-side update if API fails
      setPosts(posts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            isSaved: !post.isSaved
          };
        }
        return post;
      }));
    }
  };

  // Handle share action
  const handleShare = async (postId: string) => {
    try {
      const response = await feedAPI.shareFeedPost(postId);
      if (response.status === 'success') {
        // Update share count
        setPosts(posts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              shares: post.shares + 1
            };
          }
          return post;
        }));
        
        // In a real app, you would open a share dialog here
        alert('Post shared successfully!');
      }
    } catch (err) {
      console.error('Error sharing post:', err);
    }
  };
  
  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const audioFile = files[0];
    setSelectedAudioFile(audioFile);
    
    // Upload the file
    setIsUploading(true);
    try {
      const response = await uploadAPI.uploadAudio(audioFile);
      if (response.status === 'success') {
        setUploadedAudioId(response.data.id);
      }
    } catch (err) {
      console.error('Error uploading audio:', err);
      setError('Failed to upload audio file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };
  
  // Handle create post
  const handleCreatePost = async () => {
    if (!uploadedAudioId) {
      setError('Please upload an audio file first.');
      return;
    }
    
    if (!newPostCaption.trim()) {
      setError('Please enter a caption for your post.');
      return;
    }
    
    setIsCreatingPost(true);
    setError(null);
    
    try {
      // Parse tags from input
      const tags = newPostTags.split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
      
      const response = await feedAPI.createFeedPost(
        uploadedAudioId,
        newPostCaption,
        newPostDescription,
        tags
      );
      
      if (response.status === 'success') {
        // Add the new post to the posts list
        const newPost: FeedPost = {
          id: response.data.id,
          audioUrl: response.data.audioFile ? `/api/audio/original/${response.data.audioFile.id}` : undefined,
          caption: response.data.caption,
          description: response.data.description || '',
          tags: response.data.tags || [],
          user: {
            id: response.data.user.id,
            displayName: response.data.user.displayName || response.data.user.username,
            username: response.data.user.username,
            avatar: response.data.user.avatar || 'https://via.placeholder.com/150',
            isVerified: response.data.user.isVerified
          },
          createdAt: response.data.createdAt,
          likes: 0,
          comments: 0,
          shares: 0,
          isLiked: false,
          isSaved: false,
          isSponsored: false,
          engagement: 85,
          duration: response.data.audioFile ? `${Math.floor(response.data.audioFile.duration / 60)}:${String(Math.floor(response.data.audioFile.duration % 60)).padStart(2, '0')}` : '00:00',
          audioFile: response.data.audioFile
        };
        
        setPosts([newPost, ...posts]);
        
        // Reset form
        setNewPostCaption('');
        setNewPostDescription('');
        setNewPostTags('');
        setSelectedAudioFile(null);
        setUploadedAudioId(null);
        setShowCreateModal(false);
      }
    } catch (err) {
      console.error('Error creating post:', err);
      setError('Failed to create post. Please try again.');
    } finally {
      setIsCreatingPost(false);
    }
  };
  
  // Fetch comments for a post
  const fetchComments = async (postId: string) => {
    try {
      const response = await feedAPI.getFeedPostComments(postId);
      if (response.status === 'success') {
        setPostComments({
          ...postComments,
          [postId]: response.data
        });
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
    }
  };
  
  // Handle comment submission
  const handleSubmitComment = async (postId: string) => {
    if (!newComment[postId] || !newComment[postId].trim()) return;
    
    setIsSubmittingComment(true);
    try {
      const response = await feedAPI.addFeedPostComment(postId, newComment[postId]);
      if (response.status === 'success') {
        // Add the new comment to the comments list
        const updatedComments = {
          ...postComments,
          [postId]: [
            response.data,
            ...(postComments[postId] || [])
          ]
        };
        setPostComments(updatedComments);
        
        // Update comment count in the post
        setPosts(posts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              comments: post.comments + 1
            };
          }
          return post;
        }));
        
        // Clear the comment input
        setNewComment({
          ...newComment,
          [postId]: ''
        });
      }
    } catch (err) {
      console.error('Error submitting comment:', err);
    } finally {
      setIsSubmittingComment(false);
    }
  };
  
  // Handle comment like
  const handleLikeComment = async (commentId: string, postId: string) => {
    try {
      const response = await feedAPI.likeComment(commentId);
      if (response.status === 'success') {
        // Update the comment in the comments list
        const updatedComments = {
          ...postComments,
          [postId]: postComments[postId].map(comment => {
            if (comment.id === commentId) {
              return {
                ...comment,
                isLiked: response.isLiked,
                likes: response.isLiked ? comment.likes + 1 : comment.likes - 1
              };
            }
            return comment;
          })
        };
        setPostComments(updatedComments);
      }
    } catch (err) {
      console.error('Error liking comment:', err);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Feed Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-dark-900 dark:text-white mb-2">
              Voice Feed
            </h1>
            <p className="text-dark-600 dark:text-dark-400">
              Discover amazing voice transformations
            </p>
          </div>
          <div className="flex items-center gap-2">
            <IconButton
              variant="outline"
              icon={<Filter className="h-5 w-5" />}
              onClick={() => setShowFilters(!showFilters)}
              aria-label="Show filters"
            />
            <Button
              variant="primary"
              leftIcon={<Sparkles className="h-5 w-5" />}
              onClick={() => setShowCreateModal(true)}
            >
              Create
            </Button>
          </div>
        </div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-6"
            >
              <Card className="p-4">
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={filter === 'trending' ? 'primary' : 'outline'}
                    leftIcon={<TrendingUp className="h-4 w-4" />}
                    onClick={() => setFilter('trending')}
                  >
                    Trending
                  </Button>
                  <Button
                    size="sm"
                    variant={filter === 'latest' ? 'primary' : 'outline'}
                    leftIcon={<Clock className="h-4 w-4" />}
                    onClick={() => setFilter('latest')}
                  >
                    Latest
                  </Button>
                  <Button
                    size="sm"
                    variant={filter === 'following' ? 'primary' : 'outline'}
                    leftIcon={<Award className="h-4 w-4" />}
                    onClick={() => setFilter('following')}
                  >
                    Following
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        )}
        
        {/* Error message */}
        {error && (
          <Card className="p-4 mb-6 bg-error-50 dark:bg-error-900/30 border border-error-200 dark:border-error-800">
            <p className="text-error-700 dark:text-error-400">{error}</p>
          </Card>
        )}
        
        {/* Posts */}
        <div className="space-y-6">
          <AnimatePresence>
            {posts.map(post => (
              <AudioPost
                key={post.id}
                post={post}
                onLike={handleLike}
                onSave={handleSave}
                onShare={handleShare}
                newComment={newComment}
                setNewComment={setNewComment}
                handleSubmitComment={handleSubmitComment}
                isSubmittingComment={isSubmittingComment}
                postComments={postComments}
                fetchComments={fetchComments}
                handleLikeComment={handleLikeComment}
              />
            ))}
          </AnimatePresence>
        </div>
        
        {/* Create Post Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-lg">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-display font-bold">Create New Post</h2>
                  <IconButton
                    variant="ghost"
                    icon={<X className="h-5 w-5" />}
                    onClick={() => setShowCreateModal(false)}
                    aria-label="Close"
                  />
                </div>
                
                {/* Audio Upload */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                    Audio File
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="audio-upload"
                    />
                    <label
                      htmlFor="audio-upload"
                      className="flex-1 cursor-pointer border-2 border-dashed border-gray-300 dark:border-dark-600 rounded-lg p-4 text-center hover:border-primary-500 dark:hover:border-primary-400 transition-colors"
                    >
                      {selectedAudioFile ? (
                        <div className="text-primary-600 dark:text-primary-400">
                          {selectedAudioFile.name}
                        </div>
                      ) : (
                        <div className="text-dark-500 dark:text-dark-400">
                          Click to upload audio file
                        </div>
                      )}
                    </label>
                    {isUploading && (
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-600"></div>
                    )}
                  </div>
                </div>
                
                {/* Caption */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                    Caption
                  </label>
                  <input
                    type="text"
                    value={newPostCaption}
                    onChange={(e) => setNewPostCaption(e.target.value)}
                    className="w-full p-3 bg-gray-100 dark:bg-dark-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Add a caption for your post"
                  />
                </div>
                
                {/* Description */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                    Description (optional)
                  </label>
                  <textarea
                    value={newPostDescription}
                    onChange={(e) => setNewPostDescription(e.target.value)}
                    className="w-full p-3 bg-gray-100 dark:bg-dark-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[100px]"
                    placeholder="Add a description for your post"
                  />
                </div>
                
                {/* Tags */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={newPostTags}
                    onChange={(e) => setNewPostTags(e.target.value)}
                    className="w-full p-3 bg-gray-100 dark:bg-dark-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="VoiceAI, Transformation, Celebrity"
                  />
                </div>
                
                {/* Submit Button */}
                <Button
                  variant="primary"
                  fullWidth
                  onClick={handleCreatePost}
                  isLoading={isCreatingPost}
                  disabled={isCreatingPost || isUploading || !uploadedAudioId || !newPostCaption.trim()}
                >
                  Create Post
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};