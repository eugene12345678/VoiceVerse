import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconButton } from '../ui/IconButton';
import { Avatar } from '../ui/Avatar';
import { usePlayerStore } from '../../store/playerStore';
import { Link } from 'react-router-dom';

export const MobilePlayer = () => {
  const { 
    currentPost,
    isPlaying,
    togglePlay,
    isMuted,
    toggleMute,
    next,
    previous,
    currentTime,
    duration
  } = usePlayerStore();

  if (!currentPost) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <AnimatePresence>
      {currentPost && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 20 }}
          className="fixed bottom-0 left-0 right-0 z-30 px-4 pb-4 md:hidden"
        >
          <div className="bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-xl shadow-lg p-3">
            <div className="flex items-center gap-3">
              {/* Progress bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-dark-700 overflow-hidden rounded-t-xl">
                <motion.div 
                  className="h-full bg-primary-600 dark:bg-primary-500"
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: 'linear' }}
                />
              </div>
              
              {/* User avatar and info */}
              <Link to={`/profile/${currentPost.userId}`} className="flex-shrink-0">
                <Avatar
                  src={currentPost.user.avatar}
                  alt={currentPost.user.displayName}
                  size="sm"
                />
              </Link>
              
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium text-dark-900 dark:text-white">
                  {currentPost.caption}
                </div>
                <div className="text-sm text-dark-500 dark:text-dark-400 truncate">
                  {currentPost.user.displayName}
                </div>
              </div>
              
              {/* Controls */}
              <div className="flex items-center gap-2">
                <IconButton
                  variant="ghost"
                  size="sm"
                  icon={<SkipBack size={18} />}
                  onClick={previous}
                  aria-label="Previous"
                />
                
                <IconButton
                  variant={isPlaying ? 'accent' : 'primary'}
                  size="sm"
                  icon={isPlaying ? <Pause size={18} /> : <Play size={18} />}
                  onClick={togglePlay}
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                />
                
                <IconButton
                  variant="ghost"
                  size="sm"
                  icon={<SkipForward size={18} />}
                  onClick={next}
                  aria-label="Next"
                />
                
                <IconButton
                  variant="ghost"
                  size="sm"
                  icon={isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  onClick={toggleMute}
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};