import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, Square, Volume2, VolumeX } from 'lucide-react';
import { IconButton } from '../ui/IconButton';
import { cn } from '../../lib/utils';

interface AudioPlayerProps {
  audioUrl: string;
  className?: string;
  showWaveform?: boolean;
  height?: number;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioUrl,
  className,
  showWaveform = true,
  height = 80
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Format time as MM:SS
  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Handle play/pause
  const handlePlayPause = async () => {
    if (!audioRef.current) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        await audioRef.current.play();
      }
    } catch (err) {
      console.error('Error playing/pausing audio:', err);
      setError('Failed to play audio');
    }
  };

  // Handle stop
  const handleStop = () => {
    if (!audioRef.current) return;
    
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setIsPlaying(false);
    setCurrentTime(0);
  };

  // Handle volume change
  const handleVolumeChange = (newVolume: number) => {
    if (!audioRef.current) return;
    
    setVolume(newVolume);
    audioRef.current.volume = newVolume;
    
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  // Handle mute toggle
  const handleMuteToggle = () => {
    if (!audioRef.current) return;
    
    if (isMuted) {
      audioRef.current.volume = volume;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  // Handle progress bar click
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !progressRef.current) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const percentage = clickX / width;
    const newTime = percentage * duration;
    
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Set up audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadStart = () => {
      setIsLoading(true);
      setError(null);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = (e: Event) => {
      console.error('Audio error:', e);
      setError('Failed to load audio');
      setIsLoading(false);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    // Add event listeners
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);

    // Cleanup
    return () => {
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, []);

  // Update audio source when URL changes
  useEffect(() => {
    if (audioRef.current && audioUrl) {
      // Stop current playback
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      setIsLoading(true);
      setError(null);
      
      // Set new source
      audioRef.current.src = audioUrl;
      audioRef.current.load();
    }
  }, [audioUrl]);

  // Calculate progress percentage
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Generate simple waveform visualization
  const generateWaveform = () => {
    const bars = [];
    const barCount = 50;
    
    for (let i = 0; i < barCount; i++) {
      const height = Math.random() * 60 + 20; // Random height between 20-80%
      const isActive = progressPercentage > (i / barCount) * 100;
      
      bars.push(
        <div
          key={i}
          className={cn(
            'w-1 rounded-full transition-colors duration-200',
            isActive 
              ? 'bg-primary-600 dark:bg-primary-400' 
              : 'bg-gray-300 dark:bg-dark-600'
          )}
          style={{ height: `${height}%` }}
        />
      );
    }
    
    return bars;
  };

  if (error) {
    return (
      <div className={cn('bg-gray-50 dark:bg-dark-800/50 rounded-xl p-4', className)}>
        <div className="flex items-center justify-center h-20 text-error-600 dark:text-error-400">
          <span className="text-sm">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('bg-gray-50 dark:bg-dark-800/50 rounded-xl p-4', className)}>
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        preload="metadata"
        crossOrigin="anonymous"
      />
      
      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <IconButton
              variant={isPlaying ? 'accent' : 'primary'}
              size="sm"
              icon={isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              onClick={handlePlayPause}
              disabled={isLoading || !!error}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            />
            <IconButton
              variant="outline"
              size="sm"
              icon={<Square className="h-4 w-4" />}
              onClick={handleStop}
              disabled={!isPlaying && currentTime === 0}
              aria-label="Stop"
            />
          </div>
          
          <div className="text-sm font-medium text-dark-600 dark:text-dark-400">
            {isLoading ? (
              <span>Loading...</span>
            ) : (
              <>
                <span>{formatTime(currentTime)}</span>
                <span className="mx-1">/</span>
                <span>{formatTime(duration)}</span>
              </>
            )}
          </div>
        </div>
        
        {/* Volume Control */}
        <div className="flex items-center gap-2">
          <IconButton
            variant="ghost"
            size="sm"
            icon={isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            onClick={handleMuteToggle}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          />
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={isMuted ? 0 : volume}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            className="w-16 h-1 bg-gray-300 dark:bg-dark-600 rounded-lg appearance-none cursor-pointer 
                       [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 
                       [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-600 
                       [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 
                       [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary-600 
                       [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-none"
            aria-label="Volume"
          />
        </div>
      </div>

      {/* Waveform/Progress Visualization */}
      {showWaveform && (
        <div 
          className="relative cursor-pointer"
          style={{ height: `${height}px` }}
          onClick={handleProgressClick}
        >
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <div className="flex items-end justify-between h-full gap-1 px-1">
              {generateWaveform()}
            </div>
          )}
          
          {/* Progress overlay */}
          <div 
            ref={progressRef}
            className="absolute inset-0 cursor-pointer"
            title={`${Math.round(progressPercentage)}% complete`}
          />
        </div>
      )}

      {/* Progress Bar (fallback if no waveform) */}
      {!showWaveform && (
        <div 
          ref={progressRef}
          className="w-full h-2 bg-gray-300 dark:bg-dark-600 rounded-full cursor-pointer overflow-hidden"
          onClick={handleProgressClick}
        >
          <div 
            className="h-full bg-primary-600 dark:bg-primary-400 transition-all duration-200 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      )}
    </div>
  );
};