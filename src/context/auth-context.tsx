
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
    setLoading(true);
    const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
        if (authUser) {
            setUser(authUser);
            // User is logged in, now listen for the appUser document.
            // Loading remains true until the appUser document is fetched.
            const userDocRef = doc(db, 'users', authUser.uid);
            const unsubscribeFirestore = onSnapshot(userDocRef, (snapshot) => {
                if (snapshot.exists()) {
                    const userData = snapshot.data() as AppUser;
                    setAppUser({ ...userData, uid: authUser.uid, isKycVerified: userData.kycStatus === 'Verified' });
                }
                // setLoading(false) will be called in the next useEffect when appUser is set.
            }, (error) => {
                console.error("Firestore onSnapshot error:", error);
                // If there's an error fetching the user doc, stop loading to avoid getting stuck.
                setAppUser(null);
                setLoading(false);
            });
            return () => unsubscribeFirestore();
        } else {
            // No user is logged in.
            setUser(null);
            setAppUser(null);
            setLoading(false);
        }
    });

    return () => unsubscribeAuth();
}, []);

// This separate useEffect handles the final loading state change.
// It will only trigger when `user` or `appUser` state changes.
useEffect(() => {
    // If we have a user but are still waiting for appUser, keep loading.
    if (user && !appUser) {
        setLoading(true);
    } 
    // If we have both, or if there's no user at all, we can stop loading.
    else if ((user && appUser) || !user) {
        setLoading(false);
    }
}, [user, appUser]);


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
    setAppUser(null);
    setUser(null);
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
