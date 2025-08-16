
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
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { SplashScreen } from '@/components/ui/splash-screen';
import type { AppUser } from '@/lib/firebase/users';
import { googleAuthProvider } from '@/lib/firebase/config';
import { getFunctions, httpsCallable } from 'firebase/functions';

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
  signIn: (email: string, password:string) => Promise<any>;
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
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      setUser(authUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setLoading(true); // Always start in a loading state when authUser changes.

    if (user) {
      // If there's an authenticated user, set up a listener for their Firestore document.
      const userDocRef = doc(db, 'users', user.uid);
      const unsubscribeFirestore = onSnapshot(
        userDocRef,
        (snapshot) => {
          if (snapshot.exists()) {
            // Document found, map data to AppUser type and stop loading.
            const userData = snapshot.data() as AppUser;
            setAppUser({ ...userData, isKycVerified: userData.kycStatus === 'Verified' });
            setLoading(false);
          } else {
            // Document not found yet. This can happen for new sign-ups.
            // We KEEP loading true and wait for the Cloud Function to create the doc.
            // The onSnapshot listener will fire again when the doc is created.
             setAppUser(null);
          }
        },
        (error) => {
          // In case of an error (e.g., permissions), stop loading and log the error.
          console.error("Firestore onSnapshot error:", error);
          setAppUser(null);
          setLoading(false);
        }
      );
      
      return () => unsubscribeFirestore();
    } else {
      // If there's no authenticated user, there's nothing to load from Firestore.
      setAppUser(null);
      setLoading(false); // Stop loading.
    }
  }, [user]); // This effect ONLY runs when the `user` object changes.


  const signUp = async (
    email: string,
    password: string,
    name: string,
    phone: string,
    referralCode?: string
  ) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const functions = getFunctions();
    const onUserCreate = httpsCallable(functions, 'onUserCreate');
    // We explicitly call the function to create the user document in Firestore.
    // The onSnapshot listener in the useEffect hook will then pick up the new document.
    await onUserCreate({ name, phone, referralCode });
    return userCredential;
  };

  const signIn = (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const signInWithGoogle = async (referralCode?: string) => {
    const result = await signInWithPopup(auth, googleAuthProvider);
    const user = result.user;

    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
        const functions = getFunctions();
        const onUserCreate = httpsCallable(functions, 'onUserCreate');
        await onUserCreate({ 
            name: user.displayName, 
            phone: user.phoneNumber || '', 
            referralCode 
        });
    }
    
    return result;
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
