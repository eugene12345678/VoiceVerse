import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useInView } from 'react-intersection-observer';
import {
  Play,
  Pause,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Volume2,
  VolumeX,
  MoreHorizontal,
 
  Music,
  Wand2,
  X,
  
  UserPlus,
  UserMinus,
  Grid3X3,
  
  
  MessageSquare,
  Link as LinkIcon,
  Copy
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { IconButton } from '../components/ui/IconButton';
import { Avatar } from '../components/ui/Avatar';
import { formatNumber, formatTimeAgo } from '../lib/utils';
import { voicesAPI } from '../lib/api/voices';

// Types
interface VoicePost {
  id: string;
  audioUrl: string;
  waveformData?: number[];
  duration: number;
  title: string;
  caption?: string;
  tags: string[];
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string;
    isVerified: boolean;
    followerCount: number;
    followingCount: number;
    bio?: string;
    postsCount: number;
  };
  createdAt: string;
  stats: {
    plays: number;
    likes: number;
    comments: number;
    shares: number;
  };
  userInteractions: {
    isLiked: boolean;
    isSaved: boolean;
    isFollowing: boolean;
  };
  voiceEffect?: {
    name: string;
    category: string;
    description: string;
  };
}

interface Comment {
  id: string;
  content: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string;
    isVerified: boolean;
  };
  createdAt: string;
  likes: number;
  isLiked: boolean;
}

interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  isVerified: boolean;
  bio?: string;
  followerCount: number;
  followingCount: number;
  postsCount: number;
  userInteractions?: {
    isFollowing: boolean;
  };
  posts?: VoicePost[];
}

// Mock data
const mockPosts: VoicePost[] = [
  {
    id: '1',
    audioUrl: '/sound-design-elements-sfx-ps-022-302865.mp3',
    duration: 30,
    title: 'Morgan Freeman Impression',
    caption: 'My best Morgan Freeman voice! 🎭 #voiceacting #impression',
    tags: ['voiceacting', 'impression', 'morgan'],
    user: {
      id: 'user1',
      username: 'voicemaster',
      displayName: 'Voice Master',
      avatarUrl: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=600',
      isVerified: true,
      followerCount: 50000,
      followingCount: 1200,
      bio: 'Professional voice actor & impressionist. 10+ years experience. Available for hire! 🎙️',
      postsCount: 145
    },
    createdAt: '2024-03-01T12:00:00Z',
    stats: {
      plays: 150000,
      likes: 75000,
      comments: 1200,
      shares: 500
    },
    userInteractions: {
      isLiked: false,
      isSaved: false,
      isFollowing: false
    },
    voiceEffect: {
      name: 'Morgan Freeman',
      category: 'Celebrity',
      description: 'Deep, resonant narration style'
    }
  },
  {
    id: '2',
    audioUrl: '/reliable-safe-327618.mp3',
    duration: 45,
    title: 'Russian Accent Challenge',
    caption: 'Trying out the Russian accent! How did I do? 🇷🇺 #accent #voice',
    tags: ['accent', 'voice', 'russian'],
    user: {
      id: 'user2',
      username: 'accentmaster',
      displayName: 'Accent Master',
      avatarUrl: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=600',
      isVerified: false,
      followerCount: 25000,
      followingCount: 800,
      bio: 'Teaching accents from around the world 🌍 DM for lessons!',
      postsCount: 89
    },
    createdAt: '2024-03-01T10:30:00Z',
    stats: {
      plays: 80000,
      likes: 35000,
      comments: 800,
      shares: 300
    },
    userInteractions: {
      isLiked: true,
      isSaved: false,
      isFollowing: true
    },
    voiceEffect: {
      name: 'Russian Accent',
      category: 'Accent',
      description: 'Authentic Russian accent transformation'
    }
  },
  {
    id: '3',
    audioUrl: '/funny-evil-cartoon-voice-with-laugh-14623.mp3',
    duration: 25,
    title: 'Evil Cartoon Villain',
    caption: 'Muhahaha! My evil cartoon voice is complete! 😈 #cartoon #villain #evil',
    tags: ['cartoon', 'villain', 'evil', 'funny'],
    user: {
      id: 'user3',
      username: 'cartoonvoices',
      displayName: 'Cartoon Voices',
      avatarUrl: 'https://images.pexels.com/photos/1181519/pexels-photo-1181519.jpeg?auto=compress&cs=tinysrgb&w=600',
      isVerified: false,
      followerCount: 12000,
      followingCount: 500,
      bio: 'Bringing cartoons to life with my voice! 🎨🎤',
      postsCount: 67
    },
    createdAt: '2024-03-01T09:15:00Z',
    stats: {
      plays: 45000,
      likes: 18000,
      comments: 300,
      shares: 150
    },
    userInteractions: {
      isLiked: false,
      isSaved: true,
      isFollowing: false
    },
    voiceEffect: {
      name: 'Evil Cartoon',
      category: 'Character',
      description: 'Comically sinister cartoon villain voice'
    }
  },
  {
    id: '4',
    audioUrl: '/horror-voice-flashbacks-14469.mp3',
    duration: 60,
    title: 'Horror Flashback',
    caption: 'That night... the memories still haunt me 😰 #horror #flashback #scary',
    tags: ['horror', 'flashback', 'scary', 'dramatic'],
    user: {
      id: 'user4',
      username: 'horrorvoice',
      displayName: 'Horror Voice',
      avatarUrl: 'https://images.pexels.com/photos/1379636/pexels-photo-1379636.jpeg?auto=compress&cs=tinysrgb&w=600',
      isVerified: true,
      followerCount: 78000,
      followingCount: 300,
      bio: 'Spine-chilling voices for your nightmares 🎭💀',
      postsCount: 234
    },
    createdAt: '2024-02-29T18:45:00Z',
    stats: {
      plays: 120000,
      likes: 45000,
      comments: 890,
      shares: 400
    },
    userInteractions: {
      isLiked: true,
      isSaved: true,
      isFollowing: true
    },
    voiceEffect: {
      name: 'Horror Flashback',
      category: 'Cinematic',
      description: 'Haunting, traumatic memory voice effect'
    }
  },
  {
    id: '5',
    audioUrl: '/medieval-gamer-voice-donx27t-forget-to-subscribe-226581.mp3',
    duration: 35,
    title: 'Gamer Voice',
    caption: 'What\'s up gamers! Don\'t forget to like and subscribe! 🎮 #gaming #youtube #subscribe',
    tags: ['gaming', 'youtube', 'subscribe', 'energetic'],
    user: {
      id: 'user5',
      username: 'gamingvoice',
      displayName: 'Gaming Voice',
      avatarUrl: 'https://images.pexels.com/photos/1181263/pexels-photo-1181263.jpeg?auto=compress&cs=tinysrgb&w=600',
      isVerified: false,
      followerCount: 35000,
      followingCount: 1500,
      bio: 'Professional gaming content creator voice 🎮🎙️',
      postsCount: 156
    },
    createdAt: '2024-02-29T15:20:00Z',
    stats: {
      plays: 95000,
      likes: 28000,
      comments: 650,
      shares: 320
    },
    userInteractions: {
      isLiked: false,
      isSaved: false,
      isFollowing: false
    },
    voiceEffect: {
      name: 'Gaming YouTuber',
      category: 'Content Creator',
      description: 'High-energy gaming content voice'
    }
  },
  {
    id: '6',
    audioUrl: '/medieval-gamer-voice-wisdom-will-come-my-friend-226577.mp3',
    duration: 40,
    title: 'Ancient Wisdom',
    caption: 'Patience, young one. Wisdom will come, my friend 🧙‍♂️ #wisdom #mentor #ancient',
    tags: ['wisdom', 'mentor', 'ancient', 'sage'],
    user: {
      id: 'user6',
      username: 'wisevoice',
      displayName: 'Wise Voice',
      avatarUrl: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=600',
      isVerified: true,
      followerCount: 67000,
      followingCount: 200,
      bio: 'Ancient wisdom through voice 🧙‍♂️✨',
      postsCount: 89
    },
    createdAt: '2024-02-29T11:30:00Z',
    stats: {
      plays: 85000,
      likes: 42000,
      comments: 520,
      shares: 280
    },
    userInteractions: {
      isLiked: true,
      isSaved: false,
      isFollowing: false
    },
    voiceEffect: {
      name: 'Ancient Sage',
      category: 'Fantasy',
      description: 'Wise, ancient mentor voice'
    }
  },
  {
    id: '7',
    audioUrl: '/medieval-gamer-voice-protect-us-at-all-costs-the-future-with-you-226590.mp3',
    duration: 50,
    title: 'Protective Guardian',
    caption: 'We must protect them at all costs. The future depends on you! 🛡️ #guardian #protect #future',
    tags: ['guardian', 'protect', 'future', 'heroic'],
    user: {
      id: 'user7',
      username: 'herovoice',
      displayName: 'Hero Voice',
      avatarUrl: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=600',
      isVerified: false,
      followerCount: 29000,
      followingCount: 800,
      bio: 'Heroic voices for epic moments 🦸‍♂️🎭',
      postsCount: 112
    },
    createdAt: '2024-02-28T20:10:00Z',
    stats: {
      plays: 72000,
      likes: 31000,
      comments: 450,
      shares: 200
    },
    userInteractions: {
      isLiked: false,
      isSaved: true,
      isFollowing: true
    },
    voiceEffect: {
      name: 'Guardian Hero',
      category: 'Heroic',
      description: 'Noble protector voice with determination'
    }
  },
  {
    id: '8',
    audioUrl: '/reliable-safe-327618.mp3',
    duration: 30,
    title: 'Battle Cry',
    caption: 'To battle! For honor and glory! ⚔️ #battle #warrior #medieval',
    tags: ['battle', 'warrior', 'medieval', 'epic'],
    user: {
      id: 'user8',
      username: 'battlevoice',
      displayName: 'Battle Voice',
      avatarUrl: 'https://images.pexels.com/photos/1468379/pexels-photo-1468379.jpeg?auto=compress&cs=tinysrgb&w=600',
      isVerified: false,
      followerCount: 18000,
      followingCount: 600,
      bio: 'Epic battle voices and war cries ⚔️🎙️',
      postsCount: 76
    },
    createdAt: '2024-02-28T16:45:00Z',
    stats: {
      plays: 55000,
      likes: 22000,
      comments: 380,
      shares: 150
    },
    userInteractions: {
      isLiked: true,
      isSaved: false,
      isFollowing: false
    },
    voiceEffect: {
      name: 'Battle Warrior',
      category: 'Epic',
      description: 'Fierce warrior battle cry voice'
    }
  },
  {
    id: '9',
    audioUrl: '/knight-spawn-97118.mp3',
    duration: 38,
    title: 'Knight Spawn',
    caption: 'A knight has spawned! Ready for the quest! 🏰 #knight #spawn #fantasy',
    tags: ['knight', 'spawn', 'fantasy', 'rpg'],
    user: {
      id: 'user9',
      username: 'fantasyvoice',
      displayName: 'Fantasy Voice',
      avatarUrl: 'https://images.pexels.com/photos/1559486/pexels-photo-1559486.jpeg?auto=compress&cs=tinysrgb&w=600',
      isVerified: true,
      followerCount: 41000,
      followingCount: 400,
      bio: 'Fantasy RPG voices and characters 🏰🎭',
      postsCount: 198
    },
    createdAt: '2024-02-28T14:20:00Z',
    stats: {
      plays: 63000,
      likes: 26000,
      comments: 420,
      shares: 180
    },
    userInteractions: {
      isLiked: false,
      isSaved: false,
      isFollowing: true
    },
    voiceEffect: {
      name: 'Noble Knight',
      category: 'Fantasy',
      description: 'Chivalrous knight character voice'
    }
  },
  {
    id: '10',
    audioUrl: '/male-voice-bum-bum-104098.mp3',
    duration: 20,
    title: 'Male Voice Bum Bum',
    caption: 'Bum bum bum! Deep male voice vibes 🎵 #male #voice #beat',
    tags: ['male', 'voice', 'beat', 'rhythm'],
    user: {
      id: 'user10',
      username: 'deepvoice',
      displayName: 'Deep Voice',
      avatarUrl: 'https://images.pexels.com/photos/1379636/pexels-photo-1379636.jpeg?auto=compress&cs=tinysrgb&w=600',
      isVerified: false,
      followerCount: 15000,
      followingCount: 300,
      bio: 'Deep male voices and vocal percussion 🎤🥁',
      postsCount: 54
    },
    createdAt: '2024-02-28T12:00:00Z',
    stats: {
      plays: 38000,
      likes: 15000,
      comments: 220,
      shares: 90
    },
    userInteractions: {
      isLiked: false,
      isSaved: false,
      isFollowing: false
    },
    voiceEffect: {
      name: 'Deep Bass',
      category: 'Vocal',
      description: 'Rich, deep male voice with rhythm'
    }
  },
  {
    id: '11',
    audioUrl: '/medieval-gamer-voice-darkness-hunts-us-what-youx27ve-learned-stay-226596.mp3',
    duration: 55,
    title: 'Darkness Hunts',
    caption: 'The darkness hunts us... Use what you\'ve learned and stay the course 🌑 #darkness #survival #determination',
    tags: ['darkness', 'survival', 'determination', 'dramatic'],
    user: {
      id: 'user11',
      username: 'darkvoice',
      displayName: 'Dark Voice',
      avatarUrl: 'https://images.pexels.com/photos/1181519/pexels-photo-1181519.jpeg?auto=compress&cs=tinysrgb&w=600',
      isVerified: true,
      followerCount: 52000,
      followingCount: 250,
      bio: 'Dark, atmospheric voices for intense moments 🌑🎭',
      postsCount: 143
    },
    createdAt: '2024-02-27T19:30:00Z',
    stats: {
      plays: 89000,
      likes: 38000,
      comments: 670,
      shares: 290
    },
    userInteractions: {
      isLiked: true,
      isSaved: true,
      isFollowing: false
    },
    voiceEffect: {
      name: 'Dark Survivor',
      category: 'Thriller',
      description: 'Intense, survival-focused dark voice'
    }
  }
];

interface VoicePostProps {
  post: VoicePost;
  isActive: boolean;
  onLike: (postId: string) => void;
  onSave: (postId: string) => void;
  onShare: (postId: string) => void;
  onFollow: (userId: string) => void;
  onOpenComments: (postId: string) => void;
  onOpenProfile: (user: VoicePost['user']) => void;
}

const VoicePost: React.FC<VoicePostProps> = ({
  post,
  isActive,
  onLike,
  onSave,
  onShare,
  onFollow,
  onOpenComments,
  onOpenProfile
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [doubleTapLike, setDoubleTapLike] = useState(false);
  const tapTimeout = useRef<NodeJS.Timeout>();
  const lastTap = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const { ref, inView } = useInView({
    threshold: 0.7,
    triggerOnce: false
  });

  // Handle auto-play when post is in view
  useEffect(() => {
    if (inView && isActive) {
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  }, [inView, isActive]);

  // Load audio source
  useEffect(() => {
    if (audioRef.current && post.audioUrl) {
      // Set the audio source directly without fallbacks to ensure we play the correct audio
      audioRef.current.src = post.audioUrl;
      audioRef.current.load();
      
      console.log('Loading audio from URL:', post.audioUrl);
    }
  }, [post.audioUrl]);

  // Audio control effects
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        // Make sure the audio is loaded before playing
        if (audioRef.current.readyState === 0) {
          audioRef.current.load();
        }
        
        // Add a small delay before playing to ensure the audio is ready
        const playPromise = setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.play().catch(error => {
              console.error('Error playing audio:', error);
              setIsPlaying(false);
            });
          }
        }, 100);
        
        return () => clearTimeout(playPromise);
      } else {
        if (audioRef.current.paused === false) {
          audioRef.current.pause();
        }
      }
    }
  }, [isPlaying, post.audioUrl]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (audioRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const newTime = (clickX / rect.width) * post.duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleTap = (e: React.MouseEvent) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (lastTap.current && (now - lastTap.current) < DOUBLE_TAP_DELAY) {
      // Double tap detected
      clearTimeout(tapTimeout.current);
      setDoubleTapLike(true);
      onLike(post.id);
      setTimeout(() => setDoubleTapLike(false), 1000);
    } else {
      // Single tap
      tapTimeout.current = setTimeout(() => {
        setIsPlaying(!isPlaying);
      }, DOUBLE_TAP_DELAY);
    }

    lastTap.current = now;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      ref={ref}
      className="relative h-screen w-full snap-start bg-gradient-to-br from-dark-900 to-dark-950"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
        preload="metadata"
        src={post.audioUrl}
      >
        {/* Error message for browsers that don't support audio */}
        Your browser does not support the audio element.
      </audio>

      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/50" />

      {/* Main content container */}
      <div className="relative h-full flex items-center justify-center p-4 group" onClick={handleTap}>
        {/* Voice effect indicator */}
        {post.voiceEffect && (
          <motion.div
            className="absolute top-20 left-4 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-4 py-2"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Wand2 className="h-4 w-4 text-primary-400" />
            <span className="text-white text-sm font-medium">{post.voiceEffect.name}</span>
          </motion.div>
        )}

        {/* Audio visualization */}
        <div className="w-full max-w-2xl">
          <div className="bg-dark-800/50 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center justify-center h-[200px]">
              <div className={`flex items-center justify-center w-full h-full ${isPlaying ? 'animate-pulse' : ''}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-16 bg-white/60 rounded-full ${isPlaying ? 'animate-[bounce_1s_infinite]' : ''}`} style={{ animationDelay: '0ms' }}></div>
                  <div className={`w-2 h-32 bg-white/70 rounded-full ${isPlaying ? 'animate-[bounce_1s_infinite]' : ''}`} style={{ animationDelay: '150ms' }}></div>
                  <div className={`w-2 h-24 bg-white/80 rounded-full ${isPlaying ? 'animate-[bounce_1s_infinite]' : ''}`} style={{ animationDelay: '300ms' }}></div>
                  <div className={`w-2 h-48 bg-white rounded-full ${isPlaying ? 'animate-[bounce_1s_infinite]' : ''}`} style={{ animationDelay: '450ms' }}></div>
                  <div className={`w-2 h-32 bg-white/80 rounded-full ${isPlaying ? 'animate-[bounce_1s_infinite]' : ''}`} style={{ animationDelay: '600ms' }}></div>
                  <div className={`w-2 h-24 bg-white/70 rounded-full ${isPlaying ? 'animate-[bounce_1s_infinite]' : ''}`} style={{ animationDelay: '750ms' }}></div>
                  <div className={`w-2 h-16 bg-white/60 rounded-full ${isPlaying ? 'animate-[bounce_1s_infinite]' : ''}`} style={{ animationDelay: '900ms' }}></div>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-center">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPlaying(!isPlaying);
                }}
                className="w-12 h-12 rounded-full bg-primary-500 text-white hover:bg-primary-600 flex items-center justify-center transition-colors"
              >
                {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Double tap like animation */}
        <AnimatePresence>
          {doubleTapLike && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1.5, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Heart className="h-32 w-32 text-primary-500 fill-current" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* User info overlay */}
        <div className="absolute bottom-32 left-4 right-20">
          <div className="flex items-start gap-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenProfile(post.user);
              }}
              className="flex-shrink-0"
            >
              <Avatar
                src={post.user.avatarUrl}
                alt={post.user.displayName}
                size="lg"
                isVerified={post.user.isVerified}
              />
            </button>
            <div className="flex-1 min-w-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenProfile(post.user);
                }}
                className="text-left"
              >
                <h2 className="text-xl font-semibold text-white truncate">
                  {post.user.displayName}
                </h2>
                <p className="text-white/80 text-sm truncate">
                  @{post.user.username}
                </p>
              </button>
              <p className="text-white/90 text-base mt-2 font-medium">
                {post.title}
              </p>
              <p className="text-white/70 text-sm mt-1">
                {post.caption}
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {post.tags.map(tag => (
                  <span
                    key={tag}
                    className="text-primary-400 text-sm hover:text-primary-300 cursor-pointer"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right sidebar actions */}
        <div className="absolute right-4 bottom-32 flex flex-col items-center gap-6">
          <div className="flex flex-col items-center gap-2">
            <IconButton
              variant={post.userInteractions.isLiked ? 'primary' : 'ghost'}
              icon={<Heart className={post.userInteractions.isLiked ? 'fill-current' : ''} />}
              onClick={(e) => {
                e.stopPropagation();
                onLike(post.id);
              }}
              aria-label="Like"
            />
            <span className="text-white text-sm">
              {formatNumber(post.stats.likes)}
            </span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <IconButton
              variant="ghost"
              icon={<MessageCircle />}
              onClick={(e) => {
                e.stopPropagation();
                onOpenComments(post.id);
              }}
              aria-label="Comments"
            />
            <span className="text-white text-sm">
              {formatNumber(post.stats.comments)}
            </span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <IconButton
              variant="ghost"
              icon={<Share2 />}
              onClick={(e) => {
                e.stopPropagation();
                onShare(post.id);
              }}
              aria-label="Share"
            />
            <span className="text-white text-sm">
              {formatNumber(post.stats.shares)}
            </span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <IconButton
              variant={post.userInteractions.isSaved ? 'primary' : 'ghost'}
              icon={<Bookmark className={post.userInteractions.isSaved ? 'fill-current' : ''} />}
              onClick={(e) => {
                e.stopPropagation();
                onSave(post.id);
              }}
              aria-label="Save"
            />
          </div>

          <div className="flex flex-col items-center gap-2">
            <IconButton
              variant={post.userInteractions.isFollowing ? 'primary' : 'ghost'}
              icon={post.userInteractions.isFollowing ? <UserMinus /> : <UserPlus />}
              onClick={(e) => {
                e.stopPropagation();
                onFollow(post.user.id);
              }}
              aria-label={post.userInteractions.isFollowing ? 'Unfollow' : 'Follow'}
            />
          </div>
        </div>

        {/* Progress bar - hidden by default, visible on hover */}
        <div className="absolute bottom-16 left-4 right-4">
          <div 
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out p-4"
          >
            <div className="flex items-center gap-4 mb-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPlaying(!isPlaying);
                }}
                className="w-10 h-10 rounded-full text-white hover:text-white/80 flex items-center justify-center transition-colors"
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
              </button>
              
              <div className="flex-1">
                <div
                  className="h-2 bg-white/20 rounded-full cursor-pointer"
                  onClick={handleSeek}
                >
                  <div
                    className="h-full bg-white rounded-full transition-all duration-100"
                    style={{
                      width: `${(currentTime / post.duration) * 100}%`
                    }}
                  />
                </div>
              </div>

              <div className="text-white text-sm font-medium">
                {formatDuration(Math.floor(currentTime))} / {formatDuration(post.duration)}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMuted(!isMuted);
                }}
                className="w-10 h-10 rounded-full text-white hover:text-white/80 flex items-center justify-center transition-colors"
              >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-white/60 text-xs">
                {formatTimeAgo(post.createdAt)}
              </div>
              
              <select
                value={playbackRate}
                onChange={(e) => {
                  e.stopPropagation();
                  setPlaybackRate(Number(e.target.value));
                }}
                className="bg-transparent text-white text-xs border-none rounded px-2 py-1"
                onClick={(e) => e.stopPropagation()}
              >
                <option value={0.5}>0.5x</option>
                <option value={1}>1x</option>
                <option value={1.5}>1.5x</option>
                <option value={2}>2x</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};


// Comments Panel Component
const CommentsPanel: React.FC<{
  postId: string | null;
  isOpen: boolean;
  onClose: () => void;
  comments: Comment[];
  onAddComment: (postId: string, content: string) => void;
  onLikeComment: (commentId: string) => void;
}> = ({ postId, isOpen, onClose, comments, onAddComment, onLikeComment }) => {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !postId) return;

    setIsSubmitting(true);
    await onAddComment(postId, newComment.trim());
    setNewComment('');
    setIsSubmitting(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Comments Panel */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 bg-white dark:bg-dark-900 rounded-t-3xl z-50 max-h-[70vh] overflow-hidden"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-dark-900 dark:text-white">
                  Comments
                </h3>
                <IconButton
                  variant="ghost"
                  size="sm"
                  icon={<X />}
                  onClick={onClose}
                  aria-label="Close"
                />
              </div>

              {/* Comment Input */}
              <form onSubmit={handleSubmit} className="flex items-center gap-3 mb-4">
                <Avatar
                  size="sm"
                  src="https://images.pexels.com/photos/1382731/pexels-photo-1382731.jpeg?auto=compress&cs=tinysrgb&w=600"
                  alt="You"
                />
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 bg-gray-100 dark:bg-dark-800 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <Button
                  type="submit"
                  size="sm"
                  isLoading={isSubmitting}
                  disabled={!newComment.trim() || isSubmitting}
                >
                  Post
                </Button>
              </form>

              {/* Comments List */}
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {comments.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-dark-500 dark:text-dark-400">
                    <MessageSquare className="h-12 w-12 mb-2 opacity-50" />
                    <p className="text-sm">No comments yet. Be the first to comment!</p>
                  </div>
                )}
                
                {comments.map(comment => (
                  <div key={comment.id} className="flex items-start gap-3">
                    <Avatar
                      size="sm"
                      src={comment.user.avatarUrl}
                      alt={comment.user.displayName}
                    />
                    <div className="flex-1">
                      <div className="bg-gray-100 dark:bg-dark-800 rounded-2xl px-3 py-2">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm text-dark-900 dark:text-white">
                            {comment.user.displayName}
                          </span>
                          {comment.user.isVerified && (
                            <span className="text-primary-500 text-xs">✓</span>
                          )}
                        </div>
                        <p className="text-sm text-dark-700 dark:text-dark-300">
                          {comment.content}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-dark-500 dark:text-dark-400">
                        <span>{formatTimeAgo(comment.createdAt)}</span>
                        <button 
                          className={`flex items-center gap-1 hover:text-primary-500 ${
                            comment.isLiked ? 'text-primary-500' : ''
                          }`}
                          onClick={() => onLikeComment(comment.id)}
                        >
                          <Heart className={`h-3 w-3 ${comment.isLiked ? 'fill-current' : ''}`} />
                          <span>{formatNumber(comment.likes)}</span>
                        </button>
                        <button className="hover:text-primary-500">Reply</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// User Profile Panel Component
const UserProfilePanel: React.FC<{
  user: UserProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onFollow: (userId: string) => void;
}> = ({ user, isOpen, onClose, onFollow }) => {
  const [activeTab, setActiveTab] = useState('posts');
  
  if (!user) return null;
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Profile Panel */}
          <motion.div
            className="fixed inset-0 bg-white dark:bg-dark-900 z-50 overflow-y-auto"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="relative">
              {/* Header */}
              <div className="sticky top-0 z-10 bg-white dark:bg-dark-900 border-b border-gray-200 dark:border-dark-800">
                <div className="flex items-center justify-between p-4">
                  <IconButton
                    variant="ghost"
                    size="sm"
                    icon={<X />}
                    onClick={onClose}
                    aria-label="Close"
                  />
                  <h3 className="text-lg font-semibold text-dark-900 dark:text-white">
                    Profile
                  </h3>
                  <div className="w-8 h-8" /> {/* Spacer for alignment */}
                </div>
              </div>
              
              {/* Profile Info */}
              <div className="p-4">
                <div className="flex items-start gap-4">
                  <Avatar
                    src={user.avatarUrl}
                    alt={user.displayName}
                    size="xl"
                    isVerified={user.isVerified}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-dark-900 dark:text-white">
                        {user.displayName}
                      </h2>
                    </div>
                    <p className="text-dark-600 dark:text-dark-400">@{user.username}</p>
                    
                    <div className="flex items-center gap-4 mt-4">
                      <Button
                        size="sm"
                        variant={user.userInteractions?.isFollowing ? 'outline' : 'primary'}
                        onClick={() => onFollow(user.id)}
                        leftIcon={user.userInteractions?.isFollowing ? <UserMinus /> : <UserPlus />}
                      >
                        {user.userInteractions?.isFollowing ? 'Unfollow' : 'Follow'}
                      </Button>
                      
                      <IconButton
                        variant="ghost"
                        size="sm"
                        icon={<MessageCircle />}
                        aria-label="Message"
                      />
                      
                      <IconButton
                        variant="ghost"
                        size="sm"
                        icon={<Share2 />}
                        aria-label="Share profile"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Bio */}
                {user.bio && (
                  <p className="mt-4 text-dark-700 dark:text-dark-300">
                    {user.bio}
                  </p>
                )}
                
                {/* Stats */}
                <div className="flex items-center justify-around mt-6 border-y border-gray-200 dark:border-dark-800 py-4">
                  <div className="flex flex-col items-center">
                    <span className="text-xl font-bold text-dark-900 dark:text-white">
                      {formatNumber(user.postsCount)}
                    </span>
                    <span className="text-sm text-dark-600 dark:text-dark-400">Posts</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-xl font-bold text-dark-900 dark:text-white">
                      {formatNumber(user.followerCount)}
                    </span>
                    <span className="text-sm text-dark-600 dark:text-dark-400">Followers</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-xl font-bold text-dark-900 dark:text-white">
                      {formatNumber(user.followingCount)}
                    </span>
                    <span className="text-sm text-dark-600 dark:text-dark-400">Following</span>
                  </div>
                </div>
                
                {/* Tabs */}
                <div className="flex items-center border-b border-gray-200 dark:border-dark-800 mt-4">
                  <button
                    className={`flex-1 py-3 text-center font-medium ${
                      activeTab === 'posts'
                        ? 'text-primary-500 border-b-2 border-primary-500'
                        : 'text-dark-600 dark:text-dark-400'
                    }`}
                    onClick={() => setActiveTab('posts')}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Grid3X3 className="h-4 w-4" />
                      <span>Posts</span>
                    </div>
                  </button>
                  <button
                    className={`flex-1 py-3 text-center font-medium ${
                      activeTab === 'liked'
                        ? 'text-primary-500 border-b-2 border-primary-500'
                        : 'text-dark-600 dark:text-dark-400'
                    }`}
                    onClick={() => setActiveTab('liked')}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Heart className="h-4 w-4" />
                      <span>Liked</span>
                    </div>
                  </button>
                </div>
                
                {/* Content */}
                <div className="mt-4 grid grid-cols-3 gap-1">
                  {user.posts ? (
                    user.posts.map(post => (
                      <div key={post.id} className="aspect-square bg-dark-800 rounded-md overflow-hidden">
                        <div className="w-full h-full flex items-center justify-center relative group">
                          <Music className="h-8 w-8 text-dark-400 group-hover:opacity-0 transition-opacity" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="flex items-center gap-3 text-white">
                              <div className="flex items-center gap-1">
                                <Heart className="h-4 w-4" />
                                <span className="text-sm">{formatNumber(post.stats?.likes || 0)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MessageCircle className="h-4 w-4" />
                                <span className="text-sm">{formatNumber(post.stats?.comments || 0)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    Array.from({ length: 9 }).map((_, i) => (
                      <div key={i} className="aspect-square bg-gray-200 dark:bg-dark-800 rounded-md overflow-hidden">
                        <div className="w-full h-full flex items-center justify-center">
                          <Music className="h-8 w-8 text-dark-400" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Share Panel Component
const SharePanel: React.FC<{
  postId: string | null;
  isOpen: boolean;
  onClose: () => void;
}> = ({ postId, isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  
  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}/voices/${postId}`;
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
      });
  };
  
  const handleShare = (platform: string) => {
    const shareUrl = `${window.location.origin}/voices/${postId}`;
    let shareLink = '';
    
    switch (platform) {
      case 'whatsapp':
        shareLink = `https://wa.me/?text=${encodeURIComponent(`Check out this voice on VoiceVerse: ${shareUrl}`)}`;
        break;
      case 'twitter':
        shareLink = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent('Check out this amazing voice transformation on VoiceVerse!')}`;
        break;
      case 'facebook':
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      default:
        break;
    }
    
    if (shareLink) {
      window.open(shareLink, '_blank');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Share Panel */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 bg-white dark:bg-dark-900 rounded-t-3xl z-50 overflow-hidden"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-dark-900 dark:text-white">
                  Share to
                </h3>
                <IconButton
                  variant="ghost"
                  size="sm"
                  icon={<X />}
                  onClick={onClose}
                  aria-label="Close"
                />
              </div>
              
              {/* Share options */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <button 
                  className="flex flex-col items-center gap-2"
                  onClick={() => handleShare('whatsapp')}
                >
                  <div className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center">
                    <MessageSquare className="h-7 w-7 text-white" />
                  </div>
                  <span className="text-xs text-dark-700 dark:text-dark-300">WhatsApp</span>
                </button>
                
                <button 
                  className="flex flex-col items-center gap-2"
                  onClick={() => handleShare('twitter')}
                >
                  <div className="w-14 h-14 rounded-full bg-blue-400 flex items-center justify-center">
                    <svg className="h-7 w-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </div>
                  <span className="text-xs text-dark-700 dark:text-dark-300">Twitter</span>
                </button>
                
                <button 
                  className="flex flex-col items-center gap-2"
                  onClick={() => handleShare('facebook')}
                >
                  <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center">
                    <svg className="h-7 w-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9.198 21.5h4v-8.01h3.604l.396-3.98h-4V7.5a1 1 0 0 1 1-1h3v-4h-3a5 5 0 0 0-5 5v2.01h-2l-.396 3.98h2.396v8.01Z" />
                    </svg>
                  </div>
                  <span className="text-xs text-dark-700 dark:text-dark-300">Facebook</span>
                </button>
                
                <button className="flex flex-col items-center gap-2">
                  <div className="w-14 h-14 rounded-full bg-gray-200 dark:bg-dark-800 flex items-center justify-center">
                    <MoreHorizontal className="h-7 w-7 text-dark-700 dark:text-dark-300" />
                  </div>
                  <span className="text-xs text-dark-700 dark:text-dark-300">More</span>
                </button>
              </div>
              
              {/* Copy link */}
              <div className="bg-gray-100 dark:bg-dark-800 rounded-xl p-3 flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 flex-1 truncate">
                  <LinkIcon className="h-4 w-4 text-dark-500 dark:text-dark-400 flex-shrink-0" />
                  <span className="text-sm text-dark-700 dark:text-dark-300 truncate">
                    {`${window.location.origin}/voices/${postId}`}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant={copied ? 'success' : 'primary'}
                  onClick={handleCopyLink}
                  leftIcon={copied ? undefined : <Copy className="h-4 w-4" />}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export const VoicesPage: React.FC = () => {
  const [posts, setPosts] = useState<VoicePost[]>(mockPosts);
  const [activePostIndex, setActivePostIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [activeComments, setActiveComments] = useState<Comment[]>([]);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [activeUser, setActiveUser] = useState<UserProfile | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize with mock data immediately
  useEffect(() => {
    // Start with mock data for immediate display
    setPosts(mockPosts);
    
    // Then fetch from API to update with real data
    fetchPosts();
  }, []);

  // Fetch posts from API and merge with mock data
  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const response = await voicesAPI.getVoicePosts();
      if (response.status === 'success' && response.data && response.data.length > 0) {
        // Transform feed posts to match our VoicePost interface
        const transformedPosts = response.data.map((post: any) => {
          // Ensure audio URL is properly formatted
          let audioUrl = post.audioUrl || post.audioFile?.storagePath || '/sound-design-elements-sfx-ps-022-302865.mp3';
          
          // If it's an API audio path, ensure it's properly formatted
          if (post.audioFile && post.audioFile.id && !audioUrl.includes('/api/audio/')) {
            audioUrl = `/api/audio/original/${post.audioFile.id}`;
          }
          
          // If the URL doesn't start with http or /, add a leading /
          if (!audioUrl.startsWith('http') && !audioUrl.startsWith('/')) {
            audioUrl = `/${audioUrl}`;
          }
          
          return {
            id: post.id,
            audioUrl: audioUrl,
            waveformData: post.waveformData,
            duration: post.audioFile?.duration || post.duration || 30,
          title: post.title || post.caption || 'Voice Post',
            caption: post.caption || post.description,
            tags: post.tags || [],
            user: {
              id: post.user.id,
              username: post.user.username,
              displayName: post.user.displayName || post.user.username,
              avatarUrl: post.user.avatar || post.user.avatarUrl || 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=600',
              isVerified: post.user.isVerified || false,
              followerCount: post.user.followerCount || 0,
              followingCount: post.user.followingCount || 0,
              bio: post.user.bio || '',
              postsCount: post.user.postsCount || 0
            },
            createdAt: post.createdAt,
            stats: {
              plays: post.stats?.plays || post.plays || 0,
              likes: post.likes || post.stats?.likes || 0,
              comments: post.comments || post.stats?.comments || 0,
              shares: post.shares || post.stats?.shares || 0
            },
            userInteractions: {
              isLiked: post.isLiked || post.userInteractions?.isLiked || false,
              isSaved: post.isSaved || post.userInteractions?.isSaved || false,
              isFollowing: post.user.isFollowing || post.userInteractions?.isFollowing || false
            },
            voiceEffect: post.voiceEffect || {
              name: 'Voice Effect',
              category: 'Standard',
              description: 'Standard voice effect'
            }
          };
        });
        
        // Merge real data with mock data
        // Use a Map to avoid duplicates by ID
        const postsMap = new Map();
        
        // Add mock data first
        mockPosts.forEach(post => {
          postsMap.set(post.id, post);
        });
        
        // Then add real data, which will overwrite mock data with the same IDs
        transformedPosts.forEach(post => {
          postsMap.set(post.id, post);
        });
        
        // Convert back to array
        setPosts(Array.from(postsMap.values()));
      }
    } catch (err) {
      console.error('Error fetching voice posts:', err);
      setError('Could not fetch all posts. Showing available content.');
      // We already have mock data loaded, so no need to set it again
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-clear error message after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Handle scroll to update active post index
  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const scrollTop = containerRef.current.scrollTop;
        const index = Math.floor(scrollTop / window.innerHeight);
        if (index !== activePostIndex) {
          setActivePostIndex(index);
        }
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [activePostIndex]);

  const rowVirtualizer = useVirtualizer({
    count: posts.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => window.innerHeight,
    overscan: 2
  });

  // Handle like action
  const handleLike = async (postId: string) => {
    try {
      const response = await voicesAPI.likeVoicePost(postId);
      if (response.status === 'success') {
        setPosts(posts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              userInteractions: {
                ...post.userInteractions,
                isLiked: response.isLiked
              },
              stats: {
                ...post.stats,
                likes: response.isLiked
                  ? post.stats.likes + 1
                  : post.stats.likes - 1
              }
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
            userInteractions: {
              ...post.userInteractions,
              isLiked: !post.userInteractions.isLiked
            },
            stats: {
              ...post.stats,
              likes: post.userInteractions.isLiked
                ? post.stats.likes - 1
                : post.stats.likes + 1
            }
          };
        }
        return post;
      }));
    }
  };

  // Handle save action
  const handleSave = async (postId: string) => {
    try {
      const response = await voicesAPI.saveVoicePost(postId);
      if (response.status === 'success') {
        setPosts(posts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              userInteractions: {
                ...post.userInteractions,
                isSaved: response.isSaved
              }
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
            userInteractions: {
              ...post.userInteractions,
              isSaved: !post.userInteractions.isSaved
            }
          };
        }
        return post;
      }));
    }
  };

  // Handle share action
  const handleShare = async (postId: string) => {
    setActivePostId(postId);
    setShareOpen(true);
    
    try {
      // Update share count on the server
      await voicesAPI.shareVoicePost(postId);
      
      // Update local state
      setPosts(posts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            stats: {
              ...post.stats,
              shares: post.stats.shares + 1
            }
          };
        }
        return post;
      }));
    } catch (err) {
      console.error('Error sharing post:', err);
    }
  };

  // Handle follow action
  const handleFollow = async (userId: string) => {
    try {
      const response = await voicesAPI.followUser(userId);
      if (response.status === 'success') {
        // Update posts with this user
        setPosts(posts.map(post => {
          if (post.user.id === userId) {
            return {
              ...post,
              userInteractions: {
                ...post.userInteractions,
                isFollowing: response.isFollowing
              },
              user: {
                ...post.user,
                followerCount: response.isFollowing
                  ? post.user.followerCount + 1
                  : post.user.followerCount - 1
              }
            };
          }
          return post;
        }));
        
        // Update active user if profile is open
        if (activeUser && activeUser.id === userId) {
          setActiveUser({
            ...activeUser,
            userInteractions: {
              ...activeUser.userInteractions,
              isFollowing: response.isFollowing
            },
            followerCount: response.isFollowing
              ? activeUser.followerCount + 1
              : activeUser.followerCount - 1
          });
        }
      }
    } catch (err) {
      console.error('Error following user:', err);
      // Fallback to client-side update if API fails
      setPosts(posts.map(post => {
        if (post.user.id === userId) {
          return {
            ...post,
            userInteractions: {
              ...post.userInteractions,
              isFollowing: !post.userInteractions.isFollowing
            },
            user: {
              ...post.user,
              followerCount: post.userInteractions.isFollowing
                ? post.user.followerCount - 1
                : post.user.followerCount + 1
            }
          };
        }
        return post;
      }));
      
      // Update active user if profile is open
      if (activeUser && activeUser.id === userId) {
        setActiveUser({
          ...activeUser,
          userInteractions: {
            ...activeUser.userInteractions,
            isFollowing: !activeUser.userInteractions?.isFollowing
          },
          followerCount: activeUser.userInteractions?.isFollowing
            ? activeUser.followerCount - 1
            : activeUser.followerCount + 1
        });
      }
    }
  };
  
  // Mock comments data
const mockComments: Record<string, Comment[]> = {
  '1': [
    {
      id: 'comment1',
      content: 'This is amazing! Your Morgan Freeman impression is spot on!',
      user: {
        id: 'user5',
        username: 'voicefan',
        displayName: 'Voice Fan',
        avatarUrl: 'https://images.pexels.com/photos/1382731/pexels-photo-1382731.jpeg?auto=compress&cs=tinysrgb&w=600',
        isVerified: false
      },
      createdAt: '2024-03-01T14:30:00Z',
      likes: 42,
      isLiked: false
    },
    {
      id: 'comment2',
      content: 'How did you get your voice so deep? Any tips?',
      user: {
        id: 'user6',
        username: 'learningvoice',
        displayName: 'Learning Voice',
        avatarUrl: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=600',
        isVerified: false
      },
      createdAt: '2024-03-01T13:15:00Z',
      likes: 18,
      isLiked: true
    }
  ],
  '2': [
    {
      id: 'comment3',
      content: 'Your Russian accent is hilarious! 😂',
      user: {
        id: 'user7',
        username: 'accentlover',
        displayName: 'Accent Lover',
        avatarUrl: 'https://images.pexels.com/photos/1065084/pexels-photo-1065084.jpeg?auto=compress&cs=tinysrgb&w=600',
        isVerified: false
      },
      createdAt: '2024-03-01T11:45:00Z',
      likes: 31,
      isLiked: false
    }
  ]
};

// Handle opening comments
  const handleOpenComments = async (postId: string) => {
    setActivePostId(postId);
    setCommentsOpen(true);
    
    // Start with mock comments for immediate display
    const mockCommentsForPost = mockComments[postId] || [];
    setActiveComments(mockCommentsForPost);
    
    try {
      const response = await voicesAPI.getVoicePostComments(postId);
      if (response.status === 'success' && response.data && response.data.length > 0) {
        // Transform comments to match our Comment interface
        const transformedComments = response.data.map((comment: any) => ({
          id: comment.id,
          content: comment.content,
          user: {
            id: comment.user.id,
            username: comment.user.username,
            displayName: comment.user.displayName || comment.user.username,
            avatarUrl: comment.user.avatar || comment.user.avatarUrl || 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=600',
            isVerified: comment.user.isVerified || false
          },
          createdAt: comment.createdAt,
          likes: comment.likes || 0,
          isLiked: comment.isLiked || false
        }));
        
        // Merge real comments with mock comments
        // Use a Map to avoid duplicates by ID
        const commentsMap = new Map();
        
        // Add mock comments first
        mockCommentsForPost.forEach(comment => {
          commentsMap.set(comment.id, comment);
        });
        
        // Then add real comments, which will overwrite mock comments with the same IDs
        transformedComments.forEach(comment => {
          commentsMap.set(comment.id, comment);
        });
        
        // Convert back to array and sort by date (newest first)
        const mergedComments = Array.from(commentsMap.values()).sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        setActiveComments(mergedComments);
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
      // We already have mock comments loaded, so no need to set them again
    }
  };
  
  // Handle adding a comment
  const handleAddComment = async (postId: string, content: string) => {
    try {
      const response = await voicesAPI.addVoicePostComment(postId, content);
      if (response.status === 'success') {
        // Add the new comment to the comments list
        setActiveComments([response.data, ...activeComments]);
        
        // Update comment count in the post
        setPosts(posts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              stats: {
                ...post.stats,
                comments: post.stats.comments + 1
              }
            };
          }
          return post;
        }));
      }
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  };
  
  // Handle liking a comment
  const handleLikeComment = async (commentId: string) => {
    try {
      const response = await voicesAPI.likeComment(commentId);
      if (response.status === 'success') {
        // Update the comment in the comments list
        setActiveComments(activeComments.map(comment => {
          if (comment.id === commentId) {
            return {
              ...comment,
              isLiked: response.isLiked,
              likes: response.isLiked ? comment.likes + 1 : comment.likes - 1
            };
          }
          return comment;
        }));
      }
    } catch (err) {
      console.error('Error liking comment:', err);
      // Fallback to client-side update if API fails
      setActiveComments(activeComments.map(comment => {
        if (comment.id === commentId) {
          return {
            ...comment,
            isLiked: !comment.isLiked,
            likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1
          };
        }
        return comment;
      }));
    }
  };
  
  // Handle opening user profile
  const handleOpenProfile = async (user: VoicePost['user']) => {
    // Create a basic profile from the user data we already have
    const basicProfile: UserProfile = {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      isVerified: user.isVerified,
      bio: user.bio || '',
      followerCount: user.followerCount,
      followingCount: user.followingCount,
      postsCount: user.postsCount,
      userInteractions: {
        isFollowing: user.userInteractions?.isFollowing || false
      }
    };
    
    // Set the basic profile immediately for a responsive UI
    setActiveUser(basicProfile);
    setProfileOpen(true);
    
    // Try to fetch more detailed profile data
    try {
      const response = await voicesAPI.getUserProfile(user.id);
      if (response.status === 'success' && response.data) {
        // Merge the API response with what we already have to ensure we don't lose any data
        setActiveUser(prevUser => ({
          ...prevUser!,
          ...response.data,
          // Keep the existing interactions if the API doesn't provide them
          userInteractions: {
            ...prevUser!.userInteractions,
            ...response.data.userInteractions
          }
        }));
      }
      
      // Try to fetch user's posts
      try {
        const postsResponse = await voicesAPI.getUserVoicePosts(user.id);
        if (postsResponse.status === 'success' && postsResponse.data) {
          // Update the user profile with their posts
          setActiveUser(prevUser => ({
            ...prevUser!,
            posts: postsResponse.data
          }));
        }
      } catch (postsErr) {
        console.error('Error fetching user posts:', postsErr);
        // If we can't get real posts, create some mock posts for this user
        const mockUserPosts = mockPosts
          .filter((_, index) => index < 6) // Take a few mock posts
          .map(post => ({
            ...post,
            user: { ...user } // Set the user to the current profile
          }));
          
        setActiveUser(prevUser => ({
          ...prevUser!,
          posts: mockUserPosts
        }));
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      // We already set the basic profile, so the UI is still functional
    }
  };

  return (
    <div
      ref={containerRef}
      className="h-screen overflow-y-auto snap-y snap-mandatory"
      style={{
        scrollBehavior: 'smooth'
      }}
    >
      {/* Loading indicator */}
      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      )}
      
      {/* Error message - only show briefly */}
      {error && (
        <motion.div 
          className="fixed top-4 left-4 right-4 bg-error-100 dark:bg-error-900/30 border border-error-300 dark:border-error-800 rounded-lg p-4 z-50"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <p className="text-error-700 dark:text-error-400">{error}</p>
        </motion.div>
      )}
      
      <div
        className="relative w-full"
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualItem) => {
          const post = posts[virtualItem.index];
          return (
            <div
              key={virtualItem.key}
              className="absolute top-0 left-0 w-full"
              style={{
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`
              }}
            >
              <VoicePost
                post={post}
                isActive={virtualItem.index === activePostIndex}
                onLike={handleLike}
                onSave={handleSave}
                onShare={handleShare}
                onFollow={handleFollow}
                onOpenComments={handleOpenComments}
                onOpenProfile={handleOpenProfile}
              />
            </div>
          );
        })}
      </div>
      
      {/* Comments Panel */}
      <CommentsPanel
        postId={activePostId}
        isOpen={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        comments={activeComments}
        onAddComment={handleAddComment}
        onLikeComment={handleLikeComment}
      />
      
      {/* User Profile Panel */}
      <UserProfilePanel
        user={activeUser}
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
        onFollow={handleFollow}
      />
      
      {/* Share Panel */}
      <SharePanel
        postId={activePostId}
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
      />
    </div>
  );
};