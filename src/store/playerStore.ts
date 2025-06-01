import { create } from 'zustand';
import { VoicePost } from '../types';

interface PlayerState {
  currentPost: VoicePost | null;
  isPlaying: boolean;
  duration: number;
  currentTime: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  queue: VoicePost[];
}

interface PlayerStore extends PlayerState {
  setCurrentPost: (post: VoicePost) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  stop: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setPlaybackRate: (rate: number) => void;
  next: () => void;
  previous: () => void;
  addToQueue: (post: VoicePost) => void;
  removeFromQueue: (postId: string) => void;
  clearQueue: () => void;
  updateProgress: (time: number, duration: number) => void;
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  currentPost: null,
  isPlaying: false,
  duration: 0,
  currentTime: 0,
  volume: 0.8,
  isMuted: false,
  playbackRate: 1,
  queue: [],

  setCurrentPost: (post) => {
    set({ currentPost: post, currentTime: 0 });
  },

  play: () => {
    set({ isPlaying: true });
  },

  pause: () => {
    set({ isPlaying: false });
  },

  togglePlay: () => {
    set(state => ({ isPlaying: !state.isPlaying }));
  },

  stop: () => {
    set({ isPlaying: false, currentTime: 0 });
  },

  seek: (time) => {
    set({ currentTime: time });
  },

  setVolume: (volume) => {
    set({ volume, isMuted: volume === 0 });
  },

  toggleMute: () => {
    set(state => ({ isMuted: !state.isMuted }));
  },

  setPlaybackRate: (rate) => {
    set({ playbackRate: rate });
  },

  next: () => {
    const { queue, currentPost } = get();
    if (!currentPost || queue.length === 0) return;
    
    const currentIndex = queue.findIndex(post => post.id === currentPost.id);
    if (currentIndex === -1 || currentIndex === queue.length - 1) return;
    
    set({ 
      currentPost: queue[currentIndex + 1],
      currentTime: 0,
      isPlaying: true
    });
  },

  previous: () => {
    const { queue, currentPost } = get();
    if (!currentPost || queue.length === 0) return;
    
    const currentIndex = queue.findIndex(post => post.id === currentPost.id);
    if (currentIndex <= 0) return;
    
    set({ 
      currentPost: queue[currentIndex - 1],
      currentTime: 0,
      isPlaying: true
    });
  },

  addToQueue: (post) => {
    set(state => {
      const exists = state.queue.some(item => item.id === post.id);
      if (exists) return state;
      
      return { queue: [...state.queue, post] };
    });
  },

  removeFromQueue: (postId) => {
    set(state => ({
      queue: state.queue.filter(post => post.id !== postId)
    }));
  },

  clearQueue: () => {
    set({ queue: [] });
  },

  updateProgress: (time, duration) => {
    set({ currentTime: time, duration });
  }
}));