import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic2 } from 'lucide-react';
import { Button } from './ui/Button';
import { cn, delay } from '../lib/utils';

interface IntroLoaderProps {
  onComplete: () => void;
  skipIntro?: boolean;
  audioFile?: string; // Path to your audio file
}

export const IntroLoader: React.FC<IntroLoaderProps> = ({
  onComplete,
  skipIntro = false,
  audioFile = '/Back-home.mp3' // Default path, adjust as needed
}) => {
  const [progress, setProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [audioPlayed, setAudioPlayed] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const playAudio = async () => {
    if (audioRef.current && !audioPlayed) {
      try {
        audioRef.current.volume = 0.8;
        audioRef.current.currentTime = 0;
        console.log('Attempting to play audio...');
        await audioRef.current.play();
        setAudioPlayed(true);
        console.log('✅ Audio is now playing!');
      } catch (error) {
        console.error('❌ Audio playback failed:', error);
      }
    }
  };

  const handleUserInteraction = async () => {
    if (!userInteracted) {
      console.log('🖱️ User interaction detected, trying to play audio...');
      setUserInteracted(true);
      await playAudio();
    }
  };

  useEffect(() => {
    const loadApp = async () => {
      if (skipIntro) {
        onComplete();
        return;
      }

      // Simulate loading
      const loadingTime = 3000; // 3 seconds
      const steps = 50;
      const stepTime = loadingTime / steps;

      for (let i = 1; i <= steps; i++) {
        await delay(stepTime);
        setProgress(i / steps * 100);
      }

      setIsLoaded(true);
      await delay(1000); // Show complete state for 1 second
      setIsVisible(false);
      await delay(500); // Wait for exit animation
      
      // Stop audio when exiting
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      
      onComplete();
    };

    loadApp();
  }, [onComplete, skipIntro]);

  const handleSkip = async () => {
    await handleUserInteraction();
    
    // Give audio a moment to start before stopping
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }, 200);
    
    setIsVisible(false);
    setTimeout(onComplete, 500);
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-mesh dark:bg-dark-950 cursor-pointer"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          onClick={handleUserInteraction}
          onMouseDown={handleUserInteraction}
          onTouchStart={handleUserInteraction}
        >
          {/* Audio element - simplified */}
          <audio
            ref={audioRef}
            preload="auto"
            onCanPlay={() => console.log('🎵 Audio ready to play')}
            onPlay={() => console.log('▶️ Audio started playing')}
            onError={(e) => console.error('🚨 Audio error:', e)}
          >
            <source src={audioFile} type="audio/mpeg" />
            <source src={audioFile} type="audio/mp3" />
            Your browser does not support the audio element.
          </audio>

          <div className="audio-particles">
            <div className="audio-particle"></div>
            <div className="audio-particle"></div>
            <div className="audio-particle"></div>
            <div className="audio-particle"></div>
          </div>
          
          <div className="text-center max-w-md px-4" onClick={(e) => e.stopPropagation()}>
            {/* Logo */}
            <motion.div
              className="mb-8 inline-flex items-center justify-center h-24 w-24 rounded-2xl bg-primary-600 text-white cursor-pointer"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ 
                type: "spring", 
                stiffness: 260, 
                damping: 20,
                delay: 0.3 
              }}
              onClick={handleUserInteraction}
            >
              <Mic2 className="h-12 w-12" />
              
              {/* Sound waves */}
              <motion.div
                className="absolute -inset-4 flex items-center justify-center pointer-events-none opacity-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                transition={{ delay: 0.8, duration: 0.5 }}
              >
                <div className="audio-wave">
                  <motion.span 
                    animate={{ 
                      scaleY: [0.3, 1, 0.3],
                      opacity: [0.3, 1, 0.3]
                    }}
                    transition={{ 
                      duration: 1.5, 
                      repeat: Infinity,
                      repeatType: "loop" 
                    }}
                    className="h-16"
                  />
                  <motion.span 
                    animate={{ 
                      scaleY: [0.5, 1, 0.5],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{ 
                      duration: 1.7, 
                      repeat: Infinity,
                      repeatType: "loop",
                      delay: 0.1
                    }}
                    className="h-16"
                  />
                  <motion.span 
                    animate={{ 
                      scaleY: [0.7, 1, 0.7],
                      opacity: [0.7, 1, 0.7]
                    }}
                    transition={{ 
                      duration: 1.3, 
                      repeat: Infinity,
                      repeatType: "loop",
                      delay: 0.2
                    }}
                    className="h-16"
                  />
                  <motion.span 
                    animate={{ 
                      scaleY: [0.4, 1, 0.4],
                      opacity: [0.4, 1, 0.4]
                    }}
                    transition={{ 
                      duration: 1.6, 
                      repeat: Infinity,
                      repeatType: "loop",
                      delay: 0.3
                    }}
                    className="h-16"
                  />
                  <motion.span 
                    animate={{ 
                      scaleY: [0.6, 1, 0.6],
                      opacity: [0.6, 1, 0.6]
                    }}
                    transition={{ 
                      duration: 1.4, 
                      repeat: Infinity,
                      repeatType: "loop",
                      delay: 0.4
                    }}
                    className="h-16"
                  />
                </div>
              </motion.div>
            </motion.div>
            
            {/* Title with typewriter effect */}
            <motion.h1
              className={cn(
                "font-display font-bold text-3xl text-dark-900 dark:text-white mb-4",
                isLoaded && "typewriter"
              )}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              Welcome to VoiceVerse
            </motion.h1>
            
            {/* Loading text */}
            <motion.p
              className="text-dark-600 dark:text-dark-400 mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              {isLoaded ? "Ready to transform your voice" : "Loading your voice journey..."}
            </motion.p>
            
            {/* Audio hint */}
            {!audioPlayed && (
              <motion.p
                className="text-primary-600 dark:text-primary-400 text-sm mb-4 animate-pulse"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 0.5 }}
              >
                🔊 Click anywhere to enable audio
              </motion.p>
            )}
            
            {/* Progress bar */}
            <motion.div
              className="w-full h-1.5 bg-gray-200 dark:bg-dark-700 rounded-full overflow-hidden mb-8"
              initial={{ opacity: 0, width: "60%" }}
              animate={{ opacity: 1, width: "100%" }}
              transition={{ delay: 1, duration: 0.5 }}
            >
              <motion.div
                className="h-full bg-primary-600 dark:bg-primary-500"
                initial={{ width: "0%" }}
                animate={{ width: `${progress}%` }}
                transition={{ ease: "linear" }}
              />
            </motion.div>
            
            {/* Skip button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.5 }}
            >
              <Button
                variant="outline"
                onClick={handleSkip}
              >
                {isLoaded ? "Enter App" : "Skip Intro"}
              </Button>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};