
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  onAuthStateChanged,
  User,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  fetchSignInMethodsForEmail,
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import {
  doc,
  onSnapshot,
  collection,
  query,
  where,
  getDocs,
  limit,
  getDoc,
} from 'firebase/firestore';
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
        const userDocRef = doc(db, 'users', authUser.uid);
        const unsubscribeFirestore = onSnapshot(userDocRef, (snapshot) => {
          if (snapshot.exists()) {
            const userData = snapshot.data() as AppUser;
            setAppUser({ ...userData, isKycVerified: userData.kycStatus === 'Verified' });
            setLoading(false); // Stop loading ONLY when we have the Firestore user data.
          } else {
             // Document might not exist yet, especially on first sign-up.
             // We keep loading, the create user flow will trigger the update.
             // This prevents a flicker of a "no-app-user" state.
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
    // 1. Check for existing email and phone
    const methods = await fetchSignInMethodsForEmail(auth, email);
    if (methods.length > 0) throw new Error('This email address is already in use.');

    const usersRef = collection(db, 'users');
    const phoneQuery = query(usersRef, where('phone', '==', phone), limit(1));
    const phoneQuerySnapshot = await getDocs(phoneQuery);
    if (!phoneQuerySnapshot.empty) throw new Error('This phone number is already registered.');

    // 2. Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    // 3. Call the Cloud Function to create the Firestore document
    try {
        const functions = getFunctions();
        const onUserCreate = httpsCallable(functions, 'onUserCreate');
        await onUserCreate({ name, phone, referralCode });
    } catch (error) {
        // If function fails, this is a critical error.
        // We should probably delete the auth user to allow them to retry.
        await userCredential.user.delete();
        console.error('Cloud Function call failed, rolling back Auth user creation.', error);
        throw new Error('Could not complete your registration. Please try again.');
    }

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

    // If the user document does NOT exist, it's a first-time sign-in.
    if (!userDoc.exists()) {
        try {
            const functions = getFunctions();
            const onUserCreate = httpsCallable(functions, 'onUserCreate');
            // For Google sign-in, we might not have a phone number.
            // We pass what we have from the Google profile.
            await onUserCreate({ 
                name: user.displayName, 
                phone: user.phoneNumber || '', 
                referralCode 
            });
        } catch (error) {
            await user.delete();
            console.error('Cloud Function call failed for Google Sign-In.', error);
            throw new Error('Could not complete your registration with Google. Please try again.');
        }
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
