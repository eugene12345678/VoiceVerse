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
  EyeOff
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { AudioRecorder } from '../components/audio/AudioRecorder';
import { WaveformVisualizer } from '../components/audio/WaveformVisualizer';
import { IconButton } from '../components/ui/IconButton';

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
  const [recordedAudio, setRecordedAudio] = useState<string | null>(null);
  const [selectedEffect, setSelectedEffect] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
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
  
  // Check if we're coming from the recorder
  const isFromRecorder = new URLSearchParams(location.search).get('source') === 'recorder';
  
  // Load audio from IndexedDB when coming from recorder
  // Load voice effects from API
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
  }, []);
  
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
              const url = URL.createObjectURL(audioBlob);
              setRecordedAudio(url);
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
                const url = URL.createObjectURL(blob);
                setRecordedAudio(url);
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
      // Create a File object from the Blob with metadata
      const file = new File([audioBlob], 'recording.wav', { 
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
        const mockAudioFile = {
          id: 'mock-audio-' + Date.now(),
          originalFilename: 'recording.wav',
          storagePath: '/uploads/audio/original/mock_recording.wav',
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
    const url = URL.createObjectURL(audioBlob);
    setRecordedAudio(url);
    setShowTutorial(false);
    setRecordingBlob(audioBlob);
    
    // Calculate duration based on recording start time
    if (recordingStartTime) {
      const duration = (Date.now() - recordingStartTime) / 1000; // Convert to seconds
      setAudioDuration(duration);
      
      // Create a new blob with duration metadata
      const audioWithDuration = new File([audioBlob], 'recording.wav', { 
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
      const response = await voiceAPI.getTransformationStatus(transformationId);
      
      if (response.status === 'success' && response.data) {
        const transformationData = response.data;
        setTransformation(transformationData);
        
        if (transformationData.status === 'completed' && transformationData.transformedAudioId) {
          // Transformation is complete, get the transformed audio URL
          setIsProcessing(false);
          
          // Create a URL for the transformed audio
          // In a real app, you would fetch the audio file or construct a URL to it
          setTransformedAudio(`/api/audio/${transformationData.transformedAudioId}`);
        } else if (transformationData.status === 'failed') {
          setIsProcessing(false);
          setErrorMessage(transformationData.errorMessage || 'Transformation failed');
        } else if (transformationData.status === 'processing' || transformationData.status === 'pending') {
          // Continue polling
          setTimeout(() => pollTransformationStatus(transformationId), 2000);
        }
      } else {
        setIsProcessing(false);
        setErrorMessage('Failed to get transformation status');
      }
    } catch (error) {
      console.error('Error polling transformation status:', error);
      setIsProcessing(false);
      setErrorMessage('Error checking transformation status');
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

  const handleSettingChange = (settingId: string, value: number) => {
    setSettings(prev => ({ ...prev, [settingId]: value }));
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
    
    // Navigate to feed page
    window.location.href = '/feed?source=studio';
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
          
          // Create a URL for the translated audio
          // Use the correct path for translated audio files
          // The translatedAudioId is the ID of the audio file record, which is also used in the filename
          setTranslatedAudio(`/api/audio/translated/translated_${translationData.translatedAudioId}.mp3`);
          console.log(`Setting translated audio URL: /api/audio/translated/translated_${translationData.translatedAudioId}.mp3`);
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
    ? [...voiceEffects, ...emotionVoices]
    : selectedCategory === 'emotion'
    ? emotionVoices.length > 0 ? emotionVoices : voiceEffects.filter(effect => effect.category === selectedCategory)
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
            >
              Preferences
            </Button>
            <Button
              variant="primary"
              leftIcon={<Crown className="h-5 w-5" />}
              as={Link}
              to="/subscription"
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
                    <WaveformVisualizer
                      audioUrl={translatedAudio || transformedAudio || recordedAudio}
                      isPlaying={isPlaying}
                      onPlayPause={() => setIsPlaying(!isPlaying)}
                      height={120}
                    />
                    
                    {/* Play button overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Button
                        variant="primary"
                        size="lg"
                        className="rounded-full w-16 h-16 flex items-center justify-center bg-primary-600/90 hover:bg-primary-700 backdrop-blur-sm"
                        onClick={() => setIsPlaying(!isPlaying)}
                      >
                        {isPlaying ? (
                          <span className="text-2xl">◼</span>
                        ) : (
                          <span className="flex items-center justify-center">
                            {/* Using the imported Play icon */}
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
                              <polygon points="5 3 19 12 5 21 5 3"></polygon>
                            </svg>
                          </span>
                        )}
                      </Button>
                    </div>
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
                        <Button
                          variant="primary"
                          leftIcon={<Wand2 className="h-5 w-5" />}
                          onClick={() => {
                            if (!selectedVoiceId) {
                              setErrorMessage('Please select a voice first');
                              return;
                            }
                            
                            if (!audioFile) {
                              setErrorMessage('No audio file available for transformation');
                              return;
                            }
                            
                            // Pass the selected voice ID in the settings
                            const celebritySettings = {
                              ...settings,
                              voiceId: selectedVoiceId
                            };
                            setIsProcessing(true);
                            setErrorMessage(null);
                            
                            // Call the API with the celebrity_voice effect ID and voice settings
                            voiceAPI.transformAudio(
                              audioFile.id,
                              'celebrity_voice',
                              celebritySettings
                            )
                            .then(response => {
                              if (response.status === 'success' && response.data) {
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
                            })
                            .catch(error => {
                              console.error('Error applying celebrity voice:', error);
                              setIsProcessing(false);
                              
                              // Extract the error message from the API response if available
                              let errorMsg = 'Error applying celebrity voice';
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
                            });
                          }}
                          isLoading={isProcessing}
                          disabled={isProcessing || !selectedVoiceId}
                          fullWidth
                        >
                          {isProcessing ? 'Applying Voice...' : 'Apply Celebrity Voice'}
                        </Button>
                      )}
                      
                      {/* Emotion Voice Effects */}
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                          Emotion Voice Effects
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {(emotionVoices.length > 0 ? emotionVoices : voiceEffects.filter(effect => effect.category === 'emotion'))
                            .slice(0, 4) // Show only the first 4 emotion effects
                            .map(effect => (
                              <Button
                                key={effect.id}
                                variant="outline"
                                size="sm"
                                onClick={() => handleEmotionSelect(effect.effectId)}
                                disabled={isProcessing || !audioFile}
                                className={selectedEmotion === effect.effectId ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30' : ''}
                              >
                                {effect.name}
                              </Button>
                            ))}
                        </div>
                        {isProcessing && selectedEmotion && (
                          <div className="mt-2 text-sm text-primary-600 dark:text-primary-400">
                            Applying {emotionVoices.find(v => v.effectId === selectedEmotion)?.name || selectedEmotion} effect...
                          </div>
                        )}
                      </div>
                      
                      {/* Language Accent Effects */}
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                          Language Accent Effects
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {voiceEffects
                            .filter(effect => effect.category === 'language')
                            .slice(0, 4) // Show only the first 4 language effects
                            .map(effect => (
                              <Button
                                key={effect.id}
                                variant="outline"
                                size="sm"
                                onClick={() => handleEffectSelect(effect.effectId)}
                                disabled={isProcessing || !audioFile}
                                className={selectedEffect === effect.effectId ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30' : ''}
                              >
                                {effect.name}
                              </Button>
                            ))}
                        </div>
                        <div className="mt-2 text-center">
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => setActiveTab('effects')}
                            className="text-primary-600 dark:text-primary-400"
                          >
                            View All Effects
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Translation Controls */}
                  {languages.length > 0 && audioFile && (
                    <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-100 dark:border-primary-800">
                      <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                        <Globe className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                        Translate Audio
                      </h3>
                      
                      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                        <div className="w-full md:w-1/2">
                          <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                            Target Language
                          </label>
                          <select
                            className="w-full p-2 rounded-lg border border-gray-300 dark:border-dark-700 bg-white dark:bg-dark-800 text-dark-900 dark:text-white"
                            value={selectedLanguage}
                            onChange={(e) => handleLanguageChange(e.target.value)}
                            disabled={translationInProgress}
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
                          disabled={translationInProgress}
                          className="mt-2 md:mt-6"
                        >
                          {translationInProgress ? 'Translating...' : 'Translate'}
                        </Button>
                      </div>
                      
                      {translationError && (
                        <div className="mt-3 p-2 bg-error-50 dark:bg-error-900/30 border border-error-200 dark:border-error-800 rounded-lg text-error-700 dark:text-error-400 text-sm">
                          <p>{translationError}</p>
                        </div>
                      )}
                      
                      {translatedAudio && (
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
                      {['all', 'celebrity', 'emotion', 'language', 'custom'].map((category) => (
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
                            effect.isProOnly && !false /* Replace with user.isPro when available */
                              ? 'opacity-60'
                              : ''
                          }`}
                          onClick={() => {
                            if (effect.category === 'emotion') {
                              handleEmotionSelect(effect.effectId);
                            } else {
                              handleEffectSelect(effect.effectId);
                            }
                          }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          disabled={effect.isProOnly && !false /* Replace with user.isPro when available */ || isProcessing}
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
                                <span className="text-xs text-primary-600 dark:text-primary-400 font-medium mt-1">
                                  PRO
                                </span>
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
                    {audioSettings.map((setting) => (
                      <div key={setting.id}>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium text-dark-900 dark:text-white">
                            {setting.name}
                          </label>
                          <span className="text-sm text-dark-500 dark:text-dark-400">
                            {settings[setting.id]}
                          </span>
                        </div>
                        <input
                          type="range"
                          min={setting.min}
                          max={setting.max}
                          step={setting.step}
                          value={settings[setting.id]}
                          onChange={(e) => handleSettingChange(setting.id, Number(e.target.value))}
                          className="w-full h-2 bg-gray-200 dark:bg-dark-700 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    ))}

                    <Button
                      variant="outline"
                      leftIcon={<RefreshCw className="h-5 w-5" />}
                      fullWidth
                      onClick={() => {
                        setSettings(
                          audioSettings.reduce((acc, setting) => ({
                            ...acc,
                            [setting.id]: setting.default
                          }), {})
                        );
                      }}
                    >
                      Reset to Default
                    </Button>
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

            {/* Pro Features Card - Updated with link */}
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
                as={Link}
                to="/subscription"
                leftIcon={<Lock className="h-5 w-5" />}
              >
                Unlock Pro Features
              </Button>
            </Card>
          </div>
        </div>
      </div>
      
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
    </div>
  );
};