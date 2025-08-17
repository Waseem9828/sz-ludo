
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import {
  onAuthStateChanged,
  User,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  fetchSignInMethodsForEmail,
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
            unsubscribeFirestore = null;
        }

        setUser(authUser);

        if (!authUser) {
            setAppUser(null);
            setLoading(false);
            return;
        }
        
        setLoading(true);

        safetyTimer = setTimeout(() => {
            console.warn('Safety timer fired (8s)! Forcing loading state to false.');
            if (loading) setLoading(false);
        }, 8000);

        const userRef = doc(db, 'users', authUser.uid);
        
        unsubscribeFirestore = onSnapshot(userRef, (snapshot) => {
            if (safetyTimer) clearTimeout(safetyTimer);
            
            if (snapshot.exists()) {
                const data = snapshot.data() as AppUser;
                setAppUser({ ...data, uid: authUser.uid, isKycVerified: data.kycStatus === 'Verified' });
            } else {
                setAppUser(null);
                 console.warn(`Firestore document for user ${authUser.uid} does not exist. This may happen briefly during signup.`);
            }
            setLoading(false);
        }, (error) => {
            console.error('onSnapshot error (userRef):', error);
            if (safetyTimer) clearTimeout(safetyTimer);
            setAppUser(null);
            setLoading(false);
        });
    });

    return () => {
        unsubscribeAuth();
        if (unsubscribeFirestore) unsubscribeFirestore();
        if (safetyTimer) clearTimeout(safetyTimer);
    };
}, [loading]); // Added loading to dependency array to clear timer correctly
  
  const signUp = async (
    email: string,
    password: string,
    name: string,
    phone: string,
    referralCode?: string
  ) => {
    const methods = await fetchSignInMethodsForEmail(auth, email);
    if (methods.length > 0) {
      throw new Error('This email address is already in use.');
    }
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const newUser = userCredential.user;
    
    // Explicitly update profile before creating doc to ensure displayName is available
    await updateProfile(newUser, { displayName: name });

    try {
        const functions = getFunctions();
        const onUserCreate = httpsCallable(functions, 'onUserCreate');
        await onUserCreate({ 
            name: name,
            phone: phone,
            referralCode: referralCode || null 
        });
    } catch (e) {
        console.error('CRITICAL: onUserCreate callable failed. The user document may not have been created.', e);
        // Even if it fails, the onAuthStateChanged listener will eventually pick up the user,
        // but the appUser might be missing, leading to issues. This log is crucial for debugging.
        // A more robust solution could involve a client-side fallback here, but let's rely on the function first.
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
  
  // Render splash screen only during the initial authentication check.
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
