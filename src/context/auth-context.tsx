
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  onAuthStateChanged,
  User,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';
import type { AppUser } from '@/lib/firebase/users';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { SplashScreen } from '@/components/ui/splash-screen';

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
    const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
      setUser(authUser);
      // If the user logs out, we can stop loading and clear appUser
      if (!authUser) {
        setAppUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);
  
  useEffect(() => {
    // This effect runs whenever the user object changes.
    // It's responsible for fetching the corresponding appUser from Firestore.
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      const unsubscribeFirestore = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as AppUser;
          setAppUser({ ...data, uid: user.uid, isKycVerified: data.kycStatus === 'Verified' });
        } else {
          // This can happen briefly after signup, before the user document is created.
          // We set appUser to null and let the loading state persist.
          setAppUser(null); 
        }
        // Crucially, we only stop loading once we have the full appUser profile.
        setLoading(false);
      }, (error) => {
        console.error("Error listening to user document:", error);
        setAppUser(null);
        setLoading(false); // Also stop loading on error
      });

      return () => unsubscribeFirestore();
    } else {
      // If there's no user, there's nothing to load from Firestore.
      setLoading(false);
    }
  }, [user]);


  const signUp = async (
    email: string,
    password: string,
    name: string,
    phone: string,
    referralCode?: string
  ) => {
    setLoading(true); // Start loading before signup
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const newUser = userCredential.user;
    
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
        console.error('CRITICAL: onUserCreate callable failed. This might lead to an inconsistent state.', e);
        await signOut(auth);
        setLoading(false); // Stop loading on failure
        throw e;
    }
    
    return userCredential;
  };

  const signIn = (email: string, password: string) => {
    setLoading(true); // Start loading before sign-in attempt
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    setLoading(true); // Start loading before sign out
    await signOut(auth);
    setUser(null);
    setAppUser(null);
    setLoading(false); // Finish loading after sign out
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
