
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

    const unsubscribeAuth = onAuthStateChanged(auth, async (authUser) => {
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
      }
      
      setUser(authUser);
      
      if (authUser) {
        setLoading(true); // Always set loading to true when auth state changes to logged in
        const userRef = doc(db, 'users', authUser.uid);

        // Try to get the user document once. If it exists, we are good.
        try {
            const userDoc = await getDoc(userRef);
            if (userDoc.exists()) {
                const data = userDoc.data() as AppUser;
                setAppUser({ ...data, uid: authUser.uid, isKycVerified: data.kycStatus === 'Verified' });
                setLoading(false);
            } else {
                 // The document might not exist yet for a new user. 
                 // Set up a listener to wait for it.
                 console.log("User document not found for " + authUser.uid + ", setting up listener.");
                 unsubscribeFirestore = onSnapshot(userRef, (snapshot) => {
                    if (snapshot.exists()) {
                        console.log("User document created for " + authUser.uid + ", updating app state.");
                        if(unsubscribeFirestore) unsubscribeFirestore(); // Stop listening once we have it
                        
                        const data = snapshot.data() as AppUser;
                        setAppUser({ ...data, uid: authUser.uid, isKycVerified: data.kycStatus === 'Verified' });
                        setLoading(false);
                    }
                });
            }
        } catch (error) {
             console.error("Error fetching user document: ", error);
             setAppUser(null);
             setLoading(false);
        }

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
        // We don't await this call, because the onSnapshot listener will handle the result.
        // This is a "fire and forget" call to the backend.
        onUserCreate({ 
            name: name,
            phone: phone,
            referralCode: referralCode || null 
        });
    } catch (e) {
        console.error('CRITICAL: onUserCreate callable failed. This might lead to an inconsistent state.', e);
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
