import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  GithubAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  UserCredential,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  indexedDBLocalPersistence,
  connectAuthEmulator
} from "firebase/auth";
import { authAPI } from './api';

// Firebase configuration - loaded from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Validate that all required Firebase config values are present
const requiredConfigKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
const missingKeys = requiredConfigKeys.filter(key => !firebaseConfig[key as keyof typeof firebaseConfig]);

if (missingKeys.length > 0) {
  console.error('Missing Firebase configuration keys:', missingKeys);
  throw new Error(`Missing Firebase configuration: ${missingKeys.join(', ')}. Please check your .env file.`);
}

// Enable Firebase Auth persistence to keep users logged in
// This helps prevent frequent login requirements

// Initialize Firebase
export const firebaseApp = initializeApp(firebaseConfig);

// Initialize Analytics only if supported (prevents errors in some environments)
export let analytics = null;
isSupported().then(supported => {
  if (supported) {
    analytics = getAnalytics(firebaseApp);
  }
}).catch(error => {
  console.error("Firebase analytics error:", error);
});

export const auth = getAuth(firebaseApp);

// Set persistence to improve user experience
setPersistence(auth, browserLocalPersistence).catch(error => {
  console.error("Firebase persistence error:", error);
});

// Check for development mode using import.meta instead of process.env
const isDevelopment = import.meta.env?.MODE === 'development';
const useAuthEmulator = import.meta.env?.VITE_USE_AUTH_EMULATOR === 'true';

// Connect to Firebase Auth Emulator in development mode
if (isDevelopment && useAuthEmulator) {
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  console.log('Connected to Firebase Auth Emulator');
}

// Auth providers
const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

// Firebase authentication functions
export const firebaseAuth = {
  // Sign in with email and password - using backend instead of Firebase
  signInWithEmail: async (email: string, password: string): Promise<UserCredential> => {
    try {
      // Use backend authentication instead of Firebase for email/password
      const response = await authAPI.login(email.trim(), password);
      
      // Create a Firebase-compatible UserCredential object using the backend user ID
      const userCredential: UserCredential = {
        user: {
          uid: response.user.id, // Use the backend user ID directly
          email: response.user.email,
          displayName: response.user.displayName || response.user.username,
          photoURL: response.user.profilePicture,
          emailVerified: true,
          isAnonymous: false,
          metadata: {
            creationTime: response.user.createdAt,
            lastSignInTime: new Date().toISOString()
          },
          providerData: [],
          refreshToken: '',
          tenantId: null,
          delete: async () => { throw new Error('Not implemented'); },
          getIdToken: async () => response.token, // Use the backend JWT token
          getIdTokenResult: async () => ({ token: response.token } as any),
          reload: async () => {},
          toJSON: () => ({}),
          providerId: 'password',
          phoneNumber: null,
        } as any,
        providerId: 'password',
        operationType: 'signIn',
      };
      
      return userCredential;
    } catch (error: any) {
      console.error("Backend login error:", error);
      throw new Error(error.response?.data?.message || error.message || 'Authentication failed');
    }
  },

  // Sign up with email and password - using backend instead of Firebase
  signUpWithEmail: async (email: string, password: string, username?: string): Promise<UserCredential> => {
    try {
      // Use backend authentication instead of Firebase for email/password
      const response = await authAPI.signup(
        username || email.trim().split('@')[0], 
        email.trim(), 
        password
      );
      
      // Create a Firebase-compatible UserCredential object using the backend user ID
      const userCredential: UserCredential = {
        user: {
          uid: response.user.id, // Use the backend user ID directly
          email: response.user.email,
          displayName: response.user.displayName || response.user.username,
          photoURL: response.user.profilePicture,
          emailVerified: true,
          isAnonymous: false,
          metadata: {
            creationTime: response.user.createdAt,
            lastSignInTime: new Date().toISOString()
          },
          providerData: [],
          refreshToken: '',
          tenantId: null,
          delete: async () => { throw new Error('Not implemented'); },
          getIdToken: async () => response.token, // Use the backend JWT token
          getIdTokenResult: async () => ({ token: response.token } as any),
          reload: async () => {},
          toJSON: () => ({}),
          providerId: 'password',
          phoneNumber: null,
        } as any,
        providerId: 'password',
        operationType: 'signIn',
      };
      
      return userCredential;
    } catch (error: any) {
      console.error("Backend signup error:", error);
      
      // Provide user-friendly error messages
      if (error.response?.data?.message?.includes('already exists')) {
        throw new Error('This email is already registered. Please use a different email or try logging in.');
      } else if (error.response?.data?.message?.includes('invalid email')) {
        throw new Error('Invalid email format. Please enter a valid email address.');
      } else if (error.response?.data?.message?.includes('password')) {
        throw new Error('Password is too weak. Please use a stronger password with at least 6 characters.');
      } else {
        throw new Error(error.response?.data?.message || error.message || 'Registration failed');
      }
    }
  },

  // Sign in with Google
  signInWithGoogle: (): Promise<UserCredential> => {
    return signInWithPopup(auth, googleProvider);
  },

  // Sign in with GitHub
  signInWithGithub: (): Promise<UserCredential> => {
    return signInWithPopup(auth, githubProvider);
  },

  // Sign out
  signOut: (): Promise<void> => {
    return signOut(auth);
  },

  // Get current user
  getCurrentUser: () => {
    return auth.currentUser;
  }
};