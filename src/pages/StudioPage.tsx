import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { voiceAPI, translationAPI, uploadAPI } from '../lib/api';
import {
  Mic2,
  Wand2,
  Share2,
  Save,
  Download,
  Settings,
  Sliders,
  Volume2,
  Clock,
  Music,
  Layers,
  RefreshCw,
  Sparkles,
  Crown,
  Star,
  Award,
  Lock,
  Globe,
  Smile,
  Frown,
  Angry,
  Meh,
  X,
  AlertTriangle,
  ArrowRight,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Info
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { AudioRecorder } from '../components/audio/AudioRecorder';
import { AudioPlayer } from '../components/audio/AudioPlayer';
import { IconButton } from '../components/ui/IconButton';
import { useSubscriptionStore } from '../store/subscriptionStore';

// Voice effect types
interface VoiceEffect {
  id: string;
  effectId: string;
  name: string;
  category: string;
  description?: string;
  popularity: number;
  isProOnly: boolean;
  elevenLabsVoiceId?: string;
}

// ElevenLabs voice model interface
interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category?: string;
  description?: string;
  preview_url?: string;
  labels?: Record<string, string>;
  available_for_tiers: string[];
  settings?: {
    stability: number;
    similarity_boost: number;
    style?: number;
    use_speaker_boost?: boolean;
  };
}

// Voice cloning interface
interface VoiceCloneOptions {
  name: string;
  description?: string;
  stability?: number;
  similarity_boost?: number;
  style?: number;
  use_speaker_boost?: boolean;
}

// Default voice effects (will be replaced with API data)
const defaultVoiceEffects = [
  // Celebrity voices
  { id: 'morgan', effectId: 'morgan', name: 'Morgan Freeman', category: 'celebrity', popularity: 98, isProOnly: true, icon: 'star' },
  { id: 'david', effectId: 'david', name: 'David Attenborough', category: 'celebrity', popularity: 95, isProOnly: true, icon: 'star' },
  { id: 'obama', effectId: 'obama', name: 'Barack Obama', category: 'celebrity', popularity: 96, isProOnly: true, icon: 'star' },
  { id: 'beyonce', effectId: 'beyonce', name: 'Beyoncé', category: 'celebrity', popularity: 97, isProOnly: true, icon: 'star' },
  { id: 'oprah', effectId: 'oprah', name: 'Oprah Winfrey', category: 'celebrity', popularity: 94, isProOnly: true, icon: 'star' },
  
  // Emotion voices
  { id: 'happy', effectId: 'happy', name: 'Happy', category: 'emotion', popularity: 85, isProOnly: false, icon: 'smile' },
  { id: 'sad', effectId: 'sad', name: 'Sad', category: 'emotion', popularity: 78, isProOnly: false, icon: 'frown' },
  { id: 'angry', effectId: 'angry', name: 'Angry', category: 'emotion', popularity: 80, isProOnly: false, icon: 'angry' },
  { id: 'calm', effectId: 'calm', name: 'Calm', category: 'emotion', popularity: 82, isProOnly: false, icon: 'meh' },
  { id: 'excited', effectId: 'excited', name: 'Excited', category: 'emotion', popularity: 83, isProOnly: false, icon: 'smile' },
  
  // Language accents
  { id: 'french', effectId: 'french', name: 'French Accent', category: 'language', popularity: 92, isProOnly: false, icon: 'globe' },
  { id: 'german', effectId: 'german', name: 'German Accent', category: 'language', popularity: 88, isProOnly: false, icon: 'globe' },
  { id: 'spanish', effectId: 'spanish', name: 'Spanish Accent', category: 'language', popularity: 90, isProOnly: false, icon: 'globe' },
  { id: 'british', effectId: 'british', name: 'British Accent', category: 'language', popularity: 91, isProOnly: false, icon: 'globe' },
  { id: 'australian', effectId: 'australian', name: 'Australian Accent', category: 'language', popularity: 87, isProOnly: false, icon: 'globe' }
];

const audioSettings = [
  { id: 'pitch', name: 'Pitch', min: -12, max: 12, step: 1, default: 0 },
  { id: 'formant', name: 'Formant', min: -12, max: 12, step: 1, default: 0 },
  { id: 'reverb', name: 'Reverb', min: 0, max: 100, step: 1, default: 0 },
  { id: 'delay', name: 'Delay', min: 0, max: 100, step: 1, default: 0 }
];

// Interface for audio file
interface AudioFile {
  id: string;
  originalFilename: string;
  storagePath: string;
  fileSize: number;
  duration: number;
  mimeType: string;
  isPublic: boolean;
}

// Interface for transformation
interface Transformation {
  id: string;
  sourceAudioId: string;
  transformedAudioId?: string;
  effectId: string;
  effectName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage?: string;
}

// Interface for language
interface Language {
  code: string;
  name: string;
  nativeName: string;
}

export const StudioPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isPro, fetchSubscription } = useSubscriptionStore();
  const [recordedAudio, setRecordedAudio] = useState<string | null>(null);
  const [selectedEffect, setSelectedEffect] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
    const [activeTab, setActiveTab] = useState<'effects' | 'settings'>('effects');
  const [settings, setSettings] = useState<Record<string, number>>(
    audioSettings.reduce((acc, setting) => ({ ...acc, [setting.id]: setting.default }), {})
  );
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isSaving, setIsSaving] = useState(false);
  const [showTutorial, setShowTutorial] = useState(true);
  
  // New state for API integration
  const [voiceEffects, setVoiceEffects] = useState<VoiceEffect[]>(defaultVoiceEffects);
  const [emotionVoices, setEmotionVoices] = useState<VoiceEffect[]>([]);
  const [audioFile, setAudioFile] = useState<AudioFile | null>(null);
  const [transformation, setTransformation] = useState<Transformation | null>(null);
  const [transformedAudio, setTransformedAudio] = useState<string | null>(null);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [isTranslating, setIsTranslating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [emotionTransformation, setEmotionTransformation] = useState<Transformation | null>(null);
  const [savedVoiceCreations, setSavedVoiceCreations] = useState<any[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveFormData, setSaveFormData] = useState({
    name: '',
    description: '',
    isPublic: false,
    tags: [] as string[]
  });
  const [isSavingVoice, setIsSavingVoice] = useState(false);
  
  // New state for ElevenLabs voice cloning
  const [elevenLabsVoices, setElevenLabsVoices] = useState<ElevenLabsVoice[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(null);
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);
  const [isCloning, setIsCloning] = useState(false);
  const [cloneOptions, setCloneOptions] = useState<VoiceCloneOptions>({
    name: 'My Custom Voice',
    stability: 0.5,
    similarity_boost: 0.75,
    use_speaker_boost: true
  });
  const [showVoiceCloning, setShowVoiceCloning] = useState(false);
  
  // New state for enhanced recording functionality
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [showRecordingControls, setShowRecordingControls] = useState(false);
  const [translationInProgress, setTranslationInProgress] = useState(false);
  const [translatedAudio, setTranslatedAudio] = useState<string | null>(null);
  const [translationError, setTranslationError] = useState<string | null>(null);
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  // Enhanced state for settings functionality
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [audioSource, setAudioSource] = useState<AudioBufferSourceNode | null>(null);
  const [gainNode, setGainNode] = useState<GainNode | null>(null);
  const [reverbNode, setReverbNode] = useState<ConvolverNode | null>(null);
  const [delayNode, setDelayNode] = useState<DelayNode | null>(null);
  const [isApplyingSettings, setIsApplyingSettings] = useState(false);
  const [previewAudio, setPreviewAudio] = useState<string | null>(null);
  const [settingsChanged, setSettingsChanged] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Check if we're coming from the recorder
  const isFromRecorder = new URLSearchParams(location.search).get('source') === 'recorder';
  
  // Load audio from IndexedDB when coming from recorder
  // Load voice effects from API and subscription data
  useEffect(() => {
    const fetchVoiceEffects = async () => {
      try {
        const response = await voiceAPI.getVoiceEffects();
        if (response.status === 'success' && response.data) {
          setVoiceEffects(response.data);
        }
      } catch (error) {
        console.error('Error fetching voice effects:', error);
        // Fallback to default effects
        setVoiceEffects(defaultVoiceEffects);
      }
    };
    
    const fetchEmotionVoices = async () => {
      try {
        const response = await voiceAPI.getEmotionVoices();
        if (response.status === 'success' && response.data) {
          setEmotionVoices(response.data);
        }
      } catch (error) {
        console.error('Error fetching emotion voices:', error);
        // Fallback to default emotion effects
        const defaultEmotions = defaultVoiceEffects.filter(effect => effect.category === 'emotion');
        setEmotionVoices(defaultEmotions);
      }
    };
    
    fetchVoiceEffects();
    fetchEmotionVoices();
    fetchSavedVoiceCreations();
    fetchSubscription(); // Fetch subscription data to check Pro status
  }, [fetchSubscription]);
  
  // Load saved voice creations
  const fetchSavedVoiceCreations = async () => {
    try {
      const response = await voiceAPI.getSavedVoiceCreations({ limit: 20 });
      if (response.status === 'success' && response.data) {
        setSavedVoiceCreations(response.data.savedVoiceCreations || []);
      }
    } catch (error) {
      console.error('Error fetching saved voice creations:', error);
    }
  };
  
  // Load ElevenLabs voices
  useEffect(() => {
    const fetchElevenLabsVoices = async () => {
      try {
        setIsLoadingVoices(true);
        const response = await voiceAPI.getElevenLabsVoices();
        if (response.status === 'success' && response.data) {
          setElevenLabsVoices(response.data);
          // Set default voice if available
          if (response.data.length > 0) {
            setSelectedVoiceId(response.data[0].voice_id);
          }
        }
      } catch (error) {
        console.error('Error fetching ElevenLabs voices:', error);
      } finally {
        setIsLoadingVoices(false);
      }
    };
    
    fetchElevenLabsVoices();
  }, []);
  
  // Load supported languages from API
  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const response = await translationAPI.getSupportedLanguages();
        if (response.status === 'success' && response.data) {
          setLanguages(response.data.languages || []);
        }
      } catch (error) {
        console.error('Error fetching languages:', error);
      }
    };
    
    fetchLanguages();
  }, []);
  
  // Load recorded audio from storage
  useEffect(() => {
    const loadRecordedAudio = async () => {
      if (isFromRecorder) {
        try {
          // First try to get from IndexedDB
          const db = await new Promise<IDBDatabase>((resolve, reject) => {
            const request = indexedDB.open('VoiceTransformerDB', 1);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
          });
          
          const transaction = db.transaction(['audioFiles'], 'readonly');
          const store = transaction.objectStore('audioFiles');
          const request = store.get('currentRecording');
          
          request.onsuccess = () => {
            if (request.result) {
              const audioBlob = request.result;
              setShowTutorial(false);
              
              // Upload the audio to the server
              uploadAudioToServer(audioBlob);
            } else {
              // If not in IndexedDB, try sessionStorage fallback
              const base64Audio = sessionStorage.getItem('recordedAudioData');
              if (base64Audio) {
                // Convert base64 to blob
                const byteString = atob(base64Audio.split(',')[1]);
                const mimeString = base64Audio.split(',')[0].split(':')[1].split(';')[0];
                const ab = new ArrayBuffer(byteString.length);
                const ia = new Uint8Array(ab);
                
                for (let i = 0; i < byteString.length; i++) {
                  ia[i] = byteString.charCodeAt(i);
                }
                
                const blob = new Blob([ab], { type: mimeString });
                setShowTutorial(false);
                
                // Upload the audio to the server
                uploadAudioToServer(blob);
              }
            }
          };
          
          request.onerror = (event) => {
            console.error('Error loading audio from IndexedDB:', event);
          };
        } catch (error) {
          console.error('Failed to load audio from storage:', error);
        }
      }
    };
    
    loadRecordedAudio();
  }, [isFromRecorder]);
  
  // Upload audio to server
  const uploadAudioToServer = async (audioBlob: Blob, calculatedDuration?: number) => {
    try {
      // Determine the correct filename based on the blob's MIME type
      let filename = 'recording.wav'; // default
      if (audioBlob.type.includes('webm')) {
        filename = 'recording.webm';
      } else if (audioBlob.type.includes('ogg')) {
        filename = 'recording.ogg';
      } else if (audioBlob.type.includes('mp3') || audioBlob.type.includes('mpeg')) {
        filename = 'recording.mp3';
      }
      
      console.log(`Creating file with name: ${filename}, type: ${audioBlob.type}`);
      
      // Create a File object from the Blob with metadata
      const file = new File([audioBlob], filename, { 
        type: audioBlob.type,
        lastModified: Date.now()
      });
      
      // Create form data with additional metadata
      const formData = new FormData();
      formData.append('audio', file);
      
      // Add duration metadata if available
      if (calculatedDuration) {
        formData.append('duration', calculatedDuration.toString());
      }
      
      // Upload the file
      const response = await uploadAPI.uploadAudio(file);
      
      if (response.status === 'success' && response.data) {
        // If the API returned a duration of 0, update it with our calculated duration
        if (response.data.duration === 0 && calculatedDuration) {
          response.data.duration = calculatedDuration;
        }
        
        setAudioFile(response.data);
        setAudioDuration(response.data.duration || calculatedDuration || 0);
        
        // Use the public URL from the server response instead of blob URL
        if (response.data.publicUrl || response.data.url) {
          const publicUrl = response.data.publicUrl || response.data.url;
          setRecordedAudio(publicUrl);
          console.log('Using public URL for audio:', publicUrl);
        }
        console.log('Audio file uploaded successfully:', response.data);
      } else {
        console.error('Upload API returned unsuccessful status:', response);
        setErrorMessage('Failed to upload audio: API returned unsuccessful status');
      }
    } catch (error) {
      console.error('Error uploading audio:', error);
      setErrorMessage('Failed to upload audio to server');
      
      // For development purposes, create a mock audio file
      if (process.env.NODE_ENV === 'development') {
      console.log('Creating mock audio file for development');
      
      // Determine the correct filename and path based on the blob's MIME type
      let filename = 'recording.wav';
      let storagePath = '/uploads/audio/original/mock_recording.wav';
      if (audioBlob.type.includes('webm')) {
      filename = 'recording.webm';
      storagePath = '/uploads/audio/original/mock_recording.webm';
      } else if (audioBlob.type.includes('ogg')) {
      filename = 'recording.ogg';
      storagePath = '/uploads/audio/original/mock_recording.ogg';
      } else if (audioBlob.type.includes('mp3') || audioBlob.type.includes('mpeg')) {
      filename = 'recording.mp3';
      storagePath = '/uploads/audio/original/mock_recording.mp3';
      }
      
      const mockAudioFile = {
      id: 'mock-audio-' + Date.now(),
      originalFilename: filename,
      storagePath: storagePath,
      fileSize: audioBlob.size,
      duration: calculatedDuration || 5,
      mimeType: audioBlob.type,
      isPublic: false,
      userId: 'dev-user-id'
      };
      setAudioFile(mockAudioFile as AudioFile);
      setAudioDuration(calculatedDuration || 5);
      }
    }
  };

  const proFeatures = [
    'Unlimited voice transformations',
    'Advanced audio settings',
    'Priority processing',
    'Custom voice models',
    'No watermark'
  ];

  const handleRecordingComplete = (audioBlob: Blob) => {
    setShowTutorial(false);
    setRecordingBlob(audioBlob);
    
    // Calculate duration based on recording start time
    if (recordingStartTime) {
      const duration = (Date.now() - recordingStartTime) / 1000; // Convert to seconds
      setAudioDuration(duration);
      
      // Determine the correct filename based on the blob's MIME type
      let filename = 'recording.wav'; // default
      if (audioBlob.type.includes('webm')) {
      filename = 'recording.webm';
      } else if (audioBlob.type.includes('ogg')) {
      filename = 'recording.ogg';
      } else if (audioBlob.type.includes('mp3') || audioBlob.type.includes('mpeg')) {
      filename = 'recording.mp3';
      }
      
      // Create a new blob with duration metadata
      const audioWithDuration = new File([audioBlob], filename, {
      type: audioBlob.type,
      lastModified: Date.now()
      });
      
      // Upload the audio to the server with the calculated duration
      uploadAudioToServer(audioWithDuration, duration);
    } else {
      // Fallback if recordingStartTime is not available
      uploadAudioToServer(audioBlob);
    }
    
    // Reset recording state
    setRecordingStartTime(null);
    setShowRecordingControls(false);
  };
  
  // New function to handle starting a recording
  const startNewRecording = () => {
    setIsRecording(true);
    setRecordingStartTime(Date.now());
    setShowRecordingControls(true);
    setErrorMessage(null);
    setTranslationError(null);
    setRecordingDuration(0);
  };
  
  // New function to cancel recording
  const cancelRecording = () => {
    setIsRecording(false);
    setRecordingStartTime(null);
    setShowRecordingControls(false);
    setErrorMessage(null);
    setTranslationError(null);
  };

  const handleEffectSelect = async (effectId: string) => {
    setSelectedEffect(effectId);
    setIsProcessing(true);
    setErrorMessage(null);
    
    // Check if we have an audio file to transform
    if (!audioFile) {
      setIsProcessing(false);
      setErrorMessage('No audio file available for transformation');
      return;
    }
    
    try {
      // Start the transformation process
      const response = await voiceAPI.transformAudio(
        audioFile.id,
        effectId,
        settings
      );
      
      if (response.status === 'success' && response.data) {
        setTransformation({
          id: response.data.transformationId,
          sourceAudioId: audioFile.id,
          effectId,
          effectName: voiceEffects.find(effect => effect.effectId === effectId)?.name || '',
          status: 'processing'
        });
        
        // Poll for transformation status
        pollTransformationStatus(response.data.transformationId);
      } else {
        setIsProcessing(false);
        setErrorMessage('Failed to start transformation: ' + (response.message || 'Unknown error'));
        console.error('API returned unsuccessful status:', response);
      }
    } catch (error) {
      console.error('Error transforming audio:', error);
      setIsProcessing(false);
      
      // Extract the error message from the API response if available
      let errorMsg = 'Error transforming audio';
      if (error.response && error.response.data) {
        errorMsg = error.response.data.message || errorMsg;
      }
      
      setErrorMessage(errorMsg);
      
      // For development purposes, simulate a successful transformation
      console.log('Simulating successful transformation in development mode');
      setTimeout(() => {
        setTransformedAudio(recordedAudio);
        setIsProcessing(false);
        setErrorMessage('Development mode: Using original audio as transformed audio');
      }, 2000);
    }
  };
  
    
  // Handle voice cloning
  const handleVoiceClone = async () => {
    if (!audioFile) {
      setErrorMessage('No audio file available for voice cloning');
      return;
    }
    
    setIsCloning(true);
    setErrorMessage(null);
    
    try {
      const response = await voiceAPI.cloneVoice(
        cloneOptions.name,
        cloneOptions.description || '',
        audioFile.id
      );
      
      if (response.status === 'success' && response.data) {
        // Set the cloned voice as the selected voice
        setSelectedVoiceId(response.data.elevenLabsVoiceId);
        setShowVoiceCloning(false);
        
        // Show success message
        setErrorMessage('Voice cloned successfully! You can now use it for transformations.');
      } else {
        setErrorMessage('Failed to clone voice');
      }
    } catch (error) {
      console.error('Error cloning voice:', error);
      setErrorMessage('Error cloning voice. Please try again.');
    } finally {
      setIsCloning(false);
    }
  };
  
  // Handle voice selection
  const handleVoiceSelect = (voiceId: string) => {
    setSelectedVoiceId(voiceId);
  };
  
  // Poll for transformation status
  const pollTransformationStatus = async (transformationId: string) => {
    try {
      console.log('Polling transformation status for ID:', transformationId);
      const response = await voiceAPI.getTransformationStatus(transformationId);
      
      if (response.status === 'success' && response.data) {
        const transformationData = response.data;
        console.log('Transformation status update:', transformationData);
        setTransformation(transformationData);
        
        if (transformationData.status === 'completed' && transformationData.transformedAudioId) {
          // Transformation is complete, get the transformed audio URL
          setIsProcessing(false);
          
          // Create a URL for the transformed audio using the full domain URL
          // Use the same base URL as the original audio file
          const baseUrl = recordedAudio?.includes('https://') 
            ? recordedAudio.split('/api/audio/')[0] 
            : window.location.origin;
          const transformedAudioUrl = `${baseUrl}/api/audio/${transformationData.transformedAudioId}`;
          console.log('Setting transformed audio URL:', transformedAudioUrl);
          
          // Test if the transformed audio URL is accessible before setting it
          fetch(transformedAudioUrl, { method: 'HEAD' })
            .then(response => {
              console.log('Transformed audio URL test:', {
                url: transformedAudioUrl,
                status: response.status,
                contentType: response.headers.get('content-type'),
                contentLength: response.headers.get('content-length')
              });
              
              if (response.ok) {
                setTransformedAudio(transformedAudioUrl);
                // Clear any error messages on successful completion
                setErrorMessage(null);
                console.log('Celebrity voice transformation completed successfully!');
              } else {
                console.error('Transformed audio URL not accessible:', response.status, response.statusText);
                setErrorMessage(`Transformed audio not accessible (HTTP ${response.status})`);
              }
            })
            .catch(error => {
              console.error('Error testing transformed audio URL:', error);
              // Still set the URL, let the audio player handle the error
              setTransformedAudio(transformedAudioUrl);
              setErrorMessage(null);
              console.log('Celebrity voice transformation completed (URL test failed, but proceeding)');
            });
        } else if (transformationData.status === 'failed') {
          setIsProcessing(false);
          const errorMsg = transformationData.errorMessage || 'Transformation failed';
          console.error('Transformation failed:', errorMsg);
          setErrorMessage(errorMsg);
        } else if (transformationData.status === 'processing' || transformationData.status === 'pending') {
          // Continue polling every 2 seconds
          console.log('Transformation still processing, will poll again in 2 seconds...');
          setTimeout(() => pollTransformationStatus(transformationId), 2000);
        }
      } else {
        setIsProcessing(false);
        const errorMsg = 'Failed to get transformation status';
        console.error(errorMsg, response);
        setErrorMessage(errorMsg);
      }
    } catch (error) {
      console.error('Error polling transformation status:', error);
      setIsProcessing(false);
      setErrorMessage('Error checking transformation status: ' + (error.message || 'Unknown error'));
    }
  };
  
  
  // Handle emotion effect selection
  const handleEmotionSelect = async (emotionId: string) => {
    setSelectedEmotion(emotionId);
    setIsProcessing(true);
    setErrorMessage(null);
    
    // Check if we have an audio file to transform
    if (!audioFile) {
      setIsProcessing(false);
      setErrorMessage('No audio file available for emotion transformation');
      return;
    }
    
    try {
      // Start the emotion transformation process
      const response = await voiceAPI.transformWithEmotion(
        audioFile.id,
        emotionId,
        settings
      );
      
      if (response.status === 'success' && response.data) {
        setEmotionTransformation({
          id: response.data.transformationId,
          sourceAudioId: audioFile.id,
          effectId: emotionId,
          effectName: emotionVoices.find(voice => voice.effectId === emotionId)?.name || '',
          status: 'processing'
        });
        
        // Poll for emotion transformation status
        pollEmotionTransformationStatus(response.data.transformationId);
      } else {
        setIsProcessing(false);
        setErrorMessage('Failed to start emotion transformation: ' + (response.message || 'Unknown error'));
        console.error('API returned unsuccessful status:', response);
      }
    } catch (error) {
      console.error('Error transforming audio with emotion:', error);
      setIsProcessing(false);
      
      // Extract the error message from the API response if available
      let errorMsg = 'Error applying emotion effect';
      if (error.response && error.response.data) {
        errorMsg = error.response.data.message || errorMsg;
      }
      
      setErrorMessage(errorMsg);
      
      // For development purposes, simulate a successful transformation
      console.log('Simulating successful emotion transformation in development mode');
      setTimeout(() => {
        setTransformedAudio(recordedAudio);
        setIsProcessing(false);
        setErrorMessage('Development mode: Using original audio as transformed audio');
      }, 2000);
    }
  };
  
  // Poll for emotion transformation status
  const pollEmotionTransformationStatus = async (transformationId: string) => {
    try {
      const response = await voiceAPI.getEmotionTransformationStatus(transformationId);
      
      if (response.status === 'success' && response.data) {
        const transformationData = response.data;
        setEmotionTransformation(transformationData);
        
        if (transformationData.status === 'completed' && transformationData.transformedAudioId) {
          // Emotion transformation is complete
          setIsProcessing(false);
          
          // Use the audioUrl from the response if available, otherwise construct it
          const audioUrl = transformationData.audioUrl || `/api/audio/transformed/${transformationData.transformedAudioId}`;
          setTransformedAudio(audioUrl);
        } else if (transformationData.status === 'failed') {
          setIsProcessing(false);
          setErrorMessage(transformationData.errorMessage || 'Emotion transformation failed');
        } else if (transformationData.status === 'processing' || transformationData.status === 'pending') {
          // Continue polling
          setTimeout(() => pollEmotionTransformationStatus(transformationId), 2000);
        }
      } else {
        setIsProcessing(false);
        setErrorMessage('Failed to get emotion transformation status');
      }
    } catch (error) {
      console.error('Error polling emotion transformation status:', error);
      setIsProcessing(false);
      setErrorMessage('Error checking emotion transformation status');
    }
  };

  // Initialize Web Audio API context
  const initializeAudioContext = async () => {
    if (!audioContext) {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      setAudioContext(ctx);
      
      // Create audio nodes
      const gain = ctx.createGain();
      const delay = ctx.createDelay(1.0);
      const reverb = ctx.createConvolver();
      
      setGainNode(gain);
      setDelayNode(delay);
      setReverbNode(reverb);
      
      // Create impulse response for reverb
      const impulseResponse = createImpulseResponse(ctx, 2, 2, false);
      reverb.buffer = impulseResponse;
      
      return { ctx, gain, delay, reverb };
    }
    return { ctx: audioContext, gain: gainNode, delay: delayNode, reverb: reverbNode };
  };
  
  // Create impulse response for reverb effect
  const createImpulseResponse = (context: AudioContext, duration: number, decay: number, reverse: boolean) => {
    const sampleRate = context.sampleRate;
    const length = sampleRate * duration;
    const impulse = context.createBuffer(2, length, sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        const n = reverse ? length - i : i;
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
      }
    }
    
    return impulse;
  };
  
  // Apply audio settings with real-time processing
  const applyAudioSettings = async (audioUrl: string, settingsToApply: Record<string, number>) => {
    try {
      setIsApplyingSettings(true);
      
      const { ctx, gain, delay, reverb } = await initializeAudioContext();
      if (!ctx || !gain || !delay || !reverb) return null;
      
      // Fetch and decode audio data
      const response = await fetch(audioUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      
      // Create offline context for processing
      const offlineCtx = new OfflineAudioContext(
        audioBuffer.numberOfChannels,
        audioBuffer.length,
        audioBuffer.sampleRate
      );
      
      // Create nodes in offline context
      const source = offlineCtx.createBufferSource();
      const offlineGain = offlineCtx.createGain();
      const offlineDelay = offlineCtx.createDelay(1.0);
      const offlineReverb = offlineCtx.createConvolver();
      const merger = offlineCtx.createChannelMerger(2);
      
      // Set up reverb
      const impulse = createImpulseResponse(offlineCtx, 2, 2, false);
      offlineReverb.buffer = impulse;
      
      // Apply settings
      source.buffer = audioBuffer;
      
      // Apply pitch (simulated with playback rate)
      const pitchFactor = Math.pow(2, settingsToApply.pitch / 12);
      source.playbackRate.value = pitchFactor;
      
      // Apply gain/volume
      offlineGain.gain.value = Math.pow(10, settingsToApply.formant / 20);
      
      // Apply delay
      offlineDelay.delayTime.value = settingsToApply.delay / 1000;
      
      // Connect nodes
      source.connect(offlineGain);
      
      // Dry signal
      offlineGain.connect(merger, 0, 0);
      offlineGain.connect(merger, 0, 1);
      
      // Wet signal with reverb
      if (settingsToApply.reverb > 0) {
        const reverbGain = offlineCtx.createGain();
        reverbGain.gain.value = settingsToApply.reverb / 100;
        offlineGain.connect(offlineReverb);
        offlineReverb.connect(reverbGain);
        reverbGain.connect(merger, 0, 0);
        reverbGain.connect(merger, 0, 1);
      }
      
      // Delay effect
      if (settingsToApply.delay > 0) {
        const delayGain = offlineCtx.createGain();
        delayGain.gain.value = 0.3;
        offlineGain.connect(offlineDelay);
        offlineDelay.connect(delayGain);
        delayGain.connect(merger, 0, 0);
        delayGain.connect(merger, 0, 1);
      }
      
      merger.connect(offlineCtx.destination);
      
      // Render audio
      source.start(0);
      const renderedBuffer = await offlineCtx.startRendering();
      
      // Convert to blob URL
      const audioData = bufferToWave(renderedBuffer);
      const blob = new Blob([audioData], { type: 'audio/wav' });
      const processedUrl = URL.createObjectURL(blob);
      
      setIsApplyingSettings(false);
      return processedUrl;
      
    } catch (error) {
      console.error('Error applying audio settings:', error);
      setIsApplyingSettings(false);
      return null;
    }
  };
  
  // Convert AudioBuffer to WAV format
  const bufferToWave = (buffer: AudioBuffer) => {
    const length = buffer.length;
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
    const view = new DataView(arrayBuffer);
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * numberOfChannels * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * 2, true);
    view.setUint16(32, numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * numberOfChannels * 2, true);
    
    // Convert float samples to 16-bit PCM
    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += 2;
      }
    }
    
    return arrayBuffer;
  };
  
  // Enhanced settings change handler with real-time preview
  const handleSettingChange = async (settingId: string, value: number) => {
    const newSettings = { ...settings, [settingId]: value };
    setSettings(newSettings);
    setSettingsChanged(true);
    
    // Apply settings in real-time if audio is available
    if (recordedAudio && activeTab === 'settings') {
      const processedAudio = await applyAudioSettings(recordedAudio, newSettings);
      if (processedAudio) {
        setPreviewAudio(processedAudio);
      }
    }
  };
  
  // Apply settings to current audio
  const applySettingsToAudio = async () => {
    if (!recordedAudio) {
      setErrorMessage('No audio available to apply settings');
      return;
    }
    
    setIsApplyingSettings(true);
    setErrorMessage(null);
    
    try {
      const processedAudio = await applyAudioSettings(recordedAudio, settings);
      if (processedAudio) {
        setTransformedAudio(processedAudio);
        setSettingsChanged(false);
        setErrorMessage(null);
      } else {
        setErrorMessage('Failed to apply audio settings');
      }
    } catch (error) {
      console.error('Error applying settings:', error);
      setErrorMessage('Error applying audio settings');
    } finally {
      setIsApplyingSettings(false);
    }
  };

  const handleSave = async () => {
    if (!audioFile || (!transformedAudio && !recordedAudio)) {
      setErrorMessage('No audio available to save');
      return;
    }
    
    // Generate a default name based on the effect used
    const defaultName = selectedEffect 
      ? `${voiceEffects.find(e => e.effectId === selectedEffect)?.name || 'Voice'} Creation`
      : selectedEmotion
      ? `${emotionVoices.find(e => e.effectId === selectedEmotion)?.name || 'Emotion'} Voice`
      : 'Voice Creation';
    
    setSaveFormData({
      name: defaultName,
      description: '',
      isPublic: false,
      tags: []
    });
    setShowSaveDialog(true);
  };
  
  const handleSaveVoiceCreation = async () => {
    if (!audioFile) {
      setErrorMessage('No audio file available to save');
      return;
    }
    
    setIsSavingVoice(true);
    setErrorMessage(null);
    
    try {
      const voiceCreationData = {
        name: saveFormData.name,
        description: saveFormData.description,
        originalAudioId: audioFile.id,
        transformedAudioId: transformation?.transformedAudioId || emotionTransformation?.transformedAudioId,
        effectId: selectedEffect || selectedEmotion,
        effectName: selectedEffect 
          ? voiceEffects.find(e => e.effectId === selectedEffect)?.name
          : selectedEmotion
          ? emotionVoices.find(e => e.effectId === selectedEmotion)?.name
          : undefined,
        effectCategory: selectedEffect 
          ? voiceEffects.find(e => e.effectId === selectedEffect)?.category
          : selectedEmotion
          ? 'emotion'
          : undefined,
        settings: settings,
        isPublic: saveFormData.isPublic,
        tags: saveFormData.tags
      };
      
      const response = await voiceAPI.saveVoiceCreation(voiceCreationData);
      
      if (response.status === 'success') {
        setShowSaveDialog(false);
        setSaveFormData({ name: '', description: '', isPublic: false, tags: [] });
        await fetchSavedVoiceCreations(); // Refresh the list
        setErrorMessage(null);
        // Show success message
        console.log('Voice creation saved successfully');
      } else {
        setErrorMessage('Failed to save voice creation');
      }
    } catch (error) {
      console.error('Error saving voice creation:', error);
      setErrorMessage('Error saving voice creation');
    } finally {
      setIsSavingVoice(false);
    }
  };
  
  const handleDeleteSavedVoice = async (id: string) => {
    try {
      const response = await voiceAPI.deleteSavedVoiceCreation(id);
      if (response.status === 'success') {
        await fetchSavedVoiceCreations(); // Refresh the list
      }
    } catch (error) {
      console.error('Error deleting saved voice creation:', error);
      setErrorMessage('Error deleting saved voice creation');
    }
  };
  
  const handleProceedToFeed = (savedVoice: any) => {
    // Navigate to feed page with the saved voice data
    const audioUrl = savedVoice.transformedAudio 
      ? `/api/audio/transformed/${savedVoice.transformedAudio.originalFilename}`
      : `/api/audio/${savedVoice.originalAudio.originalFilename}`;
    
    // Store the voice data in sessionStorage for the feed page
    sessionStorage.setItem('voiceForFeed', JSON.stringify({
      id: savedVoice.id,
      name: savedVoice.name,
      description: savedVoice.description,
      audioUrl: audioUrl,
      audioFileId: savedVoice.transformedAudioId || savedVoice.originalAudioId,
      effectName: savedVoice.effectName,
      effectCategory: savedVoice.effectCategory
    }));
    
    // Navigate to feed page using React Router
    navigate('/feed?source=studio');
  };
  
  // Handle language change
  const handleLanguageChange = async (languageCode: string) => {
    setSelectedLanguage(languageCode);
    setIsTranslating(true);
    setErrorMessage(null);
    
    try {
      // Update user language preference
      await translationAPI.updateLanguagePreference(languageCode);
      setIsTranslating(false);
    } catch (error) {
      console.error('Error changing language:', error);
      setIsTranslating(false);
      setErrorMessage('Error changing language');
    }
  };
  
  // New function to translate audio
  const translateAudio = async () => {
    // Check Pro status first
    if (!isPro) {
      setTranslationError('Language translation is a Pro feature. Please upgrade to access this functionality.');
      return;
    }
    
    if (!audioFile) {
      setTranslationError('No audio file available for translation');
      return;
    }
    
    setTranslationInProgress(true);
    setTranslationError(null);
    
    try {
      // Get a default voice ID for the target language
      // In a real app, you would let the user select a voice
      const defaultVoiceId = "21m00Tcm4TlvDq8ikWAM"; // Default ElevenLabs voice ID
      
      // Start the translation process
      const response = await translationAPI.translateAudio(
        audioFile.id,
        selectedLanguage,
        defaultVoiceId
      );
      
      if (response.status === 'success' && response.data) {
        // Poll for translation status
        pollTranslationStatus(response.data.translationId);
      } else {
        setTranslationInProgress(false);
        setTranslationError('Failed to start translation');
      }
    } catch (error) {
      console.error('Error translating audio:', error);
      setTranslationInProgress(false);
      setTranslationError('Error translating audio');
    }
  };
  
  // Poll for translation status
  const pollTranslationStatus = async (translationId: string) => {
    try {
      const response = await translationAPI.getTranslationStatus(translationId);
      
      if (response.status === 'success' && response.data) {
        const translationData = response.data;
        
        if (translationData.translatedAudioId) {
          // Translation is complete
          setTranslationInProgress(false);
          
          // Create a URL for the translated audi       // Use the main audio endpoint which will handle translated audio properly
          setTranslatedAudio(`/api/audio/${translationData.translatedAudioId}`);
          console.log(`Setting translated audio URL: /api/audio/${translationData.translatedAudioId}`);
        } else if (translationData.status === 'failed') {
          setTranslationInProgress(false);
          setTranslationError(translationData.errorMessage || 'Translation failed');
        } else {
          // Continue polling
          setTimeout(() => pollTranslationStatus(translationId), 2000);
        }
      } else {
        setTranslationInProgress(false);
        setTranslationError('Failed to get translation status');
      }
    } catch (error) {
      console.error('Error polling translation status:', error);
      setTranslationInProgress(false);
      setTranslationError('Error checking translation status');
    }
  };

  const filteredEffects = selectedCategory === 'all'
    ? [...voiceEffects.filter(effect => effect.category !== 'language'), ...emotionVoices]
    : selectedCategory === 'emotion'
    ? emotionVoices.length > 0 ? emotionVoices : voiceEffects.filter(effect => effect.category === 'emotion')
    : voiceEffects.filter(effect => effect.category === selectedCategory);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Studio Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-dark-900 dark:text-white mb-2">
              Voice Studio
            </h1>
            <p className="text-dark-600 dark:text-dark-400 max-w-xl">
              Transform your voice with AI-powered effects and professional audio tools
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              leftIcon={<Settings className="h-5 w-5" />}
              onClick={() => setShowPreferencesModal(true)}
            >
              Preferences
            </Button>
            <Button
            variant="primary"
            leftIcon={<Crown className="h-5 w-5" />}
            onClick={() => navigate('/subscription')}
            >
            Upgrade to Pro
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Studio Section */}
          <div className="lg:col-span-8 space-y-8">
            {/* Recording Card */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-display font-bold flex items-center gap-2">
                  <Mic2 className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                  Record Your Voice
                </h2>
                <div className="flex gap-2">
                  {showRecordingControls && (
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<X className="h-4 w-4" />}
                      onClick={cancelRecording}
                    >
                      Cancel
                    </Button>
                  )}
                  <IconButton
                    variant="ghost"
                    icon={<Settings className="h-5 w-5" />}
                    aria-label="Recording settings"
                  />
                </div>
              </div>
              
              {!showRecordingControls ? (
                <div className="flex flex-col items-center gap-4">
                  <Button
                    variant="primary"
                    size="lg"
                    leftIcon={<Mic2 className="h-5 w-5" />}
                    onClick={startNewRecording}
                    className="w-full md:w-auto"
                  >
                    Start Recording
                  </Button>
                  <p className="text-sm text-dark-600 dark:text-dark-400">
                    Click to start a new voice recording
                  </p>
                </div>
              ) : (
                <AudioRecorder
                  onRecordingComplete={handleRecordingComplete}
                  maxDuration={60}
                />
              )}

              {showTutorial && !showRecordingControls && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 bg-primary-50 dark:bg-primary-900/30 rounded-lg border border-primary-200 dark:border-primary-800"
                >
                  <div className="flex items-start gap-3">
                    <Sparkles className="h-6 w-6 text-primary-600 dark:text-primary-400 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium text-dark-900 dark:text-white mb-1">
                        Quick Start Guide
                      </h3>
                      <p className="text-sm text-dark-600 dark:text-dark-400">
                        1. Record your voice using the microphone
                        2. Choose an AI voice effect or translate to another language
                        3. Fine-tune with professional audio settings
                        4. Share your transformed voice with the world
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
              
              {audioDuration > 0 && recordedAudio && (
                <div className="mt-4 p-3 bg-success-50 dark:bg-success-900/30 border border-success-200 dark:border-success-800 rounded-lg">
                  <p className="text-success-700 dark:text-success-400">
                    Recording duration: {audioDuration.toFixed(1)} seconds
                  </p>
                </div>
              )}
            </Card>

            {/* Preview Section */}
            {recordedAudio && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-display font-bold flex items-center gap-2">
                    <Music className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                    Audio Preview
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-dark-500 dark:text-dark-400">
                      {audioDuration > 0 ? `${audioDuration.toFixed(1)}s` : "00:00"}
                    </span>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="relative">
                    {/* Processing indicator */}
                    {isProcessing && (
                      <div className="absolute inset-0 bg-white/80 dark:bg-dark-800/80 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
                          <p className="text-sm font-medium text-dark-700 dark:text-dark-300">
                            {transformation?.status === 'processing' ? 'Applying celebrity voice...' : 'Processing...'}
                          </p>
                          {transformation?.status === 'processing' && (
                            <p className="text-xs text-dark-500 dark:text-dark-400 mt-1">
                              This may take 30-60 seconds
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <AudioPlayer
                      audioUrl={translatedAudio || transformedAudio || recordedAudio}
                      height={120}
                      showWaveform={true}
                      className="w-full"
                    />
                    
                    {/* Status indicator */}
                    {transformedAudio && !isProcessing && (
                      <div className="absolute top-2 right-2 bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400 px-2 py-1 rounded-full text-xs font-medium">
                        ✓ Voice Transformed
                      </div>
                    )}
                  </div>
                  
                  {/* Voice Cloning Controls */}
                  <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-100 dark:border-primary-800 mb-4">
                    <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                      <Mic2 className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                      Voice Cloning & Effects
                    </h3>
                    
                    <div className="space-y-4">
                      {/* ElevenLabs Voice Selection */}
                      <div>
                        <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                          Celebrity Voice
                        </label>
                        <div className="flex flex-col md:flex-row gap-4">
                          <select
                            className="w-full p-2 rounded-lg border border-gray-300 dark:border-dark-700 bg-white dark:bg-dark-800 text-dark-900 dark:text-white"
                            value={selectedVoiceId || ''}
                            onChange={(e) => handleVoiceSelect(e.target.value)}
                            disabled={isLoadingVoices || isProcessing}
                          >
                            {isLoadingVoices ? (
                              <option>Loading voices...</option>
                            ) : elevenLabsVoices.length === 0 ? (
                              <option>No voices available</option>
                            ) : (
                              elevenLabsVoices.map((voice) => (
                                <option key={voice.voice_id} value={voice.voice_id}>
                                  {voice.name}
                                </option>
                              ))
                            )}
                          </select>
                          
                          <Button
                            variant="outline"
                            leftIcon={<Sparkles className="h-5 w-5" />}
                            onClick={() => setShowVoiceCloning(!showVoiceCloning)}
                            disabled={isProcessing || !audioFile}
                          >
                            {showVoiceCloning ? 'Hide Cloning' : 'Clone My Voice'}
                          </Button>
                        </div>
                      </div>
                      
                      {/* Voice Cloning Form */}
                      {showVoiceCloning && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="p-3 bg-primary-100 dark:bg-primary-900/40 rounded-lg"
                        >
                          <h4 className="text-md font-medium mb-2">Clone Your Voice</h4>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                                Voice Name
                              </label>
                              <input
                                type="text"
                                className="w-full p-2 rounded-lg border border-gray-300 dark:border-dark-700 bg-white dark:bg-dark-800 text-dark-900 dark:text-white"
                                value={cloneOptions.name}
                                onChange={(e) => setCloneOptions({...cloneOptions, name: e.target.value})}
                                disabled={isCloning}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                                Description (optional)
                              </label>
                              <textarea
                                className="w-full p-2 rounded-lg border border-gray-300 dark:border-dark-700 bg-white dark:bg-dark-800 text-dark-900 dark:text-white"
                                value={cloneOptions.description || ''}
                                onChange={(e) => setCloneOptions({...cloneOptions, description: e.target.value})}
                                disabled={isCloning}
                                rows={2}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                                Stability: {cloneOptions.stability}
                              </label>
                              <input
                                type="range"
                                min={0}
                                max={1}
                                step={0.01}
                                className="w-full h-2 bg-gray-200 dark:bg-dark-700 rounded-lg appearance-none cursor-pointer"
                                value={cloneOptions.stability}
                                onChange={(e) => setCloneOptions({...cloneOptions, stability: parseFloat(e.target.value)})}
                                disabled={isCloning}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                                Similarity Boost: {cloneOptions.similarity_boost}
                              </label>
                              <input
                                type="range"
                                min={0}
                                max={1}
                                step={0.01}
                                className="w-full h-2 bg-gray-200 dark:bg-dark-700 rounded-lg appearance-none cursor-pointer"
                                value={cloneOptions.similarity_boost}
                                onChange={(e) => setCloneOptions({...cloneOptions, similarity_boost: parseFloat(e.target.value)})}
                                disabled={isCloning}
                              />
                            </div>
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                id="speaker-boost"
                                className="mr-2"
                                checked={cloneOptions.use_speaker_boost}
                                onChange={(e) => setCloneOptions({...cloneOptions, use_speaker_boost: e.target.checked})}
                                disabled={isCloning}
                              />
                              <label htmlFor="speaker-boost" className="text-sm text-dark-700 dark:text-dark-300">
                                Use Speaker Boost
                              </label>
                            </div>
                            <Button
                              variant="primary"
                              leftIcon={<Sparkles className="h-5 w-5" />}
                              onClick={handleVoiceClone}
                              isLoading={isCloning}
                              disabled={isCloning || !audioFile}
                              fullWidth
                            >
                              {isCloning ? 'Cloning Voice...' : 'Clone My Voice'}
                            </Button>
                          </div>
                        </motion.div>
                      )}
                      
                      {/* Apply Voice Button */}
                      {selectedVoiceId && audioFile && (
                        <div className="space-y-3">
                          {/* Transformation Status */}
                          {transformation && (
                            <div className={`p-3 rounded-lg border text-sm ${
                              transformation.status === 'completed' 
                                ? 'bg-success-50 dark:bg-success-900/30 border-success-200 dark:border-success-800 text-success-700 dark:text-success-400'
                                : transformation.status === 'failed'
                                ? 'bg-error-50 dark:bg-error-900/30 border-error-200 dark:border-error-800 text-error-700 dark:text-error-400'
                                : 'bg-primary-50 dark:bg-primary-900/30 border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-400'
                            }`}>
                              <div className="flex items-center gap-2">
                                {transformation.status === 'processing' && (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                                )}
                                {transformation.status === 'completed' && (
                                  <div className="h-4 w-4 rounded-full bg-success-500 flex items-center justify-center">
                                    <div className="h-2 w-2 bg-white rounded-full"></div>
                                  </div>
                                )}
                                {transformation.status === 'failed' && (
                                  <X className="h-4 w-4" />
                                )}
                                <span className="font-medium">
                                  {transformation.status === 'processing' && 'Applying celebrity voice...'}
                                  {transformation.status === 'completed' && 'Celebrity voice applied successfully!'}
                                  {transformation.status === 'failed' && 'Voice transformation failed'}
                                </span>
                              </div>
                              {transformation.status === 'processing' && (
                                <p className="text-xs mt-1 opacity-75">
                                  This may take 30-60 seconds. Please wait...
                                </p>
                              )}
                              {transformation.status === 'failed' && transformation.errorMessage && (
                                <p className="text-xs mt-1 opacity-75">
                                  {transformation.errorMessage}
                                </p>
                              )}
                            </div>
                          )}
                          
                          <div className="flex gap-2">
                            <Button
                              variant="primary"
                              leftIcon={<Wand2 className="h-5 w-5" />}
                              onClick={async () => {
                            if (!selectedVoiceId) {
                              setErrorMessage('Please select a voice first');
                              return;
                            }
                            
                            if (!audioFile) {
                              setErrorMessage('No audio file available for transformation');
                              return;
                            }
                            
                            // Clear any previous transformation results
                            setTransformedAudio(null);
                            setTransformation(null);
                            
                            // Pass the selected voice ID in the settings
                            const celebritySettings = {
                              ...settings,
                              voiceId: selectedVoiceId
                            };
                            setIsProcessing(true);
                            setErrorMessage(null);
                            
                            console.log('Starting celebrity voice transformation with voice ID:', selectedVoiceId);
                            console.log('Audio file ID:', audioFile.id);
                            console.log('Settings:', celebritySettings);
                            
                            try {
                              // Call the API with the celebrity_voice effect ID and voice settings
                              const response = await voiceAPI.transformAudio(
                                audioFile.id,
                                'celebrity_voice',
                                celebritySettings
                              );
                              
                              if (response.status === 'success' && response.data) {
                                console.log('Celebrity voice transformation started:', response.data);
                                
                                setTransformation({
                                  id: response.data.transformationId,
                                  sourceAudioId: audioFile.id,
                                  effectId: 'celebrity_voice',
                                  effectName: 'Celebrity Voice',
                                  status: 'processing'
                                });
                                
                                // Poll for transformation status
                                pollTransformationStatus(response.data.transformationId);
                              } else {
                                setIsProcessing(false);
                                setErrorMessage('Failed to start voice transformation: ' + (response.message || 'Unknown error'));
                                console.error('API returned unsuccessful status:', response);
                              }
                            } catch (error) {
                              console.error('Error applying celebrity voice:', error);
                              setIsProcessing(false);
                              
                              // Extract the error message from the API response if available
                              let errorMsg = 'Error applying celebrity voice';
                              if (error.response && error.response.data) {
                                errorMsg = error.response.data.message || errorMsg;
                              }
                              
                              setErrorMessage(errorMsg);
                            }
                          }}
                              isLoading={isProcessing}
                              disabled={isProcessing || !selectedVoiceId}
                              className="flex-1"
                            >
                              {isProcessing ? 'Applying Voice...' : 'Apply Celebrity Voice'}
                            </Button>
                            
                            {(transformation || transformedAudio) && (
                              <Button
                                variant="outline"
                                leftIcon={<RefreshCw className="h-5 w-5" />}
                                onClick={() => {
                                  setTransformation(null);
                                  setTransformedAudio(null);
                                  setErrorMessage(null);
                                }}
                                disabled={isProcessing}
                                className="flex-shrink-0"
                              >
                                Reset
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                      
                                          </div>
                  </div>
                  
                  {/* Translation Controls */}
                  {languages.length > 0 && audioFile && (
                    <div className={`p-4 rounded-lg border relative ${
                      isPro 
                        ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-100 dark:border-primary-800' 
                        : 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700'
                    }`}>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-medium flex items-center gap-2">
                          <Globe className={`h-5 w-5 ${isPro ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'}`} />
                          Translate Audio
                          {!isPro && (
                            <div className="relative group">
                              <Lock className="h-4 w-4 text-amber-500 ml-1" />
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                                Upgrade to Pro to unlock language translation
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                              </div>
                            </div>
                          )}
                        </h3>
                        {!isPro && (
                          <Button
                            variant="primary"
                            size="sm"
                            leftIcon={<Crown className="h-4 w-4" />}
                            onClick={() => navigate('/subscription')}
                            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                          >
                            Upgrade to Pro
                          </Button>
                        )}
                      </div>
                      
                      {!isPro && (
                        <div className="absolute inset-0 bg-gray-100/50 dark:bg-gray-800/50 rounded-lg flex items-center justify-center backdrop-blur-sm">
                          <div className="text-center p-4">
                            <Lock className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                            <p className="text-gray-600 dark:text-gray-400 font-medium mb-2">
                              Pro Feature Locked
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-500 mb-3">
                              Upgrade to Pro to unlock language translation
                            </p>
                            <Button
                              variant="primary"
                              size="sm"
                              leftIcon={<Crown className="h-4 w-4" />}
                              onClick={() => navigate('/subscription')}
                              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                            >
                              Upgrade Now
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      <div className={`flex flex-col md:flex-row gap-4 items-start md:items-center ${!isPro ? 'opacity-30' : ''}`}>
                        <div className="w-full md:w-1/2">
                          <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                            Target Language
                          </label>
                          <select
                            className="w-full p-2 rounded-lg border border-gray-300 dark:border-dark-700 bg-white dark:bg-dark-800 text-dark-900 dark:text-white"
                            value={selectedLanguage}
                            onChange={(e) => handleLanguageChange(e.target.value)}
                            disabled={!isPro || translationInProgress}
                          >
                            {languages.map((language) => (
                              <option key={language.code} value={language.code}>
                                {language.name} ({language.nativeName})
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <Button
                          variant="primary"
                          leftIcon={<Globe className="h-5 w-5" />}
                          onClick={translateAudio}
                          isLoading={translationInProgress}
                          disabled={!isPro || translationInProgress}
                          className="mt-2 md:mt-6"
                        >
                          {translationInProgress ? 'Translating...' : 'Translate'}
                        </Button>
                      </div>
                      
                      {translationError && isPro && (
                        <div className="mt-3 p-2 bg-error-50 dark:bg-error-900/30 border border-error-200 dark:border-error-800 rounded-lg text-error-700 dark:text-error-400 text-sm">
                          <p>{translationError}</p>
                        </div>
                      )}
                      
                      {translatedAudio && isPro && (
                        <div className="mt-3 p-2 bg-success-50 dark:bg-success-900/30 border border-success-200 dark:border-success-800 rounded-lg text-success-700 dark:text-success-400 text-sm">
                          <p>Translation successful! Playing translated audio.</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {errorMessage && (
                    <div className="mt-4 p-3 bg-error-50 dark:bg-error-900/30 border border-error-200 dark:border-error-800 rounded-lg text-error-700 dark:text-error-400">
                      <p>{errorMessage}</p>
                    </div>
                  )}
                  
                  {/* Debug Information (only in development) */}
                  {process.env.NODE_ENV === 'development' && (
                    <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-700 rounded-lg text-xs">
                      <details>
                        <summary className="cursor-pointer font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Debug Information
                        </summary>
                        <div className="space-y-2 text-gray-600 dark:text-gray-400">
                          <div><strong>Audio File ID:</strong> {audioFile?.id || 'None'}</div>
                          <div><strong>Selected Voice ID:</strong> {selectedVoiceId || 'None'}</div>
                          <div><strong>Transformation ID:</strong> {transformation?.id || 'None'}</div>
                          <div><strong>Transformation Status:</strong> {transformation?.status || 'None'}</div>
                          <div><strong>Transformed Audio URL:</strong> {transformedAudio || 'None'}</div>
                          <div><strong>Is Processing:</strong> {isProcessing ? 'Yes' : 'No'}</div>
                          <div><strong>Original Audio URL:</strong> {recordedAudio || 'None'}</div>
                          <div><strong>Current Playing:</strong> {translatedAudio || transformedAudio || recordedAudio || 'None'}</div>
                        </div>
                      </details>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4">
                    <Button
                      variant="primary"
                      leftIcon={<Save className="h-5 w-5" />}
                      onClick={handleSave}
                      disabled={!audioFile || (!transformedAudio && !recordedAudio)}
                    >
                      Save Voice
                    </Button>
                    <Button
                      variant="outline"
                      leftIcon={<Download className="h-5 w-5" />}
                      onClick={() => {}}
                    >
                      Download
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Effects and Settings Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            {/* Tabs */}
            <Card className="p-6">
              <div className="flex gap-4 mb-6">
                <Button
                  variant={activeTab === 'effects' ? 'primary' : 'outline'}
                  onClick={() => setActiveTab('effects')}
                  leftIcon={<Wand2 className="h-5 w-5" />}
                  fullWidth
                >
                  Effects
                </Button>
                <Button
                  variant={activeTab === 'settings' ? 'primary' : 'outline'}
                  onClick={() => setActiveTab('settings')}
                  leftIcon={<Sliders className="h-5 w-5" />}
                  fullWidth
                >
                  Settings
                </Button>
              </div>

              <AnimatePresence mode="wait">
                {activeTab === 'effects' ? (
                  <motion.div
                    key="effects"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    {/* Categories */}
                    <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                      {['all', 'celebrity', 'emotion', 'custom'].map((category) => (
                        <Button
                          key={category}
                          variant={selectedCategory === category ? 'primary' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedCategory(category)}
                        >
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </Button>
                      ))}
                    </div>
                    
                    {/* Language Selection */}
                    {languages.length > 0 && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-dark-900 dark:text-white mb-2">
                          Output Language
                        </label>
                        <select
                          className="w-full p-2 rounded-lg border border-gray-300 dark:border-dark-700 bg-white dark:bg-dark-800 text-dark-900 dark:text-white"
                          value={selectedLanguage}
                          onChange={(e) => handleLanguageChange(e.target.value)}
                          disabled={isTranslating}
                        >
                          {languages.map((language) => (
                            <option key={language.code} value={language.code}>
                              {language.name} ({language.nativeName})
                            </option>
                          ))}
                        </select>
                        {isTranslating && (
                          <p className="text-sm text-primary-600 dark:text-primary-400 mt-1">
                            Changing language...
                          </p>
                        )}
                      </div>
                    )}

                    {/* Effects Grid */}
                    <div className="grid grid-cols-1 gap-3">
                      {filteredEffects.map((effect) => (
                        <motion.button
                          key={effect.id}
                          className={`p-4 rounded-lg border-2 transition-colors ${
                            (effect.category === 'emotion' ? selectedEmotion === effect.effectId : selectedEffect === effect.effectId)
                              ? 'border-primary-600 bg-primary-50 dark:border-primary-400 dark:bg-primary-900/30'
                              : 'border-gray-200 hover:border-primary-300 dark:border-dark-700 dark:hover:border-primary-600'
                          } ${
                            effect.isProOnly && !isPro
                              ? 'opacity-60'
                              : ''
                          }`}
                          onClick={() => {
                            if (effect.isProOnly && !isPro) {
                              // Show upgrade modal for Pro-only effects
                              setShowUpgradeModal(true);
                              return;
                            }
                            if (effect.category === 'emotion') {
                              handleEmotionSelect(effect.effectId);
                            } else {
                              handleEffectSelect(effect.effectId);
                            }
                          }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          disabled={effect.isProOnly && !isPro || isProcessing}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center">
                                {effect.icon === 'star' && <Star className="h-5 w-5 text-primary-600 dark:text-primary-400" />}
                                {effect.icon === 'smile' && <Smile className="h-5 w-5 text-primary-600 dark:text-primary-400" />}
                                {effect.icon === 'frown' && <Frown className="h-5 w-5 text-primary-600 dark:text-primary-400" />}
                                {effect.icon === 'angry' && <Angry className="h-5 w-5 text-primary-600 dark:text-primary-400" />}
                                {effect.icon === 'meh' && <Meh className="h-5 w-5 text-primary-600 dark:text-primary-400" />}
                                {effect.icon === 'globe' && <Globe className="h-5 w-5 text-primary-600 dark:text-primary-400" />}
                                {!effect.icon && <Wand2 className="h-5 w-5 text-primary-600 dark:text-primary-400" />}
                              </div>
                              <div className="text-left">
                                <div className="font-medium text-dark-900 dark:text-white">
                                  {effect.name}
                                </div>
                                <div className="text-sm text-dark-500 dark:text-dark-400">
                                  {effect.category === 'celebrity' ? 'Celebrity Voice' : 
                                   effect.category === 'emotion' ? 'Emotion Effect' : 
                                   effect.category === 'language' ? 'Language Accent' : 
                                   effect.category}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end">
                              <div className="flex items-center gap-1 text-warning-600 dark:text-warning-400">
                                <Star className="h-4 w-4 fill-current" />
                                <span className="text-sm font-medium">{effect.popularity}%</span>
                              </div>
                              {effect.isProOnly && (
                                <div className="flex items-center gap-1 mt-1">
                                  {!isPro && <Lock className="h-3 w-3 text-amber-500" />}
                                  <span className={`text-xs font-medium ${isPro ? 'text-primary-600 dark:text-primary-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                    PRO
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="settings"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    {/* Settings Header */}
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-dark-900 dark:text-white">
                        Audio Settings
                      </h3>
                      {recordedAudio && (
                        <div className="flex items-center gap-2">
                          {settingsChanged && (
                            <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded-full">
                              Changes pending
                            </span>
                          )}
                          <Button
                            variant="primary"
                            size="sm"
                            leftIcon={<Volume2 className="h-4 w-4" />}
                            onClick={applySettingsToAudio}
                            isLoading={isApplyingSettings}
                            disabled={!settingsChanged || isApplyingSettings}
                          >
                            {isApplyingSettings ? 'Applying...' : 'Apply'}
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Audio Settings Controls */}
                    {audioSettings.map((setting) => (
                      <div key={setting.id} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-dark-900 dark:text-white flex items-center gap-2">
                            {setting.id === 'pitch' && <Music className="h-4 w-4 text-primary-600 dark:text-primary-400" />}
                            {setting.id === 'formant' && <Sliders className="h-4 w-4 text-primary-600 dark:text-primary-400" />}
                            {setting.id === 'reverb' && <Volume2 className="h-4 w-4 text-primary-600 dark:text-primary-400" />}
                            {setting.id === 'delay' && <Clock className="h-4 w-4 text-primary-600 dark:text-primary-400" />}
                            {setting.name}
                          </label>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-mono text-dark-500 dark:text-dark-400 bg-gray-100 dark:bg-dark-700 px-2 py-1 rounded">
                              {settings[setting.id]}{setting.id === 'pitch' || setting.id === 'formant' ? 'st' : setting.id === 'reverb' || setting.id === 'delay' ? '%' : ''}
                            </span>
                          </div>
                        </div>
                        
                        <div className="relative">
                          <input
                            type="range"
                            min={setting.min}
                            max={setting.max}
                            step={setting.step}
                            value={settings[setting.id]}
                            onChange={(e) => handleSettingChange(setting.id, Number(e.target.value))}
                            className="w-full h-2 bg-gray-200 dark:bg-dark-700 rounded-lg appearance-none cursor-pointer slider"
                            style={{
                              background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${((settings[setting.id] - setting.min) / (setting.max - setting.min)) * 100}%, #E5E7EB ${((settings[setting.id] - setting.min) / (setting.max - setting.min)) * 100}%, #E5E7EB 100%)`
                            }}
                          />
                          
                          {/* Range markers */}
                          <div className="flex justify-between text-xs text-gray-400 mt-1">
                            <span>{setting.min}{setting.id === 'pitch' || setting.id === 'formant' ? 'st' : '%'}</span>
                            <span className="text-primary-600 dark:text-primary-400">0</span>
                            <span>{setting.max}{setting.id === 'pitch' || setting.id === 'formant' ? 'st' : '%'}</span>
                          </div>
                        </div>
                        
                        {/* Setting description */}
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {setting.id === 'pitch' && 'Adjust the pitch/frequency of your voice'}
                          {setting.id === 'formant' && 'Modify the vocal tract characteristics'}
                          {setting.id === 'reverb' && 'Add spatial depth and ambience'}
                          {setting.id === 'delay' && 'Create echo and delay effects'}
                        </p>
                      </div>
                    ))}

                    {/* Preview Section */}
                    {recordedAudio && previewAudio && (
                      <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-100 dark:border-primary-800">
                        <h4 className="text-sm font-medium text-dark-900 dark:text-white mb-2 flex items-center gap-2">
                          <Volume2 className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                          Settings Preview
                        </h4>
                        <audio
                          ref={audioRef}
                          src={previewAudio}
                          controls
                          className="w-full"
                          style={{ height: '40px' }}
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          Preview how your settings will sound. Click "Apply" to use these settings.
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        leftIcon={<RefreshCw className="h-5 w-5" />}
                        onClick={() => {
                          const defaultSettings = audioSettings.reduce((acc, setting) => ({
                            ...acc,
                            [setting.id]: setting.default
                          }), {});
                          setSettings(defaultSettings);
                          setSettingsChanged(true);
                          setPreviewAudio(null);
                        }}
                        className="flex-1"
                      >
                        Reset
                      </Button>
                      
                      {recordedAudio && (
                        <Button
                          variant="primary"
                          leftIcon={<Wand2 className="h-5 w-5" />}
                          onClick={applySettingsToAudio}
                          isLoading={isApplyingSettings}
                          disabled={!settingsChanged || isApplyingSettings}
                          className="flex-1"
                        >
                          {isApplyingSettings ? 'Processing...' : 'Apply Settings'}
                        </Button>
                      )}
                    </div>

                    {/* Settings Info */}
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-start gap-2">
                        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-700 dark:text-blue-300">
                          <p className="font-medium mb-1">Real-time Audio Processing</p>
                          <p className="text-xs">
                            Adjust settings and hear changes instantly. Click "Apply" to save your preferred settings to the audio.
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>

            {/* Saved Voices Card */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <Layers className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                  Saved Voices
                </h3>
                <span className="text-sm text-dark-500 dark:text-dark-400">
                  {savedVoiceCreations.length} saved
                </span>
              </div>
              
              {savedVoiceCreations.length === 0 ? (
                <div className="text-center py-8">
                  <Music className="h-12 w-12 text-dark-300 dark:text-dark-600 mx-auto mb-3" />
                  <p className="text-dark-500 dark:text-dark-400 mb-2">No saved voices yet</p>
                  <p className="text-sm text-dark-400 dark:text-dark-500">
                    Create and save your voice transformations to access them later
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {savedVoiceCreations.slice(0, 5).map((savedVoice) => (
                    <div
                      key={savedVoice.id}
                      className="p-3 border border-gray-200 dark:border-dark-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-600 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-dark-900 dark:text-white truncate">
                          {savedVoice.name}
                        </h4>
                        <div className="flex items-center gap-1">
                          {savedVoice.isPublic ? (
                            <Eye className="h-4 w-4 text-green-500" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                      </div>
                      
                      {savedVoice.effectName && (
                        <p className="text-sm text-primary-600 dark:text-primary-400 mb-2">
                          {savedVoice.effectName}
                        </p>
                      )}
                      
                      {savedVoice.description && (
                        <p className="text-xs text-dark-500 dark:text-dark-400 mb-3 line-clamp-2">
                          {savedVoice.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          leftIcon={<ArrowRight className="h-4 w-4" />}
                          onClick={() => handleProceedToFeed(savedVoice)}
                          className="flex-1"
                        >
                          Proceed
                        </Button>
                        <IconButton
                          variant="ghost"
                          size="sm"
                          icon={<Trash2 className="h-4 w-4" />}
                          onClick={() => handleDeleteSavedVoice(savedVoice.id)}
                          aria-label="Delete saved voice"
                        />
                      </div>
                    </div>
                  ))}
                  
                  {savedVoiceCreations.length > 5 && (
                    <Button
                      variant="outline"
                      size="sm"
                      fullWidth
                      onClick={() => {/* TODO: Show all saved voices modal */}}
                    >
                      View All ({savedVoiceCreations.length})
                    </Button>
                  )}
                </div>
              )}
            </Card>

            {/* Pro Features Card */}
            <Card className="p-6 bg-gradient-to-br from-primary-500 to-accent-500 text-white">
              <div className="flex items-center gap-3 mb-4">
                <Award className="h-6 w-6" />
                <h3 className="text-xl font-semibold">Pro Features</h3>
              </div>
              <ul className="space-y-3 mb-6">
                {proFeatures.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Star className="h-4 w-4 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                variant="secondary"
                fullWidth
                className="bg-white text-primary-600 hover:bg-primary-50"
                onClick={() => navigate('/subscription')}
                leftIcon={<Lock className="h-5 w-5" />}
              >
                Unlock Pro Features
              </Button>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Upgrade Modal */}
      <AnimatePresence>
        {showUpgradeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowUpgradeModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-dark-800 rounded-lg p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 mb-4">
                  <Crown className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                
                <h3 className="text-lg font-semibold text-dark-900 dark:text-white mb-2">
                  Upgrade to Pro
                </h3>
                
                <p className="text-dark-600 dark:text-dark-400 mb-6">
                  Unlock language translation and premium voice effects with VoiceVerse Pro.
                </p>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-sm text-dark-700 dark:text-dark-300">
                    <div className="h-2 w-2 bg-primary-500 rounded-full"></div>
                    <span>Language translation to 50+ languages</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-dark-700 dark:text-dark-300">
                    <div className="h-2 w-2 bg-primary-500 rounded-full"></div>
                    <span>Premium celebrity voice effects</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-dark-700 dark:text-dark-300">
                    <div className="h-2 w-2 bg-primary-500 rounded-full"></div>
                    <span>Unlimited voice transformations</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-dark-700 dark:text-dark-300">
                    <div className="h-2 w-2 bg-primary-500 rounded-full"></div>
                    <span>Priority processing & support</span>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowUpgradeModal(false)}
                    className="flex-1"
                  >
                    Maybe Later
                  </Button>
                  <Button
                    variant="primary"
                    leftIcon={<Crown className="h-4 w-4" />}
                    onClick={() => {
                      setShowUpgradeModal(false);
                      navigate('/subscription');
                    }}
                    className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                  >
                    Upgrade Now
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Save Voice Dialog */}
      <AnimatePresence>
        {showSaveDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowSaveDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-dark-800 rounded-lg p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-dark-900 dark:text-white">
                  Save Voice Creation
                </h3>
                <IconButton
                  variant="ghost"
                  icon={<X className="h-5 w-5" />}
                  onClick={() => setShowSaveDialog(false)}
                  aria-label="Close dialog"
                />
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-300 dark:border-dark-700 rounded-lg bg-white dark:bg-dark-800 text-dark-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    value={saveFormData.name}
                    onChange={(e) => setSaveFormData({ ...saveFormData, name: e.target.value })}
                    placeholder="Enter a name for your voice creation"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                    Description
                  </label>
                  <textarea
                    className="w-full p-3 border border-gray-300 dark:border-dark-700 rounded-lg bg-white dark:bg-dark-800 text-dark-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    rows={3}
                    value={saveFormData.description}
                    onChange={(e) => setSaveFormData({ ...saveFormData, description: e.target.value })}
                    placeholder="Describe your voice creation (optional)"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPublic"
                    className="mr-2 rounded"
                    checked={saveFormData.isPublic}
                    onChange={(e) => setSaveFormData({ ...saveFormData, isPublic: e.target.checked })}
                  />
                  <label htmlFor="isPublic" className="text-sm text-dark-700 dark:text-dark-300">
                    Make this voice creation public
                  </label>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowSaveDialog(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleSaveVoiceCreation}
                    isLoading={isSavingVoice}
                    disabled={!saveFormData.name.trim() || isSavingVoice}
                    className="flex-1"
                  >
                    Save Voice
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Preferences Modal */}
      <AnimatePresence>
        {showPreferencesModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowPreferencesModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-dark-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-dark-900 dark:text-white flex items-center gap-2">
                  <Settings className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                  Studio Preferences
                </h3>
                <IconButton
                  variant="ghost"
                  icon={<X className="h-5 w-5" />}
                  onClick={() => setShowPreferencesModal(false)}
                  aria-label="Close preferences"
                />
              </div>
              
              <div className="space-y-6">
                {/* Audio Quality Settings */}
                <div>
                  <h4 className="text-lg font-medium text-dark-900 dark:text-white mb-3 flex items-center gap-2">
                    <Volume2 className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                    Audio Quality
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                        Recording Quality
                      </label>
                      <select className="w-full p-3 border border-gray-300 dark:border-dark-700 rounded-lg bg-white dark:bg-dark-800 text-dark-900 dark:text-white">
                        <option value="high">High Quality (48kHz, 24-bit)</option>
                        <option value="medium">Medium Quality (44.1kHz, 16-bit)</option>
                        <option value="low">Low Quality (22kHz, 16-bit)</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                        Processing Quality
                      </label>
                      <select className="w-full p-3 border border-gray-300 dark:border-dark-700 rounded-lg bg-white dark:bg-dark-800 text-dark-900 dark:text-white">
                        <option value="ultra">Ultra Quality (Slower processing)</option>
                        <option value="high">High Quality (Balanced)</option>
                        <option value="fast">Fast Processing (Lower quality)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Interface Settings */}
                <div>
                  <h4 className="text-lg font-medium text-dark-900 dark:text-white mb-3 flex items-center gap-2">
                    <Sliders className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                    Interface
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-dark-700 dark:text-dark-300">
                          Real-time Preview
                        </label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Preview settings changes instantly
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                        defaultChecked
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-dark-700 dark:text-dark-300">
                          Auto-save Settings
                        </label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Remember your preferred settings
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                        defaultChecked
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-dark-700 dark:text-dark-300">
                          Show Tutorials
                        </label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Display helpful tips and guides
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                        defaultChecked={showTutorial}
                      />
                    </div>
                  </div>
                </div>

                {/* Performance Settings */}
                <div>
                  <h4 className="text-lg font-medium text-dark-900 dark:text-white mb-3 flex items-center gap-2">
                    <RefreshCw className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                    Performance
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                        Processing Threads
                      </label>
                      <select className="w-full p-3 border border-gray-300 dark:border-dark-700 rounded-lg bg-white dark:bg-dark-800 text-dark-900 dark:text-white">
                        <option value="auto">Auto (Recommended)</option>
                        <option value="1">Single Thread</option>
                        <option value="2">2 Threads</option>
                        <option value="4">4 Threads</option>
                      </select>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-dark-700 dark:text-dark-300">
                          Hardware Acceleration
                        </label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Use GPU for faster processing
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                        defaultChecked
                      />
                    </div>
                  </div>
                </div>

                {/* Storage Settings */}
                <div>
                  <h4 className="text-lg font-medium text-dark-900 dark:text-white mb-3 flex items-center gap-2">
                    <Save className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                    Storage
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-dark-700 dark:text-dark-300">
                          Auto-save Recordings
                        </label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Automatically save recordings locally
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                        defaultChecked
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                        Storage Location
                      </label>
                      <select className="w-full p-3 border border-gray-300 dark:border-dark-700 rounded-lg bg-white dark:bg-dark-800 text-dark-900 dark:text-white">
                        <option value="browser">Browser Storage</option>
                        <option value="cloud">Cloud Storage</option>
                        <option value="local">Local Downloads</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-dark-700">
                <Button
                  variant="outline"
                  onClick={() => setShowPreferencesModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    // Save preferences logic here
                    setShowPreferencesModal(false);
                  }}
                  className="flex-1"
                >
                  Save Preferences
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};