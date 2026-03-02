'use client';

import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

// Only allow users from this domain - configure via NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN env var
const ALLOWED_DOMAIN = process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN || 'your-domain.com';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Check if user's email is from allowed domain
        const emailDomain = user.email?.split('@')[1];
        if (emailDomain !== ALLOWED_DOMAIN) {
          // Unauthorized domain - sign them out
          if (auth) {
            auth.signOut();
          }
          setUser(null);
          setError(`Access restricted to ${ALLOWED_DOMAIN} email addresses only.`);
          setLoading(false);
          return;
        }
      }
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    if (!auth) {
      setError('Firebase authentication not available');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      // Optionally, hint users to sign in with the configured domain
      provider.setCustomParameters({
        hd: ALLOWED_DOMAIN // This hints to use the configured domain (but doesn't enforce)
      });
      await signInWithPopup(auth, provider);
      // The onAuthStateChanged listener will handle validation
    } catch (error: any) {
      console.error("Authentication Error:", error);
      if (error.code === 'auth/popup-closed-by-user') {
        setError('Sign-in cancelled. Please try again.');
      } else if (error.code === 'auth/cancelled-popup-request') {
        setError('Multiple sign-in attempts detected. Please complete the existing sign-in.');
      } else {
        setError('An unexpected error occurred during sign-in.');
      }
      setLoading(false);
    }
  };

  const signOut = async () => {
    if (!auth) {
      router.push('/login');
      return;
    }
    
    setLoading(true);
    await auth.signOut();
    router.push('/login');
  };

  const value = {
    user,
    loading,
    error,
    signInWithGoogle,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}