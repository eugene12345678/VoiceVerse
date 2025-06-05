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

// Firebase configuration
// Using the original Firebase configuration to avoid API key errors
const firebaseConfig = {
  apiKey: "AIzaSyDnPv8154IsGR5OVToS6wzACLnkgqE5gJU",
  authDomain: "seo-demo-b2da8.firebaseapp.com",
  projectId: "seo-demo-b2da8",
  storageBucket: "seo-demo-b2da8.appspot.com",
  messagingSenderId: "860768473241",
  appId: "1:860768473241:web:01a1670be78eea1d066808",
  measurementId: "G-15LF51FJTP"
};

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
      
      // Create a Firebase-compatible UserCredential object
      const userCredential: UserCredential = {
        user: {
          uid: response.user.id,
          email: response.user.email,
          displayName: response.user.username,
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
          getIdToken: async () => response.token,
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
      
      // Create a Firebase-compatible UserCredential object
      const userCredential: UserCredential = {
        user: {
          uid: response.user.id,
          email: response.user.email,
          displayName: response.user.username,
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
          getIdToken: async () => response.token,
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