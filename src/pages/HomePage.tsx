import React, { useState, useCallback, useRef } from 'react';
import { motion, useScroll, useTransform, useSpring, useInView } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { 
  Mic2, 
  Play, 
  Zap, 
  TrendingUp, 
  Award, 
  Globe, 
  Sparkles,
  Wand2,
  Brain,
  Shield,
  Users,
  Code,
  Square,
  X,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';

import { WaveformVisualizer } from '../components/audio/WaveformVisualizer';
import { formatNumber } from '../lib/utils';

// Enhanced Audio Recorder component with recording functionality and navigation
const EnhancedAudioRecorder: React.FC<{
  onRecordingComplete: (audioBlob: Blob) => void;
  className?: string;
}> = ({ onRecordingComplete, className }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingComplete, setRecordingComplete] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const { isAuthenticated } = useAuthStore();
  const navigate = useCallback((path: string) => {
    window.location.href = path;
  }, []);

  const startRecording = async () => {
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        setRecordingComplete(true);
        onRecordingComplete(audioBlob);
        
        // Stop all tracks in the stream to release the microphone
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access your microphone. Please check permissions and try again.');
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };
  
  const cancelRecording = () => {
    setRecordingComplete(false);
    setAudioBlob(null);
  };
  
  const proceedToStudio = () => {
    if (audioBlob) {
      // Check if user is authenticated first
      if (!isAuthenticated) {
        // Save the recording temporarily and redirect to login
        sessionStorage.setItem('pendingRecording', 'true');
        navigate('/login?redirect=studio');
        return;
      }
      
      // Store the actual audio blob in IndexedDB for better performance with large files
      const storeAudioInIndexedDB = async () => {
        try {
          // Open (or create) the database
          const db = await new Promise<IDBDatabase>((resolve, reject) => {
            const request = indexedDB.open('VoiceTransformerDB', 1);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
            
            // Create object store if it doesn't exist
            request.onupgradeneeded = () => {
              const db = request.result;
              if (!db.objectStoreNames.contains('audioFiles')) {
                db.createObjectStore('audioFiles');
              }
            };
          });
          
          // Store the blob
          await new Promise<void>((resolve, reject) => {
            const transaction = db.transaction(['audioFiles'], 'readwrite');
            const store = transaction.objectStore('audioFiles');
            const request = store.put(audioBlob, 'currentRecording');
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
          });
          
          // Also store a small reference in sessionStorage to indicate we have a recording
          sessionStorage.setItem('hasRecordedAudio', 'true');
          
          // Navigate to studio page
          navigate('/studio?source=recorder');
        } catch (error) {
          console.error('Failed to store audio in IndexedDB:', error);
          
          // Fallback to sessionStorage for smaller files
          try {
            // Convert blob to base64 string
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = () => {
              const base64data = reader.result as string;
              sessionStorage.setItem('recordedAudioData', base64data);
              navigate('/studio?source=recorder');
            };
          } catch (fallbackError) {
            console.error('Fallback storage also failed:', fallbackError);
            alert('Could not save your recording. Please try again.');
          }
        }
      };
      
      storeAudioInIndexedDB();
    }
  };

  return (
    <Card variant="glass" className={`p-6 h-full flex flex-col ${className}`}>
      <h3 className="text-xl font-semibold text-dark-900 dark:text-white mb-4">
        Record Your Voice
      </h3>
      
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        {!isRecording && !recordingComplete ? (
          <div className="flex flex-col items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
              <Mic2 size={32} />
            </div>
            <Button 
              size="lg"
              variant="primary"
              leftIcon={<Mic2 size={20} />}
              onClick={startRecording}
              className="bg-gradient-to-r from-primary-600 to-accent-500 hover:from-primary-700 hover:to-accent-600"
            >
              Start Recording
            </Button>
          </div>
        ) : isRecording ? (
          <div className="flex flex-col items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 animate-pulse">
              <Mic2 size={32} />
            </div>
            <div className="text-center mb-4">
              <p className="text-dark-700 dark:text-dark-300">Recording in progress...</p>
            </div>
            <Button 
              size="lg"
              variant="destructive"
              leftIcon={<Square size={20} />}
              onClick={stopRecording}
            >
              Stop Recording
            </Button>
          </div>
        ) : recordingComplete ? (
          <div className="flex flex-col items-center gap-4 w-full">
            <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
              <Mic2 size={32} />
            </div>
            <div className="text-center mb-4">
              <p className="text-dark-700 dark:text-dark-300">Recording complete!</p>
            </div>
            <div className="flex gap-4 w-full justify-center">
              <Button 
                variant="outline"
                leftIcon={<X size={20} />}
                onClick={cancelRecording}
              >
                Cancel
              </Button>
              <Button 
                variant="primary"
                leftIcon={<ArrowRight size={20} />}
                onClick={proceedToStudio}
                className="bg-gradient-to-r from-primary-600 to-accent-500 hover:from-primary-700 hover:to-accent-600"
              >
                Proceed
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </Card>
  );
};

const mockTrendingVoices = [
  {
    id: '1',
    caption: 'Just tried the new Morgan Freeman voice effect! 🤯',
    audioUrl: '/Back-home.mp3',
    user: {
      id: 'user1',
      displayName: 'Voice Master',
      avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=600',
      isVerified: true
    },
    likes: 12453,
    comments: 289
  },
  {
    id: '2',
    caption: 'My Russian accent transformation is hilarious! 😂',
    audioUrl: '/russian-poem-about-julmust-70666.mp3',
    user: {
      id: 'user2',
      displayName: 'VoiceExplorer',
      avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=600',
      isVerified: false
    },
    likes: 8745,
    comments: 152
  },
  {
    id: '3',
    caption: 'Pitched my voice up for this baby talk challenge 👶',
    audioUrl: 'https://www2.cs.uic.edu/~i101/SoundFiles/BabyElephantWalk60.wav',
    user: {
      id: 'user3',
      displayName: 'AudioMaster',
      avatar: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=600',
      isVerified: true
    },
    likes: 5638,
    comments: 98
  },
  {
    id: '4',
    caption: 'Just made a dramatic trailer voice-over for fun!',
    audioUrl: 'https://www2.cs.uic.edu/~i101/SoundFiles/CantinaBand3.wav',
    user: {
      id: 'user4',
      displayName: 'VoiceCreator',
      avatar: 'https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=600',
      isVerified: false
    },
    likes: 3987,
    comments: 76
  }
];

// Mock data
const mockStats = {
  voicesTransformed: 5234789,
  languages: 85,
  users: 837421,
  dailyVoices: 42891
};

const features = [
  {
    icon: <Wand2 className="h-6 w-6" />,
    title: 'AI Voice Transformation',
    description: 'Transform your voice into any celebrity, accent, or emotion with our advanced AI technology.'
  },
  {
    icon: <Brain className="h-6 w-6" />,
    title: 'Neural Voice Cloning',
    description: 'Create your digital voice twin with just 3 minutes of audio using neural voice cloning.'
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: 'Secure & Private',
    description: 'Enterprise-grade encryption and privacy controls to keep your voice data safe.'
  },
  {
    icon: <Code className="h-6 w-6" />,
    title: 'Developer API',
    description: 'Integrate voice transformation capabilities into your apps with our robust API.'
  }
];

interface TrendingVoiceCardProps {
  voice: typeof mockTrendingVoices[0];
}

const TrendingVoiceCard: React.FC<TrendingVoiceCardProps> = ({ voice }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = React.useRef(null);
  const isInView = useInView(cardRef, { once: true });

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Card 
        variant="glass" 
        isHoverable 
        className="min-w-[300px] max-w-xs flex-shrink-0 relative overflow-hidden"
      >
        <CardContent className="p-4">
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-accent-500/10"
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          />
          
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <Avatar 
                src={voice.user.avatar} 
                alt={voice.user.displayName}
                isVerified={voice.user.isVerified}
                size="sm"
              />
              <div>
                <div className="font-medium text-dark-900 dark:text-white">
                  {voice.user.displayName}
                </div>
                <div className="text-sm text-dark-500 dark:text-dark-400">
                  @{voice.user.displayName.toLowerCase().replace(/\s+/g, '')}
                </div>
              </div>
            </div>
            
            <p className="mb-3 text-dark-800 dark:text-dark-200 text-sm">
              {voice.caption}
            </p>
            
            <div className="mb-3">
              <WaveformVisualizer
                audioUrl={voice.audioUrl}
                isPlaying={isPlaying}
                onPlayPause={togglePlay}
                height={48}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.div 
                  className="flex items-center gap-1 text-dark-600 dark:text-dark-400 text-sm"
                  whileHover={{ scale: 1.1 }}
                >
                  <TrendingUp size={16} />
                  {formatNumber(voice.likes)}
                </motion.div>
                <motion.div 
                  className="flex items-center gap-1 text-dark-600 dark:text-dark-400 text-sm"
                  whileHover={{ scale: 1.1 }}
                >
                  <Award size={16} />
                  {formatNumber(voice.comments)}
                </motion.div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={togglePlay}
                leftIcon={isPlaying ? <span className="text-primary-600">◼</span> : <Play size={16} />}
              >
                {isPlaying ? 'Stop' : 'Play'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const FeatureCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
}> = ({ icon, title, description }) => {
  const cardRef = React.useRef(null);
  const isInView = useInView(cardRef, { once: true });

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
    >
      <Card className="h-full p-6 hover:border-primary-500 transition-colors">
        <div className="flex flex-col items-center text-center">
          <div className="h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 mb-4">
            {icon}
          </div>
          <h3 className="text-lg font-semibold text-dark-900 dark:text-white mb-2">
            {title}
          </h3>
          <p className="text-dark-600 dark:text-dark-400">
            {description}
          </p>
        </div>
      </Card>
    </motion.div>
  );
};

export const HomePage = () => {
  const [recordedAudio, setRecordedAudio] = useState<string | null>(null);
  const [isPlayingRecorded, setIsPlayingRecorded] = useState(false);
  const { scrollYProgress } = useScroll();
  const scaleProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const handleRecordingComplete = (audioBlob: Blob) => {
    const url = URL.createObjectURL(audioBlob);
    setRecordedAudio(url);
  };

  const toggleRecordedPlayback = () => {
    setIsPlayingRecorded(!isPlayingRecorded);
  };

  // Parallax effect for hero section
  const heroRef = React.useRef(null);
  const { scrollY } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  const y = useTransform(scrollY, [0, 300], [0, 100]);

  return (
    <div className="pb-16">
      {/* Progress bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-primary-600 dark:bg-primary-500 transform-origin-0 z-50"
        style={{ scaleX: scaleProgress }}
      />

      {/* Hero section */}
      <section ref={heroRef} className="relative min-h-screen py-20 bg-gradient-mesh dark:bg-dark-950 overflow-hidden">
        <motion.div 
          className="audio-particles"
          style={{ y }}
        >
          <div className="audio-particle"></div>
          <div className="audio-particle"></div>
          <div className="audio-particle"></div>
          <div className="audio-particle"></div>
        </motion.div>
        
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1">
              <motion.h1 
                className="text-5xl sm:text-6xl md:text-7xl font-display font-bold mb-6 text-dark-900 dark:text-white"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                Transform Your Voice <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-accent-500">
                  Into Magic
                </span>
              </motion.h1>
              <motion.p 
                className="text-xl text-dark-700 dark:text-dark-300 mb-8 max-w-xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                Create, transform, and share voice content with cutting-edge AI technology. 
                Choose from celebrity voices, emotions, or languages.
              </motion.p>
              <motion.div 
                className="flex flex-wrap gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Button 
                  size="lg" 
                  leftIcon={<Mic2 size={20} />}
                  as={Link}
                  to="/studio"
                  className="bg-gradient-to-r from-primary-600 to-accent-500 hover:from-primary-700 hover:to-accent-600"
                >
                  Start Recording
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  leftIcon={<Play size={20} />}
                  as={Link}
                  to="/feed"
                >
                  Explore Voices
                </Button>
              </motion.div>
            </div>
            <motion.div 
              className="flex-1 max-w-md relative"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="relative">
                <img 
                  src="https://images.pexels.com/photos/2105416/pexels-photo-2105416.jpeg?auto=compress&cs=tinysrgb&w=600" 
                  alt="Person with headphones and microphone" 
                  className="rounded-2xl shadow-xl"
                />
                <motion.div
                  className="absolute -inset-4 border-2 border-primary-500 rounded-2xl"
                  animate={{
                    scale: [1, 1.05, 1],
                    opacity: [0.3, 0.6, 0.3]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50 dark:bg-dark-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-4 text-dark-900 dark:text-white">
                Powered by Advanced{' '}
                <span className="text-primary-600 dark:text-primary-400">AI Technology</span>
              </h2>
              <p className="text-lg text-dark-700 dark:text-dark-300 max-w-2xl mx-auto">
                Experience the future of voice transformation with our cutting-edge features
              </p>
            </motion.div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Live Demo Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-4 text-dark-900 dark:text-white">
                Try It <span className="text-primary-600 dark:text-primary-400">Yourself</span>
              </h2>
              <p className="text-lg text-dark-700 dark:text-dark-300 max-w-2xl mx-auto">
                Record your voice and experience real-time transformation with our AI technology.
              </p>
            </motion.div>
          </div>
          
          <div className="max-w-3xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <motion.div 
                className="flex flex-col gap-4"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <EnhancedAudioRecorder 
                  onRecordingComplete={handleRecordingComplete}
                  className="h-full"
                />
              </motion.div>
              <motion.div 
                className="flex flex-col gap-4"
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <Card variant="glass" className="p-6 h-full flex flex-col">
                  <h3 className="text-xl font-semibold text-dark-900 dark:text-white mb-4">
                    {recordedAudio ? 'Your Transformed Voice' : 'Record to Transform'}
                  </h3>
                  
                  {recordedAudio ? (
                    <div className="flex-1 flex flex-col">
                      <div className="mb-4 flex-1">
                        <WaveformVisualizer
                          audioUrl={recordedAudio}
                          isPlaying={isPlayingRecorded}
                          onPlayPause={toggleRecordedPlayback}
                        />
                      </div>
                      <div className="flex justify-between">
                        <Button
                          variant={isPlayingRecorded ? 'outline' : 'primary'}
                          leftIcon={isPlayingRecorded ? <span>◼</span> : <Play size={16} />}
                          onClick={toggleRecordedPlayback}
                        >
                          {isPlayingRecorded ? 'Stop' : 'Play'}
                        </Button>
                        <Button
                          variant="accent"
                          leftIcon={<Zap size={16} />}
                          onClick={() => {
                            // Store the audio in IndexedDB before navigating
                            if (recordedAudio) {
                              // Convert URL back to blob
                              fetch(recordedAudio)
                                .then(res => res.blob())
                                .then(blob => {
                                  // Store in IndexedDB
                                  const request = indexedDB.open('VoiceTransformerDB', 1);
                                  
                                  request.onupgradeneeded = () => {
                                    const db = request.result;
                                    if (!db.objectStoreNames.contains('audioFiles')) {
                                      db.createObjectStore('audioFiles');
                                    }
                                  };
                                  
                                  request.onsuccess = () => {
                                    const db = request.result;
                                    const transaction = db.transaction(['audioFiles'], 'readwrite');
                                    const store = transaction.objectStore('audioFiles');
                                    store.put(blob, 'currentRecording');
                                    
                                    // Navigate to studio
                                    window.location.href = '/studio?source=recorder';
                                  };
                                })
                                .catch(err => {
                                  console.error('Error storing audio:', err);
                                  // Fallback to direct navigation
                                  window.location.href = '/studio';
                                });
                            } else {
                              window.location.href = '/studio';
                            }
                          }}
                        >
                          Try More Effects
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 text-dark-500 dark:text-dark-400">
                      <Mic2 size={48} className="opacity-40" />
                      <p>Record your voice first to see the transformation</p>
                    </div>
                  )}
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Trending Content */}
      <section className="py-20 bg-gray-50 dark:bg-dark-900">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl md:text-4xl font-display font-bold text-dark-900 dark:text-white">
                Trending Voices
              </h2>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <Button 
                variant="outline" 
                as={Link} 
                to="/voices"
                rightIcon={<Play size={16} />}
              >
                View All
              </Button>
            </motion.div>
          </div>
          
          <div className="flex gap-6 overflow-x-auto pb-4 snap-x">
            {mockTrendingVoices.map((voice) => (
              <TrendingVoiceCard key={voice.id} voice={voice} />
            ))}
          </div>
        </div>
      </section>

      {/* Global Stats */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-4 text-dark-900 dark:text-white">
                Global <span className="text-primary-600 dark:text-primary-400">Impact</span>
              </h2>
              <p className="text-lg text-dark-700 dark:text-dark-300 max-w-2xl mx-auto">
                Join millions of users transforming their voices and creating amazing content.
              </p>
            </motion.div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <Mic2 size={24} />, label: 'Voices Transformed', value: mockStats.voicesTransformed },
              { icon: <Globe size={24} />, label: 'Languages', value: mockStats.languages },
              { icon: <Users size={24} />, label: 'Active Users', value: mockStats.users },
              { icon: <TrendingUp size={24} />, label: 'Daily Voices', value: mockStats.dailyVoices }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card variant="glass" className="h-full">
                  <CardContent className="p-6 text-center">
                    <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 mb-4">
                      {stat.icon}
                    </div>
                    <motion.h3 
                      className="text-2xl sm:text-3xl font-bold text-dark-900 dark:text-white mb-2"
                      initial={{ opacity: 0, scale: 0.5 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ 
                        type: "spring",
                        duration: 1.5,
                        delay: index * 0.2
                      }}
                    >
                      {formatNumber(stat.value)}
                    </motion.h3>
                    <p className="text-dark-600 dark:text-dark-400">
                      {stat.label}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-accent-500 dark:from-primary-900 dark:to-accent-900">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-6 text-white">
              Ready to Transform Your Voice?
            </h2>
            <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
              Join thousands of creators making magic with their voices every day.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button 
                size="lg" 
                className="bg-white text-primary-600 hover:bg-primary-50"
                leftIcon={<Sparkles size={20} />}
                as={Link}
                to="/signup"
              >
                Get Started Free
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-white text-white hover:bg-primary-700"
                leftIcon={<Play size={20} />}
                as={Link}
                to="/feed"
              >
                Explore Voices
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};