
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
import { doc, onSnapshot, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { SplashScreen } from '@/components/ui/splash-screen';
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
    let safetyTimer: NodeJS.Timeout | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
        unsubscribeFirestore = null;
      }
      
      setUser(authUser);
      
      if (authUser) {
        setLoading(true);
        const userRef = doc(db, 'users', authUser.uid);
        
        unsubscribeFirestore = onSnapshot(userRef, (snapshot) => {
            if(safetyTimer) clearTimeout(safetyTimer);
            
            if (snapshot.exists()) {
                const data = snapshot.data() as AppUser;
                setAppUser({ ...data, uid: authUser.uid, isKycVerified: data.kycStatus === 'Verified' });
            } else {
                // This case can happen briefly for new users before the cloud function runs.
                // We keep appUser as null and loading as true until the document is created.
                console.log("User document does not exist yet for:", authUser.uid);
            }
            // Only set loading to false if we have the appUser object.
            if(snapshot.exists()) {
              setLoading(false);
            }
        }, (error) => {
            console.error("onSnapshot error:", error);
            if(safetyTimer) clearTimeout(safetyTimer);
            setAppUser(null);
            setLoading(false);
        });
        
        // Safety net: if after 8 seconds we are still loading, something is wrong.
        // This prevents the app from getting stuck on the splash screen forever.
        safetyTimer = setTimeout(() => {
          if (loading) {
            console.warn('Auth context safety timer expired. Forcing loading state to false.');
            setLoading(false);
          }
        }, 8000);

      } else {
        // User is logged out
        setAppUser(null);
        setLoading(false);
        if (unsubscribeFirestore) unsubscribeFirestore();
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeFirestore) unsubscribeFirestore();
      if(safetyTimer) clearTimeout(safetyTimer);
    };
  }, []);
  
  const signUp = async (
    email: string,
    password: string,
    name: string,
    phone: string,
    referralCode?: string
  ) => {
    // 1. Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const newUser = userCredential.user;
    
    // 2. Update their Auth profile (optional but good practice)
    await updateProfile(newUser, { displayName: name });

    // 3. Trigger the cloud function to create the Firestore document
    try {
        const functions = getFunctions();
        const onUserCreate = httpsCallable(functions, 'onUserCreate');
        // This is an async call, but we don't need to wait for it.
        // The onSnapshot listener in useEffect will pick up the new document creation.
        onUserCreate({ 
            name: name,
            phone: phone,
            referralCode: referralCode || null 
        });
    } catch (e) {
        console.error('CRITICAL: onUserCreate callable failed. This might lead to an inconsistent state.', e);
        // The onSnapshot listener will eventually pick up the user, but we rely on the function for robust creation.
    }
    
    return userCredential;
  };

  const signIn = (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
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
