import { create } from 'zustand';
import { AuthState, User } from '../types';
import { authAPI } from '../lib/api';

interface AuthStore extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (username: string, email: string, password: string) => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await authAPI.login(email, password);
      
      // Store token in localStorage
      localStorage.setItem('token', response.token);
      
      set({ 
        user: response.user,
        isAuthenticated: true,
        isLoading: false
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      set({ 
        error: errorMessage,
        isLoading: false 
      });
      throw new Error(errorMessage);
    }
  },

  logout: () => {
    // Remove token from localStorage
    localStorage.removeItem('token');
    
    set({ 
      user: null,
      isAuthenticated: false,
      error: null
    });
  },

  register: async (username: string, email: string, password: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await authAPI.signup(username, email, password);
      
      // Store token in localStorage
      localStorage.setItem('token', response.token);
      
      set({ 
        user: response.user,
        isAuthenticated: true,
        isLoading: false
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      set({ 
        error: errorMessage,
        isLoading: false 
      });
      throw new Error(errorMessage);
    }
  },

  updateProfile: async (userData: Partial<User>) => {
    set({ isLoading: true, error: null });
    
    try {
      // API call would go here
      
      set(state => ({
        user: state.user ? { ...state.user, ...userData } : null,
        isLoading: false
      }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Profile update failed';
      set({ 
        error: errorMessage,
        isLoading: false 
      });
    }
  },
  
  checkAuth: async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      return;
    }
    
    set({ isLoading: true });
    
    try {
      const response = await authAPI.getCurrentUser();
      
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false
      });
    } catch (error) {
      // If token is invalid, remove it
      localStorage.removeItem('token');
      
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false
      });
    }
  }
}));