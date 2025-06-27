import React, { useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { cn } from '../../lib/utils';

interface WaveformVisualizerProps {
  audioUrl: string;
  isPlaying: boolean;
  onPlayPause: () => void;
  onStop?: () => void;
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
  onStop,
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
  
  // Add a method to stop audio playback
  const stopAudio = () => {
    if (wavesurferRef.current && isMountedRef.current) {
      try {
        wavesurferRef.current.stop();
        onStop?.();
      } catch (err) {
        console.warn('Error stopping audio:', err);
      }
    }
  };
  
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
        // Check if the browser supports AudioContext
        const hasAudioContext = !!(window.AudioContext || (window as any).webkitAudioContext);
        
        // Choose the appropriate backend based on browser capabilities
        const backend = hasAudioContext ? 'WebAudio' : 'MediaElement';
        
        // Initialize with safer options and appropriate backend
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
          // Use the appropriate backend
          backend,
          // Disable features that might cause issues
          autoCenter: false,
          fillParent: true,
          // Add decoder options
          mediaControls: false,
          // Prevent decoding errors
          partialRender: true,
          // Add additional options for better performance
          xhr: {
            cache: 'force-cache',
            mode: 'cors',
            credentials: 'same-origin',
            headers: [
              { key: 'Cache-Control', value: 'max-age=31536000' }
            ]
          },
          // Improve loading performance
          minPxPerSec: 50,
          // Reduce initial load time by using a lower sample rate
          audioRate: 1,
          // Improve rendering performance
          drawingContextAttributes: {
            desynchronized: true,
            alpha: false
          },
          // Add better error handling
          fetchParams: {
            cache: 'force-cache',
            mode: 'cors',
            credentials: 'same-origin'
          },
          // Add a longer timeout for decoding
          decodeTimeOut: 15000
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
        const handleAudioError = (event) => {
          // Check the specific error code to provide better diagnostics
          const mediaError = event.target?.error;
          let errorMessage = 'Audio format not supported, using fallback visualization';
          
          if (mediaError) {
            switch (mediaError.code) {
              case MediaError.MEDIA_ERR_ABORTED:
                errorMessage = 'Audio loading aborted, using fallback visualization';
                break;
              case MediaError.MEDIA_ERR_NETWORK:
                errorMessage = 'Network error while loading audio, using fallback visualization';
                break;
              case MediaError.MEDIA_ERR_DECODE:
                errorMessage = 'Audio decoding error, using fallback visualization';
                break;
              case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                errorMessage = 'Audio format not supported, using fallback visualization';
                break;
            }
          }
          
          console.warn(errorMessage);
          
          // Try to load the audio directly as an ArrayBuffer instead
          const fetchAudio = async () => {
            try {
              const response = await fetch(normalizedUrl);
              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }
              
              const arrayBuffer = await response.arrayBuffer();
              if (arrayBuffer && arrayBuffer.byteLength > 0) {
                // If we have the audio data, try to load it with wavesurfer
                if (isMountedRef.current && wavesurferRef.current) {
                  try {
                    // Create a blob from the array buffer
                    const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
                    const blobUrl = URL.createObjectURL(blob);
                    
                    // Load the blob URL
                    wavesurferRef.current.load(blobUrl);
                    
                    // Clean up the blob URL when done
                    wavesurferRef.current.once('ready', () => {
                      URL.revokeObjectURL(blobUrl);
                    });
                    
                    return; // Exit if successful
                  } catch (e) {
                    console.warn('Failed to load audio from ArrayBuffer:', e);
                  }
                }
              }
              
              // If we get here, all attempts failed
              createFallbackVisualization();
            } catch (fetchError) {
              console.warn('Fetch error:', fetchError);
              createFallbackVisualization();
              
              // Last resort: try loading with wavesurfer directly
              if (isMountedRef.current && wavesurferRef.current) {
                try {
                  wavesurferRef.current.load(normalizedUrl);
                } catch (e) {
                  console.warn('Secondary wavesurfer load also failed:', e);
                }
              }
            }
          };
          
          // Start the fetch process
          fetchAudio();
        };
        
        // Set up success handling for the audio element
        const handleCanPlay = () => {
          if (!isMountedRef.current) return;
          
          // Cancel any existing timeout to prevent race conditions
          let timeoutId: NodeJS.Timeout | null = null;
          
          // If audio element can play the format, load with wavesurfer
          try {
            // Create a more reliable loading approach using fetch API
            const loadAudioWithFetch = async () => {
              try {
                // Fetch the audio file
                const response = await fetch(normalizedUrl, {
                  method: 'GET',
                  cache: 'force-cache',
                  headers: {
                    'Cache-Control': 'max-age=31536000',
                  }
                });
                
                if (!response.ok) {
                  throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                // Get the audio data as ArrayBuffer
                const arrayBuffer = await response.arrayBuffer();
                
                // Check if component is still mounted
                if (!isMountedRef.current || !wavesurferRef.current) {
                  return;
                }
                
                // Create an AudioContext
                const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                
                // Decode the audio data
                try {
                  // First check if the array buffer is valid
                  if (!arrayBuffer || arrayBuffer.byteLength === 0) {
                    throw new Error('Empty or invalid audio data received');
                  }
                  
                  // Create a copy of the array buffer to prevent issues with concurrent access
                  const bufferCopy = arrayBuffer.slice(0);
                  
                  // Decode with a timeout to prevent hanging
                  const decodePromise = audioContext.decodeAudioData(bufferCopy);
                  const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Audio decoding timeout')), 10000);
                  });
                  
                  // Race between decoding and timeout
                  const audioBuffer = await Promise.race([
                    decodePromise,
                    timeoutPromise
                  ]) as AudioBuffer;
                  
                  // Check if component is still mounted
                  if (!isMountedRef.current || !wavesurferRef.current) {
                    return;
                  }
                  
                  // Determine the correct MIME type based on response headers and file extension
                  let mimeType = response.headers.get('content-type') || 'audio/mpeg';
                  const fileExtension = normalizedUrl.split('.').pop()?.toLowerCase();
                  
                  if (fileExtension) {
                    switch (fileExtension) {
                      case 'mp3':
                        mimeType = 'audio/mpeg';
                        break;
                      case 'wav':
                        mimeType = 'audio/wav';
                        break;
                      case 'ogg':
                        mimeType = 'audio/ogg';
                        break;
                      case 'm4a':
                        mimeType = 'audio/mp4';
                        break;
                      case 'aac':
                        mimeType = 'audio/aac';
                        break;
                      // Add more formats as needed
                    }
                  }
                  
                  // Create a blob from the array buffer with the correct MIME type
                  const blob = new Blob([bufferCopy], { type: mimeType });
                  const blobUrl = URL.createObjectURL(blob);
                  
                  // Load the blob URL into wavesurfer
                  wavesurferRef.current.load(blobUrl);
                  
                  // Clean up the blob URL when done
                  wavesurferRef.current.once('ready', () => {
                    URL.revokeObjectURL(blobUrl);
                    
                    // Clear the timeout since loading succeeded
                    if (timeoutId) {
                      clearTimeout(timeoutId);
                      timeoutId = null;
                    }
                  });
                  
                  // Set a shorter timeout for blob loading
                  if (timeoutId) clearTimeout(timeoutId);
                  timeoutId = setTimeout(() => {
                    if (isMountedRef.current && wavesurferRef.current && 
                        (!wavesurferRef.current.getDuration() || wavesurferRef.current.getDuration() === 0)) {
                      console.warn('Blob loading timeout, falling back to direct loading');
                      // Try direct loading as a last resort
                      wavesurferRef.current.load(normalizedUrl);
                    }
                  }, 5000);
                  
                } catch (decodeError) {
                  console.warn('Error decoding audio data:', decodeError);
                  
                  // Try a different approach with MediaElement backend
                  if (isMountedRef.current && wavesurferRef.current) {
                    try {
                      // Destroy the current instance
                      wavesurferRef.current.unAll();
                      wavesurferRef.current.destroy();
                      
                      // Create a new instance with MediaElement backend
                      if (containerRef.current) {
                        wavesurferRef.current = WaveSurfer.create({
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
                          // Use MediaElement backend as fallback
                          backend: 'MediaElement',
                          // Disable features that might cause issues
                          autoCenter: false,
                          fillParent: true,
                          mediaControls: false
                        });
                        
                        // Set up event handlers again
                        wavesurferRef.current.on('error', (err) => {
                          console.warn('WaveSurfer MediaElement fallback error:', err);
                          if (isMountedRef.current) {
                            createFallbackVisualization();
                          }
                        });
                        
                        wavesurferRef.current.on('ready', () => {
                          if (isMountedRef.current) {
                            onReady?.(wavesurferRef.current!.getDuration());
                            
                            // Handle playback state
                            if (isPlaying && wavesurferRef.current!.getDuration() > 0) {
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
                        
                        wavesurferRef.current.on('click', () => {
                          if (isMountedRef.current) {
                            onPlayPause();
                          }
                        });
                        
                        // Load the audio directly
                        wavesurferRef.current.load(normalizedUrl);
                      }
                    } catch (fallbackError) {
                      console.warn('MediaElement fallback failed:', fallbackError);
                      createFallbackVisualization();
                    }
                  } else {
                    createFallbackVisualization();
                  }
                }
              } catch (fetchError) {
                console.warn('Error fetching audio:', fetchError);
                
                // Fall back to direct loading if fetch fails
                if (isMountedRef.current && wavesurferRef.current) {
                  wavesurferRef.current.load(normalizedUrl);
                }
              }
            };
            
            // Start the loading process
            loadAudioWithFetch();
            
            // Set a master timeout as a final fallback
            timeoutId = setTimeout(() => {
              if (isMountedRef.current && wavesurferRef.current && 
                  (!wavesurferRef.current.getDuration() || wavesurferRef.current.getDuration() === 0)) {
                console.warn('Audio loading timeout, creating fallback visualization');
                createFallbackVisualization();
              }
            }, 15000); // 15 second timeout
            
            // Return cleanup function
            return () => {
              if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
              }
            };
          } catch (error) {
            console.warn('Error in audio loading process:', error);
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
        onDoubleClick={stopAudio}
        title="Click to play/pause, double-click to stop"
      />
      
      {/* Hidden audio element with multiple sources for better format support */}
      <div className="hidden">
        {audioUrl && (
          <audio 
            controls={false}
            preload="auto" // Changed from metadata to auto for better loading
            crossOrigin="anonymous" // Added for CORS support
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
              
              // Try to detect the MIME type from the URL
              const fileExtension = normalizedUrl.split('.').pop()?.toLowerCase();
              let mimeType = 'audio/mpeg'; // Default to MP3
              
              if (fileExtension) {
                switch (fileExtension) {
                  case 'mp3':
                    mimeType = 'audio/mpeg';
                    break;
                  case 'wav':
                    mimeType = 'audio/wav';
                    break;
                  case 'ogg':
                    mimeType = 'audio/ogg';
                    break;
                  case 'm4a':
                    mimeType = 'audio/mp4';
                    break;
                  case 'aac':
                    mimeType = 'audio/aac';
                    break;
                  // Add more formats as needed
                }
              }
              
              // Add multiple source elements for different formats to improve compatibility
              const formats = [
                { type: mimeType, src: normalizedUrl },
                // Add fallback formats if needed
              ];
              
              // Add each source to the audio element
              formats.forEach(format => {
                const source = document.createElement('source');
                source.type = format.type;
                source.src = format.src;
                audio.appendChild(source);
              });
              
              // Add comprehensive error handling
              audio.onerror = (e) => {
                const mediaError = audio.error;
                let errorMessage = 'Unknown audio error';
                
                if (mediaError) {
                  switch (mediaError.code) {
                    case MediaError.MEDIA_ERR_ABORTED:
                      errorMessage = 'Audio loading aborted';
                      break;
                    case MediaError.MEDIA_ERR_NETWORK:
                      errorMessage = 'Network error while loading audio';
                      break;
                    case MediaError.MEDIA_ERR_DECODE:
                      errorMessage = 'Audio decoding error';
                      break;
                    case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                      errorMessage = 'Audio format not supported';
                      break;
                  }
                }
                
                console.warn(`Fallback audio element error: ${errorMessage}`, e);
                
                // Try to recover by switching to a different format if possible
                const currentSrc = audio.currentSrc;
                const sources = Array.from(audio.getElementsByTagName('source'));
                const currentIndex = sources.findIndex(source => source.src === currentSrc);
                
                if (currentIndex < sources.length - 1) {
                  // Try the next source
                  audio.src = sources[currentIndex + 1].src;
                  audio.load();
                }
              };
              
              // Add success handling
              audio.oncanplaythrough = () => {
                // Audio is loaded and can be played
                console.log('Fallback audio element loaded successfully');
              };
              
              // Force load the audio
              audio.load();
            }}
          />
        )}
      </div>
    </div>
  );
};