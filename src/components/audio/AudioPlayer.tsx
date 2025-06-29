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
  const [retryCount, setRetryCount] = useState(0);
  const [maxRetries] = useState(3);
  const [fallbackAttempted, setFallbackAttempted] = useState(false);

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

    const handleError = async (e: Event) => {
      const target = e.target as HTMLAudioElement;
      const mediaError = target.error;
      let errorMessage = 'Failed to load audio';
      
      if (mediaError) {
        switch (mediaError.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            errorMessage = 'Audio loading was aborted';
            break;
          case MediaError.MEDIA_ERR_NETWORK:
            errorMessage = 'Network error while loading audio';
            break;
          case MediaError.MEDIA_ERR_DECODE:
            errorMessage = 'Audio format not supported or corrupted';
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = 'Audio source not supported';
            break;
          default:
            errorMessage = 'Unknown audio error occurred';
        }
      }
      
      console.error('Audio error:', errorMessage, e);
      console.log('Audio URL that failed:', audioUrl);
      console.log('Browser info:', {
        userAgent: navigator.userAgent,
        canPlayWebM: audio?.canPlayType('audio/webm; codecs=opus'),
        canPlayMP3: audio?.canPlayType('audio/mpeg'),
        canPlayWAV: audio?.canPlayType('audio/wav')
      });
      
      // Check if the audio URL returns a 404 or error response
      try {
        const response = await fetch(audioUrl, { method: 'HEAD' });
        console.log('Audio URL HEAD response:', {
          status: response.status,
          statusText: response.statusText,
          contentType: response.headers.get('content-type'),
          contentLength: response.headers.get('content-length')
        });
        
        if (response.status === 404) {
          setError('Audio file not found');
          setIsLoading(false);
          return;
        }
        
        // If it's a WebM file, check browser support more thoroughly
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('webm')) {
          const webmSupport = audio?.canPlayType('audio/webm; codecs=opus');
          const webmBasicSupport = audio?.canPlayType('audio/webm');
          
          console.log('WebM support check:', {
            contentType,
            webmOpusSupport: webmSupport,
            webmBasicSupport: webmBasicSupport,
            fallbackAttempted
          });
          
          // Even if browser claims support, WebM files can still fail
          // Try multiple fallback strategies
          if (!fallbackAttempted) {
            console.log('WebM file detected, attempting compatibility workarounds');
            setFallbackAttempted(true);
            
            const audioId = audioUrl.split('/').pop();
            if (audioId) {
              // Strategy 1: Try the original endpoint (might serve differently)
              const fallbackUrl = audioUrl.replace('/api/audio/', '/api/audio/original/');
              console.log('Trying original endpoint fallback:', fallbackUrl);
              
              if (audioRef.current) {
                // Set up a timeout to try another approach if this fails
                const fallbackTimeout = setTimeout(() => {
                  console.log('Original endpoint fallback failed, trying conversion endpoint');
                  // Strategy 2: Try conversion endpoint (even if it just returns info)
                  fetch(`/api/audio/convert/${audioId}?format=wav`)
                    .then(convertResponse => convertResponse.json())
                    .then(convertData => {
                      console.log('Conversion endpoint response:', convertData);
                      // For now, just log the response since conversion isn't implemented
                      errorMessage = 'WebM playback failed. Audio conversion not available in this environment.';
                      setError(errorMessage);
                      setIsLoading(false);
                    })
                    .catch(convertError => {
                      console.error('Conversion endpoint error:', convertError);
                      errorMessage = 'WebM audio format not supported and conversion failed';
                      setError(errorMessage);
                      setIsLoading(false);
                    });
                }, 3000);
                
                // Clear timeout if audio loads successfully
                const handleLoadSuccess = () => {
                  clearTimeout(fallbackTimeout);
                  audioRef.current?.removeEventListener('canplay', handleLoadSuccess);
                };
                audioRef.current.addEventListener('canplay', handleLoadSuccess);
                
                audioRef.current.src = fallbackUrl;
                audioRef.current.load();
                return;
              }
            }
          }
          
          // If all fallbacks have been attempted
          if (fallbackAttempted) {
            console.warn('All WebM fallback strategies exhausted');
            errorMessage = 'WebM audio format not supported by this browser';
          }
        }
      } catch (fetchError) {
        console.error('Error checking audio URL:', fetchError);
      }
      
      // Try to retry loading if we haven't exceeded max retries and it's not a 404
      if (retryCount < maxRetries && audioUrl && !errorMessage.includes('not found') && !errorMessage.includes('not supported')) {
        console.log(`Retrying audio load (attempt ${retryCount + 1}/${maxRetries})`);
        setRetryCount(prev => prev + 1);
        setError(null);
        setIsLoading(true);
        
        // For WebM files, try different loading strategies on retry
        const isWebM = audioUrl.includes('webm') || (response && response.headers.get('content-type')?.includes('webm'));
        
        setTimeout(() => {
          if (audioRef.current) {
            if (isWebM && retryCount === 0) {
              // First retry: Try with different preload settings
              console.log('WebM retry: Trying with preload="auto"');
              audioRef.current.preload = 'auto';
              audioRef.current.load();
            } else if (isWebM && retryCount === 1) {
              // Second retry: Try creating a new audio element
              console.log('WebM retry: Creating new audio element');
              const newAudio = document.createElement('audio');
              newAudio.preload = 'metadata';
              newAudio.crossOrigin = 'anonymous';
              newAudio.src = audioUrl;
              
              // Copy event listeners to new element
              const currentAudio = audioRef.current;
              if (currentAudio) {
                // Transfer all event listeners
                ['loadstart', 'loadedmetadata', 'timeupdate', 'play', 'pause', 'ended', 'error', 'canplay'].forEach(eventType => {
                  const listeners = currentAudio.cloneNode(true);
                  // This is a simplified approach - in practice you'd need to properly transfer listeners
                });
              }
              
              // Replace the audio element
              if (audioRef.current?.parentNode) {
                audioRef.current.parentNode.replaceChild(newAudio, audioRef.current);
                audioRef.current = newAudio;
              }
              
              newAudio.load();
            } else {
              // Standard retry
              audioRef.current.load();
            }
          }
        }, 1000 * (retryCount + 1)); // Exponential backoff
      } else {
        setError(errorMessage);
        setIsLoading(false);
      }
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
      setRetryCount(0); // Reset retry count for new URL
      setFallbackAttempted(false); // Reset fallback flag for new URL
      
      // Log audio URL and browser capabilities
      console.log('Loading new audio URL:', audioUrl);
      console.log('Browser audio support:', {
        canPlayWebM: audioRef.current.canPlayType('audio/webm'),
        canPlayWebMOpus: audioRef.current.canPlayType('audio/webm; codecs=opus'),
        canPlayWebMVorbis: audioRef.current.canPlayType('audio/webm; codecs=vorbis'),
        canPlayMP3: audioRef.current.canPlayType('audio/mpeg'),
        canPlayWAV: audioRef.current.canPlayType('audio/wav'),
        canPlayOGG: audioRef.current.canPlayType('audio/ogg')
      });
      
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