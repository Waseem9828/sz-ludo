
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
import { doc, onSnapshot, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { SplashScreen } from '@/components/ui/splash-screen';
import type { AppUser } from '@/lib/firebase/users';
import { getFunctions, httpsCallable } from 'firebase/functions';

const defaultAvatar = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi_h6LUuqTTKYsn5TfUZwkI6Aib6Y0tOzQzcoZKstURqxyl-PJXW1DKTkF2cPPNNUbP3iuDNsOBVOYx7p-ZwrodI5w9fyqEwoabj8rU0mLzSbT5GCFUKpfCc4s_LrtHcWFDvvRstCghAfQi5Zfv2fipdZG8h4dU4vGt-eFRn-gS3QTg6_JJKhv0Yysr_ZY/s1600/82126.png";


// This is the client-side fallback, designed to be robust.
const createFirestoreUserDocument = async (user: User, additionalData: Partial<AppUser> = {}) => {
  const userRef = doc(db, 'users', user.uid);
  const { displayName, email, photoURL } = user;

  const newAppUser: AppUser = {
    uid: user.uid,
    email,
    displayName,
    photoURL: photoURL || defaultAvatar,
    wallet: { balance: 10, winnings: 0 },
    kycStatus: 'Pending',
    status: 'active',
    gameStats: { played: 0, won: 0, lost: 0 },
    lifetimeStats: { totalDeposits: 0, totalWithdrawals: 0, totalWinnings: 0 },
    referralStats: { referredCount: 0, totalEarnings: 0 },
    isKycVerified: false,
    ...additionalData,
    createdAt: serverTimestamp(),
  };

  if ((email?.toLowerCase() === 'admin@example.com' || email?.toLowerCase() === 'super@admin.com')) {
    (newAppUser as any).role = 'superadmin';
    (newAppUser as any).lifetimeStats.totalRevenue = 0;
  }
  
  // Directly set the document, rules allow this for the authenticated user.
  await setDoc(userRef, newAppUser);
  
  // Create the transaction log for the signup bonus.
  const transLogRef = doc(collection(db, 'transactions'));
  await setDoc(transLogRef, {
      userId: user.uid,
      userName: newAppUser.displayName || 'N/A',
      amount: 10,
      type: 'Sign Up',
      status: 'completed',
      notes: 'Welcome bonus',
      createdAt: serverTimestamp(),
  });
};


const ensureUserDocument = async (u: User, referralCode?: string, additionalData: Partial<AppUser> = {}) => {
  const userRef = doc(db, 'users', u.uid);
  let snap = await getDoc(userRef);
  if (snap.exists()) {
    console.log("User doc already exists for:", u.uid);
    return;
  }

  console.log("Ensuring user doc for", u.uid);
  try {
    const functions = getFunctions();
    const onUserCreate = httpsCallable(functions, 'onUserCreate');
    await onUserCreate({ name: u.displayName, phone: additionalData.phone, referralCode });
    console.log("Callable onUserCreate succeeded.");
  } catch (e) {
    console.warn('onUserCreate callable failed, proceeding to client-side fallback:', e);
    // If callable fails, immediately try client-side creation.
    try {
        await createFirestoreUserDocument(u, additionalData);
        console.log("Fallback: user doc created successfully on client.");
    } catch (createError) {
        console.error("CRITICAL: Fallback user document creation failed:", createError);
    }
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

    const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
      // Clean up previous listeners
      if (unsubscribeFirestore) unsubscribeFirestore();
      if (safetyTimer) clearTimeout(safetyTimer);
      
      setUser(authUser);
  
      if (authUser) {
        // Start loading and set a safety timer to prevent infinite loading
        setLoading(true);
        safetyTimer = setTimeout(() => {
            console.warn("Safety timer fired! Forcing loading state to false.");
            setLoading(false);
        }, 8000);

        const userRef = doc(db, 'users', authUser.uid);
        
        unsubscribeFirestore = onSnapshot(
          userRef,
          (snapshot) => {
            if (snapshot.exists()) {
              if (safetyTimer) clearTimeout(safetyTimer);
              const data = snapshot.data() as AppUser;
              setAppUser({ ...data, uid: authUser.uid, isKycVerified: data.kycStatus === 'Verified' });
              console.log("User snapshot received, setting loading to false.");
              setLoading(false);
            } else {
              // Document doesn't exist, try to create it.
              // The snapshot listener will pick up the new doc once created.
              console.log("User doc not found, attempting to ensure it exists.");
              ensureUserDocument(authUser, undefined, { phone: authUser.phoneNumber || undefined });
            }
          },
          (error) => {
            if (safetyTimer) clearTimeout(safetyTimer);
            console.error('Firestore onSnapshot error:', error);
            setAppUser(null);
            setLoading(false);
          }
        );
      } else {
        // User is signed out
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
    await updateProfile(userCredential.user, { displayName: name });
    
    // Let onAuthStateChanged handle the doc creation via ensureUserDocument
    // This simplifies the logic and avoids race conditions.
    
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
