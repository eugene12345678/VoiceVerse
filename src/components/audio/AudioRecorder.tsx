import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { IconButton } from '../ui/IconButton';
import { Card } from '../ui/Card';
import { cn } from '../../lib/utils';

interface AudioRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  maxDuration?: number; // in seconds
  className?: string;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onRecordingComplete,
  maxDuration = 60,
  className
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Set up audio analyzer
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;
      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);
      
      // Start visualizing audio levels
      visualizeAudio();
      
      // Set up media recorder
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setIsProcessing(true);
        // Simulate processing delay
        setTimeout(() => {
          onRecordingComplete(audioBlob);
          setIsProcessing(false);
        }, 1000);
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      
      // Start timer
      timerRef.current = window.setInterval(() => {
        setRecordingTime((prevTime) => {
          if (prevTime >= maxDuration - 1) {
            stopRecording();
            return maxDuration;
          }
          return prevTime + 1;
        });
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    }
  };

  // Visualize audio levels
  const visualizeAudio = () => {
    if (!analyserRef.current || !dataArrayRef.current) return;
    
    const updateAudioLevel = () => {
      analyserRef.current!.getByteFrequencyData(dataArrayRef.current!);
      const average = dataArrayRef.current!.reduce((sum, value) => sum + value, 0) / dataArrayRef.current!.length;
      setAudioLevel(average / 255); // Normalize to 0-1
      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    };
    
    animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card 
      variant="glass" 
      className={cn("p-6", className)}
    >
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="relative">
          {/* Pulsing animation for recording button */}
          {isRecording && (
            <motion.div
              className="absolute inset-0 rounded-full bg-error-500"
              animate={{ 
                scale: [1, 1.2, 1], 
                opacity: [0.7, 0.5, 0.7] 
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
            />
          )}
          
          {/* Audio level visualization */}
          {isRecording && (
            <div className="absolute -inset-4 flex items-center justify-center pointer-events-none">
              <div className="audio-wave">
                <motion.span 
                  animate={{ scaleY: 0.5 + audioLevel * 1.5 }}
                  transition={{ duration: 0.1 }}
                  style={{ height: '32px' }}
                />
                <motion.span 
                  animate={{ scaleY: 0.5 + audioLevel * 1 }}
                  transition={{ duration: 0.1, delay: 0.05 }}
                  style={{ height: '32px' }}
                />
                <motion.span 
                  animate={{ scaleY: 0.5 + audioLevel * 2 }}
                  transition={{ duration: 0.1, delay: 0.1 }}
                  style={{ height: '32px' }}
                />
                <motion.span 
                  animate={{ scaleY: 0.5 + audioLevel * 1.2 }}
                  transition={{ duration: 0.1, delay: 0.15 }}
                  style={{ height: '32px' }}
                />
                <motion.span 
                  animate={{ scaleY: 0.5 + audioLevel * 1.7 }}
                  transition={{ duration: 0.1, delay: 0.2 }}
                  style={{ height: '32px' }}
                />
              </div>
            </div>
          )}
          
          {/* Record button */}
          {isProcessing ? (
            <div className="h-16 w-16 flex items-center justify-center rounded-full bg-gray-200 dark:bg-dark-800">
              <Loader className="h-8 w-8 text-dark-500 animate-spin" />
            </div>
          ) : isRecording ? (
            <IconButton
              icon={<Square className="h-8 w-8" />}
              variant="accent"
              size="lg"
              className="h-16 w-16 rounded-full"
              onClick={stopRecording}
              aria-label="Stop recording"
            />
          ) : (
            <IconButton
              icon={<Mic className="h-8 w-8" />}
              variant="primary"
              size="lg"
              className="h-16 w-16 rounded-full"
              onClick={startRecording}
              aria-label="Start recording"
            />
          )}
        </div>
        
        {/* Recording time */}
        <div className="text-lg font-mono">
          {isRecording ? formatTime(recordingTime) : "00:00"}
        </div>
        
        <div className="text-center text-dark-600 dark:text-dark-400 text-sm">
          {isProcessing 
            ? "Processing your recording..." 
            : isRecording 
              ? "Tap to stop recording" 
              : "Tap to start recording"}
        </div>
        
        {/* Progress bar */}
        {isRecording && (
          <div className="w-full bg-gray-200 dark:bg-dark-800 rounded-full h-1.5 mt-2">
            <motion.div 
              className="bg-primary-600 dark:bg-primary-500 h-1.5 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${(recordingTime / maxDuration) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}
      </div>
    </Card>
  );
};