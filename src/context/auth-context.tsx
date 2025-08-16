
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
      if (!authUser) {
        // If there's no authenticated user, stop listening, clear appUser, and finish loading.
        setAppUser(null);
        setLoading(false);
      }
      // The logic to fetch appUser and set loading to false is now handled
      // in the snapshot listener below, which depends on `user`.
    });
    return () => unsubscribe();
  }, []);
  
  useEffect(() => {
    if (user) {
        // If we have an authenticated user, start listening to their Firestore document.
        const userDocRef = doc(db, 'users', user.uid);
        const unsubscribeFirestore = onSnapshot(userDocRef, (snapshot) => {
            if (snapshot.exists()) {
                // If the document exists, set appUser and finish loading.
                const userData = snapshot.data() as AppUser;
                setAppUser({ ...userData, isKycVerified: userData.kycStatus === 'Verified' });
                setLoading(false);
            } else {
                // This case handles new sign-ups. The document doesn't exist yet.
                // We keep loading true and wait for the onUserCreate function to create it.
                // The snapshot listener will then fire again with the new data.
                setAppUser(null);
                setLoading(true); 
            }
        }, (error) => {
            console.error("Firestore onSnapshot error:", error);
            setAppUser(null);
            setLoading(false);
        });

        return () => unsubscribeFirestore();
    }
  }, [user]);


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
