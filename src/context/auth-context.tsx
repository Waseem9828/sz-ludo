
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
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
import { doc, onSnapshot, getDoc, setDoc, serverTimestamp, collection, runTransaction, writeBatch, Timestamp } from 'firebase/firestore';
import { SplashScreen } from '@/components/ui/splash-screen';
import type { AppUser } from '@/lib/firebase/users';
import { getFunctions, httpsCallable } from 'firebase/functions';

const defaultAvatar = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi_h6LUuqTTKYsn5TfUZwkI6Aib6Y0tOzQzcoZKstURqxyl-PJXW1DKTkF2cPPNNUbP3iuDNsOBVOYx7p-ZwrodI5w9fyqEwoabj8rU0mLzSbT5GCFUKpfCc4s_LrtHcWFDvvRstCghAfQi5Zfv2fipdZG8h4dU4vGt-eFRn-gS3QTg6_JJKhv0Yysr_ZY/s1600/82126.png";

// This helper function creates the user document on the client-side as a fallback.
const createFirestoreUserDocument = async (user: User, additionalData: Partial<AppUser> = {}) => {
  const userRef = doc(db, 'users', user.uid);
  const { displayName, email, photoURL } = user;

  const newAppUser: AppUser = {
    uid: user.uid,
    email: email || "",
    displayName: displayName || "New User",
    photoURL: photoURL || defaultAvatar,
    phone: additionalData.phone || "",
    wallet: { balance: 10, winnings: 0 },
    kycStatus: 'Pending',
    status: 'active',
    gameStats: { played: 0, won: 0, lost: 0 },
    lifetimeStats: { totalDeposits: 0, totalWithdrawals: 0, totalWinnings: 0 },
    referralStats: { referredCount: 0, totalEarnings: 0 },
    isKycVerified: false,
    ...additionalData,
    createdAt: serverTimestamp() as Timestamp,
  };
  
  if (email && (email.toLowerCase() === "admin@example.com" || email.toLowerCase() === "super@admin.com")) {
      (newAppUser as any).role = 'superadmin';
      (newAppUser as any).lifetimeStats.totalRevenue = 0;
  }
  
  if (additionalData.referralStats?.referredBy) {
      newAppUser.referralStats = {
          ...newAppUser.referralStats,
          referredBy: additionalData.referralStats.referredBy
      }
  }

  // Using a write batch for atomicity
  const batch = writeBatch(db);
  
  // Set the new user document
  batch.set(userRef, newAppUser);
  
  // Log the sign-up bonus transaction
  const transLogRef = doc(collection(db, 'transactions'));
  batch.set(transLogRef, {
      userId: user.uid,
      userName: newAppUser.displayName,
      amount: 10,
      type: "Sign Up",
      status: "completed",
      notes: "Welcome bonus",
      createdAt: serverTimestamp(),
  });
  
  // Commit the batch
  await batch.commit();
};


// This function robustly ensures a user document exists.
const ensureUserDocument = async (user: User, additionalData: Partial<AppUser> = {}) => {
  if (!user) return;
  console.log("Ensuring user doc for", user.uid);
  const userRef = doc(db, 'users', user.uid);
  
  const docSnap = await getDoc(userRef);
  if (docSnap.exists()) {
    console.log("User doc already exists.");
    return; // Document already exists, no action needed.
  }

  console.log("User doc not found, attempting to create it now (client-side fallback).");
  try {
    await createFirestoreUserDocument(user, additionalData);
    console.log("Client-side fallback: user document created successfully.");
  } catch (error) {
    console.error("CRITICAL: Fallback user document creation failed:", error);
  }
};


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
      if(safetyTimer) {
        clearTimeout(safetyTimer);
        safetyTimer = null;
      }

      setUser(authUser);
  
      if (authUser) {
        // Start loading and set a safety timer to prevent infinite loops
        setLoading(true);
        safetyTimer = setTimeout(() => {
            console.warn("Safety timer fired! Forcing loading state to false.");
            setLoading(false);
        }, 8000);
        
        // This will create the user doc if it's missing.
        await ensureUserDocument(authUser);
        
        const userRef = doc(db, 'users', authUser.uid);
        unsubscribeFirestore = onSnapshot(
          userRef,
          (snapshot) => {
            if(safetyTimer) clearTimeout(safetyTimer);
            if (snapshot.exists()) {
              const data = snapshot.data() as AppUser;
              setAppUser({ ...data, uid: authUser.uid, isKycVerified: data.kycStatus === 'Verified' });
            } else {
              // This case is less likely now, but as a safeguard:
              setAppUser(null);
            }
            setLoading(false);
          },
          (error) => {
            if(safetyTimer) clearTimeout(safetyTimer);
            console.error('Firestore onSnapshot error:', error);
            setAppUser(null);
            setLoading(false);
          }
        );

      } else {
        setAppUser(null);
        setLoading(false);
      }
    });
  
    return () => {
      unsubscribeAuth();
      if (unsubscribeFirestore) unsubscribeFirestore();
      if (safetyTimer) clearTimeout(safetyTimer);
    };
  }, []);
  
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
    await updateProfile(newUser, { displayName: name });
    
    // The onAuthStateChanged listener will handle document creation via ensureUserDocument.
    // However, we can call the Cloud Function for referral logic.
    try {
        const functions = getFunctions();
        const onUserCreate = httpsCallable(functions, 'onUserCreate');
        // We pass all data needed by the cloud function
        await onUserCreate({ name, phone, referralCode });
    } catch (e) {
        console.warn('onUserCreate callable failed, client-side fallback will handle doc creation.', e);
        // If the callable fails, ensureUserDocument in onAuthStateChanged will create the doc.
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
