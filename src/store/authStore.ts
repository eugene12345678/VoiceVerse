import { create } from 'zustand';
import { AuthState, User } from '../types';
import { authAPI } from '../lib/api';
import { firebaseAuth } from '../lib/firebase';
import { UserCredential } from 'firebase/auth';

interface AuthStore extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithGithub: () => Promise<void>;
  logout: () => void;
  register: (username: string, email: string, password: string) => Promise<void>;
  registerWithGoogle: () => Promise<void>;
  registerWithGithub: () => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  checkAuth: () => Promise<void>;
}

// Helper function to process Firebase user credentials
const processFirebaseUser = async (userCredential: UserCredential): Promise<{user: User, token: string}> => {
  const { user } = userCredential;
  const token = await user.getIdToken();
  
  // Create a user object that matches our app's User type
  const appUser: User = {
    id: user.uid,
    username: user.displayName || user.email?.split('@')[0] || 'User',
    email: user.email || '',
    profilePicture: user.photoURL || '',
    createdAt: user.metadata.creationTime || new Date().toISOString(),
  };
  
  return { user: appUser, token };
};

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    
    try {
      // Use Firebase authentication
      const userCredential = await firebaseAuth.signInWithEmail(email, password);
      const { user, token } = await processFirebaseUser(userCredential);
      
      // Store token in localStorage
      localStorage.setItem('token', token);
      
      // Store user data in localStorage for persistence
      localStorage.setItem('userData', JSON.stringify({
        id: user.id,
        username: user.username,
        displayName: user.displayName || user.username,
        email: user.email,
        avatar: user.profilePicture,
        profilePicture: user.profilePicture
      }));
      
      set({ 
        user,
        isAuthenticated: true,
        isLoading: false
      });
    } catch (error: any) {
      const errorMessage = error.message || 'Login failed';
      set({ 
        error: errorMessage,
        isLoading: false 
      });
      throw new Error(errorMessage);
    }
  },

  loginWithGoogle: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const userCredential = await firebaseAuth.signInWithGoogle();
      const { user, token } = await processFirebaseUser(userCredential);
      
      // Store token in localStorage
      localStorage.setItem('token', token);
      
      // Store user data in localStorage for persistence
      localStorage.setItem('userData', JSON.stringify({
        id: user.id,
        username: user.username,
        displayName: user.displayName || user.username,
        email: user.email,
        avatar: user.profilePicture,
        profilePicture: user.profilePicture
      }));
      
      set({ 
        user,
        isAuthenticated: true,
        isLoading: false
      });
    } catch (error: any) {
      const errorMessage = error.message || 'Google login failed';
      set({ 
        error: errorMessage,
        isLoading: false 
      });
      throw new Error(errorMessage);
    }
  },

  loginWithGithub: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const userCredential = await firebaseAuth.signInWithGithub();
      const { user, token } = await processFirebaseUser(userCredential);
      
      // Store token in localStorage
      localStorage.setItem('token', token);
      
      set({ 
        user,
        isAuthenticated: true,
        isLoading: false
      });
    } catch (error: any) {
      const errorMessage = error.message || 'GitHub login failed';
      set({ 
        error: errorMessage,
        isLoading: false 
      });
      throw new Error(errorMessage);
    }
  },

  logout: async () => {
    try {
      // Sign out from Firebase
      await firebaseAuth.signOut();
      
      // Remove token from localStorage
      localStorage.removeItem('token');
      
      set({ 
        user: null,
        isAuthenticated: false,
        error: null
      });
    } catch (error: any) {
      console.error('Logout error:', error);
    }
  },

  register: async (username: string, email: string, password: string) => {
    set({ isLoading: true, error: null });
    
    try {
      // Use backend authentication for signup via the Firebase adapter
      const userCredential = await firebaseAuth.signUpWithEmail(email, password, username);
      const { user, token } = await processFirebaseUser(userCredential);
      
      // Store token in localStorage
      localStorage.setItem('token', token);
      
      set({ 
        user: { ...user, username },
        isAuthenticated: true,
        isLoading: false
      });
    } catch (error: any) {
      const errorMessage = error.message || 'Registration failed';
      set({ 
        error: errorMessage,
        isLoading: false 
      });
      throw new Error(errorMessage);
    }
  },

  registerWithGoogle: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const userCredential = await firebaseAuth.signInWithGoogle();
      const { user, token } = await processFirebaseUser(userCredential);
      
      // Store token in localStorage
      localStorage.setItem('token', token);
      
      set({ 
        user,
        isAuthenticated: true,
        isLoading: false
      });
    } catch (error: any) {
      const errorMessage = error.message || 'Google registration failed';
      set({ 
        error: errorMessage,
        isLoading: false 
      });
      throw new Error(errorMessage);
    }
  },

  registerWithGithub: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const userCredential = await firebaseAuth.signInWithGithub();
      const { user, token } = await processFirebaseUser(userCredential);
      
      // Store token in localStorage
      localStorage.setItem('token', token);
      
      set({ 
        user,
        isAuthenticated: true,
        isLoading: false
      });
    } catch (error: any) {
      const errorMessage = error.message || 'GitHub registration failed';
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
      // Update the local state
      set(state => {
        const updatedUser = state.user ? { ...state.user, ...userData } : null;
        
        // Persist updated user data to localStorage
        if (updatedUser) {
          localStorage.setItem('userData', JSON.stringify({
            id: updatedUser.id,
            username: updatedUser.username,
            displayName: updatedUser.displayName,
            email: updatedUser.email,
            avatar: updatedUser.avatar,
            profilePicture: updatedUser.profilePicture || updatedUser.avatar
          }));
        }
        
        return {
          user: updatedUser,
          isLoading: false
        };
      });
    } catch (error: any) {
      const errorMessage = error.message || 'Profile update failed';
      set({ 
        error: errorMessage,
        isLoading: false 
      });
    }
  },
  
  checkAuth: async () => {
    set({ isLoading: true });
    
    try {
      // First check if we have a Firebase user
      const currentUser = firebaseAuth.getCurrentUser();
      
      if (currentUser) {
        // Get the token from Firebase
        const token = await currentUser.getIdToken();
        
        // Create a user object from Firebase user
        const user: User = {
          id: currentUser.uid,
          username: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
          displayName: currentUser.displayName || 'User',
          email: currentUser.email || '',
          avatar: currentUser.photoURL || '',
          profilePicture: currentUser.photoURL || '',
          bio: '',
          followers: 0,
          following: 0,
          joined: currentUser.metadata.creationTime || new Date().toISOString(),
          createdAt: currentUser.metadata.creationTime || new Date().toISOString(),
          isVerified: false,
          isPublic: true
        };
        
        // Store token in localStorage
        localStorage.setItem('token', token);
        
        // Store user data in localStorage for persistence
        localStorage.setItem('userData', JSON.stringify({
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          email: user.email,
          avatar: user.avatar,
          profilePicture: user.profilePicture
        }));
        
        set({
          user,
          isAuthenticated: true,
          isLoading: false
        });
        return;
      }
      
      // If no Firebase user, check if we have a token and userData in localStorage
      const token = localStorage.getItem('token');
      const storedUserData = localStorage.getItem('userData');
      
      if (!token) {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false
        });
        return;
      }
      
      // If we have a token but no user, consider the user authenticated
      // Use stored user data if available
      let userData = {
        id: 'user-id',
        username: '',
        displayName: '',
        email: '',
        avatar: '',
        profilePicture: ''
      };
      
      if (storedUserData) {
        try {
          userData = JSON.parse(storedUserData);
        } catch (e) {
          console.error('Error parsing stored user data:', e);
        }
      }
      
      set({
        user: {
          id: userData.id,
          username: userData.username || userData.email?.split('@')[0] || 'User',
          displayName: userData.displayName || userData.username || 'User',
          email: userData.email,
          avatar: userData.avatar,
          profilePicture: userData.profilePicture,
          bio: '',
          followers: 0,
          following: 0,
          joined: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          isVerified: false,
          isPublic: true
        },
        isAuthenticated: true,
        isLoading: false
      });
    } catch (error) {
      console.error('Error checking authentication:', error);
      // If any error occurs, clear the auth state
      localStorage.removeItem('token');
      
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false
      });
    }
  }
}));