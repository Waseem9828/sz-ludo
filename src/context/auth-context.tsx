
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
import {
  doc,
  onSnapshot,
} from 'firebase/firestore';
import { SplashScreen } from '@/components/ui/splash-screen';
import type { AppUser } from '@/lib/firebase/users';
import { googleAuthProvider } from '@/lib/firebase/config';
import { setCookie } from 'cookies-next';

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
  signIn: (email: string, password: string) => Promise<any>;
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
    const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
      setUser(authUser); // Set Firebase Auth user immediately

      if (authUser) {
        // If there's an auth user, listen for their Firestore document.
        // setLoading(true) is not needed here as it's true by default and only set to false once appUser is loaded.
        const userDocRef = doc(db, 'users', authUser.uid);
        const unsubscribeFirestore = onSnapshot(userDocRef, (snapshot) => {
          if (snapshot.exists()) {
            const userData = snapshot.data() as AppUser;
            setAppUser({ ...userData, isKycVerified: userData.kycStatus === 'Verified' });
            setLoading(false); // Stop loading ONLY when we have the Firestore user data.
          } else {
            // Document doesn't exist yet, keep loading.
            // The Cloud Function will create it, and this listener will pick it up.
            setAppUser(null);
            setLoading(true);
          }
        }, (error) => {
          console.error("Firestore onSnapshot error:", error);
          setLoading(false); // Stop loading on error
          setAppUser(null);
        });

        return () => unsubscribeFirestore(); // Cleanup Firestore listener
      } else {
        // No authenticated user.
        setAppUser(null);
        setLoading(false); // Stop loading as there is no user to wait for.
      }
    });

    return () => unsubscribeAuth(); // Cleanup auth listener
  }, []);


  const signUp = async (
    email: string,
    password: string,
    name: string,
    phone: string,
    referralCode?: string
  ) => {
    const methods = await fetchSignInMethodsForEmail(auth, email);
    if (methods.length > 0) throw new Error('This email address is already in use.');

    const usersRef = collection(db, "users");
    const phoneQuery = query(usersRef, where("phone", "==", phone), limit(1));
    const phoneQuerySnapshot = await getDocs(phoneQuery);
    if (!phoneQuerySnapshot.empty) throw new Error("This phone number is already registered.");
    
    // Set cookies for the cloud function to pick up.
    // Cloud function will read these and create the Firestore user doc.
    setCookie('newUserName', name, { maxAge: 60 * 5 });
    setCookie('newUserPhone', phone, { maxAge: 60 * 5 });
    if (referralCode) {
      setCookie('referralCode', referralCode, { maxAge: 60 * 5 });
    }
    
    // The onUserCreate cloud function will handle Firestore document creation.
    return await createUserWithEmailAndPassword(auth, email, password);
  };

  const signIn = (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const signInWithGoogle = async (referralCode?: string) => {
    if (referralCode) {
      setCookie('referralCode', referralCode, { maxAge: 60 * 5 });
    }
    // The onUserCreate cloud function will handle Firestore document creation.
    return signInWithPopup(auth, googleAuthProvider);
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
