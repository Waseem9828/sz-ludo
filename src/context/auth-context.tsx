
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
    let unsubscribeFirestore: (() => void) | null = null;
  
    const unsubscribeAuth = onAuthStateChanged(auth, async (authUser) => {
      setUser(authUser);
  
      // If signed out, clean up and stop loading
      if (!authUser) {
        if (unsubscribeFirestore) {
          unsubscribeFirestore();
          unsubscribeFirestore = null;
        }
        setAppUser(null);
        setLoading(false);
        return;
      }
  
      // If user is authenticated, set up the Firestore listener for their app data.
      try {
        const userRef = doc(db, 'users', authUser.uid);
        
        // This is the single, authoritative listener for the user's document.
        unsubscribeFirestore = onSnapshot(
          userRef,
          (snapshot) => {
            if (snapshot.exists()) {
              const data = snapshot.data() as AppUser;
              setAppUser({ ...data, uid: authUser.uid, isKycVerified: data.kycStatus === 'Verified' });
            } else {
              // This can happen briefly for new users.
              // We don't set appUser to null, we just wait for the doc to be created by the cloud function.
              // The loading state remains true until the document is created and this listener fires again.
            }
            // We only stop loading if the appUser document exists.
            if (snapshot.exists()) {
                setLoading(false);
            }
          },
          (error) => {
            console.error('Firestore onSnapshot error:', error);
            setAppUser(null);
            setLoading(false); // Stop loading even on error to prevent infinite loop.
          }
        );
      } catch (e) {
        console.error('Error setting up user listener:', e);
        setAppUser(null);
        setLoading(false);
      }
    });
  
    // Cleanup function for the useEffect hook
    return () => {
      unsubscribeAuth();
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
      }
    };
  }, []); // The empty dependency array ensures this effect runs only once on mount.
  

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
    
    // Call the Cloud Function to create the Firestore document and handle referrals securely.
    await onUserCreate({ name, phone, referralCode });
    
    return userCredential;
  };

  const signIn = (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const signInWithGoogle = async (referralCode?: string) => {
    const result = await signInWithPopup(auth, googleAuthProvider);
    const user = result.user;

    const functions = getFunctions();
    const onUserCreate = httpsCallable(functions, 'onUserCreate');
    // Check if user doc exists before calling create function to avoid overwriting existing users
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) {
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

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
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
