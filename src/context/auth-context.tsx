
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  onAuthStateChanged,
  User,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  fetchSignInMethodsForEmail,
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import { doc, onSnapshot, getDoc, collection, setDoc, serverTimestamp, runTransaction, query, where, getDocs, limit, increment } from 'firebase/firestore';
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
  
    const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
        unsubscribeFirestore = null;
      }
      
      setUser(authUser);
  
      if (authUser) {
        setLoading(true); // Always set loading to true when authUser is found
        const userRef = doc(db, 'users', authUser.uid);
        
        unsubscribeFirestore = onSnapshot(
          userRef,
          (snapshot) => {
            if (snapshot.exists()) {
              const data = snapshot.data() as AppUser;
              setAppUser({ ...data, uid: authUser.uid, isKycVerified: data.kycStatus === 'Verified' });
              setLoading(false); // Stop loading ONLY when appUser is confirmed
            } else {
              // This handles new sign-ups. The document doesn't exist yet.
              // We keep loading=true and wait for the Cloud Function to create the doc.
              // onSnapshot will fire again once the doc is created.
            }
          },
          (error) => {
            console.error('Firestore onSnapshot error:', error);
            setAppUser(null);
            setLoading(false); // Stop loading on error
          }
        );
      } else {
        // User is signed out, no need to check Firestore.
        setAppUser(null);
        setLoading(false); // Stop loading
      }
    });
  
    // Cleanup function for the main useEffect
    return () => {
      unsubscribeAuth();
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
      }
    };
  }, []); // Empty dependency array ensures this runs only ONCE
  

  const signUp = async (
    email: string,
    password: string,
    name: string,
    phone: string,
    referralCode?: string
  ) => {
    // Check for email existence using Firebase Auth method, not Firestore query
    const methods = await fetchSignInMethodsForEmail(auth, email);
    if (methods.length > 0) {
      throw new Error('This email address is already in use.');
    }
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const functions = getFunctions();
    const onUserCreate = httpsCallable(functions, 'onUserCreate');
    
    // Call the Cloud Function to create the Firestore document and handle referrals securely.
    // This is the source of truth for user document creation.
    await onUserCreate({ name, phone, referralCode });
    
    return userCredential;
  };

  const signIn = (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const signInWithGoogle = async (referralCode?: string) => {
    const result = await signInWithPopup(auth, googleAuthProvider);
    const user = result.user;

    const userDoc = await getDoc(doc(db, 'users', user.uid));
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

  // Render SplashScreen while loading is true, regardless of user state
  if (loading) {
    return (
      <AuthContext.Provider value={value}>
        <SplashScreen />
      </AuthContext.Provider>
    );
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
