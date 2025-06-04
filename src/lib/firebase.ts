import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  GithubAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  UserCredential
} from "firebase/auth";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDnPv8154IsGR5OVToS6wzACLnkgqE5gJU",
  authDomain: "seo-demo-b2da8.firebaseapp.com",
  projectId: "seo-demo-b2da8",
  storageBucket: "seo-demo-b2da8.appspot.com",
  messagingSenderId: "860768473241",
  appId: "1:860768473241:web:01a1670be78eea1d066808",
  measurementId: "G-15LF51FJTP"
};

// Initialize Firebase
export const firebaseApp = initializeApp(firebaseConfig);
export const analytics = getAnalytics(firebaseApp);
export const auth = getAuth(firebaseApp);

// Auth providers
const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

// Firebase authentication functions
export const firebaseAuth = {
  // Sign in with email and password
  signInWithEmail: (email: string, password: string): Promise<UserCredential> => {
    return signInWithEmailAndPassword(auth, email, password);
  },

  // Sign up with email and password
  signUpWithEmail: (email: string, password: string): Promise<UserCredential> => {
    return createUserWithEmailAndPassword(auth, email, password);
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