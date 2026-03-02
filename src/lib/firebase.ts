// Import the functions you need from the SDKs you need
import { initializeApp, getApps, type FirebaseOptions } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'dev-placeholder-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'dev-placeholder.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'dev-placeholder-project', 
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'dev-placeholder.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '000000000000',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:000000000000:web:development',
};

// Initialize Firebase - this is safe during build
let app;
let authInstance;

try {
  app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  // Initialize auth - but only actually use it in the browser
  authInstance = getAuth(app);
} catch (error) {
  console.warn('Firebase initialization failed:', error);
  // Create a mock auth instance for development
  authInstance = null;
}

// Export with proper type
export const auth: Auth | null = authInstance;