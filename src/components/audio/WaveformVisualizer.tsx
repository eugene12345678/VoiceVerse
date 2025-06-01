import React, { useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { cn } from '../../lib/utils';

interface WaveformVisualizerProps {
  audioUrl: string;
  isPlaying: boolean;
  onPlayPause: () => void;
  onReady?: (duration: number) => void;
  onPositionChange?: (position: number) => void;
  waveColor?: string;
  progressColor?: string;
  barWidth?: number;
  barGap?: number;
  barRadius?: number;
  height?: number;
  className?: string;
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  audioUrl,
  isPlaying,
  onPlayPause,
  onReady,
  onPositionChange,
  waveColor = 'rgba(77, 141, 243, 0.4)',
  progressColor = 'rgba(77, 141, 243, 1)',
  barWidth = 2,
  barGap = 2,
  barRadius = 2,
  height = 64,
  className
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);

  // Use separate refs to track component state and abort controller
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Initialize WaveSurfer only once to avoid recreation issues
  useEffect(() => {
    // Set mounted flag
    isMountedRef.current = true;
    
    // Create abort controller for cleanup
    abortControllerRef.current = new AbortController();
    
    // Cleanup function
    return () => {
      // Mark component as unmounted
      isMountedRef.current = false;
      
      // Abort any pending operations
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      
      // Clean up wavesurfer instance
      if (wavesurferRef.current) {
        try {
          // First unsubscribe from all events to prevent callbacks after unmount
          wavesurferRef.current.unAll();
          
          // Then try to cancel any pending operations
          if (typeof wavesurferRef.current.cancelAjax === 'function') {
            wavesurferRef.current.cancelAjax();
          }
          
          // Finally destroy the instance
          wavesurferRef.current.destroy();
        } catch (err) {
          console.warn('Error during WaveSurfer cleanup:', err);
        }
        wavesurferRef.current = null;
      }
    };
  }, []);
  
  // Handle audio loading and playback
  useEffect(() => {
    if (!containerRef.current || !audioUrl || !isMountedRef.current) return;
    
    // Create a fallback visualization function
    const createFallbackVisualization = () => {
      if (!containerRef.current || !isMountedRef.current) return;
      
      try {
        // Create a canvas placeholder
        const ctx = document.createElement('canvas').getContext('2d');
        if (ctx) {
          const canvas = ctx.canvas;
          canvas.width = containerRef.current.clientWidth || 300;
          canvas.height = height;
          ctx.fillStyle = waveColor;
          
          // Draw a placeholder waveform
          for (let i = 0; i < canvas.width; i += (barWidth + barGap)) {
            const barHeight = Math.random() * (height / 2) + 10;
            const y = (height - barHeight) / 2;
            ctx.fillRect(i, y, barWidth, barHeight);
          }
          
          // Replace the container content with the canvas
          containerRef.current.innerHTML = '';
          containerRef.current.appendChild(canvas);
        }
      } catch (canvasErr) {
        console.warn('Error creating canvas fallback:', canvasErr);
        
        // If canvas fails, create a simple div fallback
        if (containerRef.current) {
          containerRef.current.innerHTML = `
            <div style="width:100%;height:${height}px;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.05);border-radius:4px;">
              <div style="font-size:12px;color:#666;">Audio visualization unavailable</div>
            </div>
          `;
        }
      }
    };
    
    // Initialize or reset WaveSurfer
    const initializeWaveSurfer = () => {
      // Clean up previous instance if it exists
      if (wavesurferRef.current) {
        try {
          wavesurferRef.current.unAll();
          wavesurferRef.current.destroy();
        } catch (err) {
          console.warn('Error destroying previous WaveSurfer instance:', err);
        }
        wavesurferRef.current = null;
      }
      
      // Create new instance
      if (!containerRef.current) return;
      
      try {
        // Initialize with safer options and MediaElement backend for better format support
        const wavesurfer = WaveSurfer.create({
          container: containerRef.current,
          waveColor,
          progressColor,
          barWidth,
          barGap,
          barRadius,
          height,
          cursorWidth: 0,
          normalize: true,
          responsive: true,
          // Use MediaElement backend for better format support
          backend: 'MediaElement',
          // Disable features that might cause issues
          autoCenter: false,
          fillParent: true,
          // Add decoder options
          mediaControls: false,
          // Prevent decoding errors
          partialRender: true,
        });
        
        // Store the instance
        wavesurferRef.current = wavesurfer;
        
        // Set up event handlers
        wavesurfer.on('error', (err) => {
          console.warn('WaveSurfer error:', err);
          if (isMountedRef.current) {
            createFallbackVisualization();
          }
        });
        
        wavesurfer.on('ready', () => {
          if (isMountedRef.current) {
            onReady?.(wavesurfer.getDuration());
            
            // Handle playback state
            if (isPlaying && wavesurfer.getDuration() > 0) {
              // Use setTimeout to avoid immediate play which might be blocked
              setTimeout(() => {
                if (isMountedRef.current && wavesurferRef.current) {
                  try {
                    wavesurferRef.current.play();
                  } catch (playErr) {
                    console.warn('Error playing after ready:', playErr);
                  }
                }
              }, 100);
            }
          }
        });
        
        wavesurfer.on('click', () => {
          if (isMountedRef.current) {
            onPlayPause();
          }
        });
        
        wavesurfer.on('audioprocess', () => {
          if (isMountedRef.current) {
            onPositionChange?.(wavesurfer.getCurrentTime());
          }
        });
        
        wavesurfer.on('seek', () => {
          if (isMountedRef.current) {
            onPositionChange?.(wavesurfer.getCurrentTime());
          }
        });
        
        // Normalize URL
        let normalizedUrl = audioUrl;
        if (!audioUrl.startsWith('http') && !audioUrl.startsWith('blob:') && !audioUrl.startsWith('data:')) {
          if (!audioUrl.startsWith('/')) {
            normalizedUrl = '/' + audioUrl;
          }
          
          // Ensure API URLs are properly formatted
          if (normalizedUrl.includes('/api/audio/') || normalizedUrl.includes('/api/images/')) {
            // Make sure we're using the full URL with the server
            const baseUrl = window.location.origin;
            if (!normalizedUrl.startsWith(baseUrl)) {
              normalizedUrl = baseUrl + normalizedUrl;
            }
          }
        }
        
        // Pre-check audio format with a native audio element
        const audioElement = document.createElement('audio');
        audioElement.style.display = 'none';
        audioElement.crossOrigin = 'anonymous';
        
        // Set up error handling for the audio element
        const handleAudioError = () => {
          console.warn('Audio format not supported, using fallback visualization');
          createFallbackVisualization();
          
          // Try loading with wavesurfer anyway, it might have better format support
          try {
            wavesurfer.load(normalizedUrl);
          } catch (e) {
            console.warn('Secondary wavesurfer load also failed:', e);
          }
        };
        
        // Set up success handling for the audio element
        const handleCanPlay = () => {
          if (!isMountedRef.current) return;
          
          // If audio element can play the format, load with wavesurfer
          try {
            wavesurfer.load(normalizedUrl);
            
            // Set timeout to check if loading succeeded
            const timeoutId = setTimeout(() => {
              if (isMountedRef.current && wavesurferRef.current && 
                  (!wavesurferRef.current.getDuration() || wavesurferRef.current.getDuration() === 0)) {
                console.warn('Audio loading timeout, creating fallback visualization');
                createFallbackVisualization();
              }
            }, 5000); // 5 second timeout
            
            // Clear timeout on cleanup
            return () => clearTimeout(timeoutId);
          } catch (loadErr) {
            console.warn('Error loading audio with wavesurfer:', loadErr);
            createFallbackVisualization();
          }
        };
        
        // Set up event listeners
        audioElement.addEventListener('error', handleAudioError);
        audioElement.addEventListener('canplay', handleCanPlay);
        
        // Start loading the audio
        audioElement.src = normalizedUrl;
        audioElement.load();
        
        // Return cleanup function
        return () => {
          audioElement.removeEventListener('error', handleAudioError);
          audioElement.removeEventListener('canplay', handleCanPlay);
          audioElement.src = '';
        };
      } catch (initErr) {
        console.warn('Error initializing WaveSurfer:', initErr);
        createFallbackVisualization();
      }
    };
    
    // Initialize WaveSurfer
    initializeWaveSurfer();
    
  }, [audioUrl, height, barWidth, barGap, barRadius, waveColor, progressColor, onReady, onPositionChange, onPlayPause]);
  
  // Handle playback state changes
  useEffect(() => {
    if (!wavesurferRef.current || !isMountedRef.current) return;
    
    try {
      if (isPlaying) {
        if (wavesurferRef.current.getDuration() > 0 && !wavesurferRef.current.isPlaying()) {
          wavesurferRef.current.play();
        }
      } else {
        if (wavesurferRef.current.isPlaying()) {
          wavesurferRef.current.pause();
        }
      }
    } catch (err) {
      console.warn('Error controlling playback:', err);
    }
  }, [isPlaying]);

  // Handle theme changes for waveform colors
  useEffect(() => {
    if (!wavesurferRef.current || !isMountedRef.current) return;
    
    try {
      wavesurferRef.current.setOptions({
        waveColor,
        progressColor,
      });
    } catch (err) {
      console.warn('Error updating waveform colors:', err);
    }
  }, [waveColor, progressColor]);

  return (
    <div className={cn('relative', className)}>
      <div 
        ref={containerRef} 
        className="cursor-pointer rounded-lg overflow-hidden w-full"
        style={{ minHeight: `${height}px` }}
      />
      
      {/* Hidden audio element with multiple sources for better format support */}
      <div className="hidden">
        {audioUrl && (
          <audio 
            controls={false}
            preload="metadata"
            ref={(audio) => {
              if (!audio) return;
              
              // Clear existing sources
              while (audio.firstChild) {
                audio.removeChild(audio.firstChild);
              }
              
              // Normalize URL
              let normalizedUrl = audioUrl;
              if (!audioUrl.startsWith('http') && !audioUrl.startsWith('blob:') && !audioUrl.startsWith('data:')) {
                if (!audioUrl.startsWith('/')) {
                  normalizedUrl = '/' + audioUrl;
                }
                
                // Ensure API URLs are properly formatted
                if (normalizedUrl.includes('/api/audio/') || normalizedUrl.includes('/api/images/')) {
                  // Make sure we're using the full URL with the server
                  const baseUrl = window.location.origin;
                  if (!normalizedUrl.startsWith(baseUrl)) {
                    normalizedUrl = baseUrl + normalizedUrl;
                  }
                }
              }
              
              // Add source elements for different formats
              const fileExtension = normalizedUrl.split('.').pop()?.toLowerCase();
              
              // Add the main source with appropriate type
              const source = document.createElement('source');
              source.src = normalizedUrl;
              
              if (fileExtension) {
                switch (fileExtension) {
                  case 'mp3':
                    source.type = 'audio/mpeg';
                    break;
                  case 'wav':
                    source.type = 'audio/wav';
                    break;
                  case 'ogg':
                    source.type = 'audio/ogg';
                    break;
                  case 'm4a':
                    source.type = 'audio/mp4';
                    break;
                  case 'aac':
                    source.type = 'audio/aac';
                    break;
                  // Add more formats as needed
                }
              }
              
              audio.appendChild(source);
              
              // Add error handling
              audio.onerror = () => {
                console.warn('Fallback audio element error');
              };
            }}
          />
        )}
      </div>
    </div>
  );
};