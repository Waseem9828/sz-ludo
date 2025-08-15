
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  onAuthStateChanged,
  User,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import {
  doc,
  onSnapshot,
} from 'firebase/firestore';
import { SplashScreen } from '@/components/ui/splash-screen';
import type { AppUser } from '@/lib/firebase/users';
import { googleAuthProvider } from '@/lib/firebase/config';
import { getCookie, setCookie } from 'cookies-next';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

interface AuthContextType {
  user: User | null;
  appUser: AppUser | null;
  loading: boolean;
  installable: boolean;
  installPwa: () => void;
  signUp: (
    email: string,
    password: string,
    name: string,
    phone: string,
    referralCode?: string
  ) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signInWithGoogle: (referralCode?: string) => Promise<any>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installable, setInstallable] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setInstallable(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const installPwa = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setInstallable(false);
  };

  useEffect(() => {
    // This is the master listener for auth state and Firestore data.
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      if (authUser) {
        setUser(authUser);
        // User is logged in, now listen for their Firestore document.
        const userDocRef = doc(db, 'users', authUser.uid);
        const unsubscribeFirestore = onSnapshot(userDocRef, (snapshot) => {
          if (snapshot.exists()) {
            const userData = snapshot.data() as AppUser;
            setAppUser({ ...userData, isKycVerified: userData.kycStatus === 'Verified' });
            setLoading(false); // Stop loading ONLY when we have the Firestore user data.
          } else {
            // This case can happen for a brief moment after signup.
            // We keep loading until the doc is created by the cloud function.
            setLoading(true);
          }
        }, (error) => {
          console.error("Firestore onSnapshot error:", error);
          setLoading(false); // Stop loading on error
        });

        // Return the firestore listener so it gets cleaned up when auth state changes.
        return unsubscribeFirestore;

      } else {
        // No authenticated user.
        setUser(null);
        setAppUser(null);
        setLoading(false);
      }
    });

    // Cleanup the auth listener on component unmount.
    return () => unsubscribe();
  }, []);


  const signUp = async (
    email: string,
    password: string,
    name: string,
    phone: string,
    referralCode?: string
  ) => {
    // Set cookies for the cloud function to pick up.
    setCookie('newUserName', name, { maxAge: 60 * 5 });
    setCookie('newUserPhone', phone, { maxAge: 60 * 5 });
    if (referralCode) {
      setCookie('referralCode', referralCode, { maxAge: 60 * 5 });
    }
    return await createUserWithEmailAndPassword(auth, email, password);
  };

  const signIn = (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const signInWithGoogle = async (referralCode?: string) => {
    if (referralCode) {
      setCookie('referralCode', referralCode, { maxAge: 60 * 5 });
    }
    return signInWithPopup(auth, googleAuthProvider);
  };

  const logout = async () => {
    await signOut(auth);
  };

  if (loading) {
    return <SplashScreen />;
  }

  const value = {
    user,
    appUser,
    loading,
    installable,
    installPwa,
    signUp,
    signIn,
    signInWithGoogle,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
