
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import {
  onAuthStateChanged,
  User,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import type { AppUser } from '@/lib/firebase/users';
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
    let unsubscribeFirestore: (() => void) | null = null;

    const minSplashTimePromise = new Promise(resolve => setTimeout(resolve, 5000));

    const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
      }
      
      if (authUser) {
        // User is logged in, start fetching their profile
        const userRef = doc(db, 'users', authUser.uid);
        unsubscribeFirestore = onSnapshot(userRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data() as AppUser;
            setAppUser({ ...data, uid: authUser.uid, isKycVerified: data.kycStatus === 'Verified' });
          } else {
            // This can happen briefly for new users while the cloud function runs
            setAppUser(null);
          }
          setUser(authUser); // Update user state along with appUser
        }, (error) => {
          console.error("Error listening to user document:", error);
          setUser(authUser); // Still set auth user
          setAppUser(null);
        });
      } else {
        // User is logged out
        setUser(null);
        setAppUser(null);
      }
    });

    // Wait for both minimum splash time and auth state to resolve
    Promise.all([minSplashTimePromise, new Promise(resolve => onAuthStateChanged(auth, resolve))]).finally(() => {
        setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeFirestore) unsubscribeFirestore();
    };
  }, []);
  
  const signUp = async (
    email: string,
    password: string,
    name: string,
    phone: string,
    referralCode?: string
  ) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const newUser = userCredential.user;
    
    await updateProfile(newUser, { displayName: name });

    try {
        const functions = getFunctions();
        const onUserCreate = httpsCallable(functions, 'onUserCreate');
        // We can await this, but the listener will also pick it up.
        // It's good to await to ensure the function is called before proceeding.
        await onUserCreate({ 
            name: name,
            phone: phone,
            referralCode: referralCode || null 
        });
    } catch (e) {
        console.error('CRITICAL: onUserCreate callable failed. This might lead to an inconsistent state.', e);
        // We should probably sign the user out here to avoid inconsistent state
        await signOut(auth);
        throw e; // re-throw the error to be caught by the UI
    }
    
    return userCredential;
  };

  const signIn = (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    setLoading(true); // Show splash screen on logout
    await signOut(auth);
    // The onAuthStateChanged listener will handle setting user/appUser to null
    // and loading will be set to false after the min splash time.
  };
  
  const value = {
    user,
    appUser,
    loading,
    installable,
    installPwa,
    signUp,
    signIn,
    logout,
  };
  
  return (
    <AuthContext.Provider value={value}>
      {loading ? <SplashScreen /> : children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
