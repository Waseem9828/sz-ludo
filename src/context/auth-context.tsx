
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
import { doc, onSnapshot, getDoc, setDoc, serverTimestamp, runTransaction } from 'firebase/firestore';
import { SplashScreen } from '@/components/ui/splash-screen';
import type { AppUser } from '@/lib/firebase/users';
import { googleAuthProvider } from '@/lib/firebase/config';
import { getFunctions, httpsCallable } from 'firebase/functions';

const defaultAvatar = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi_h6LUuqTTKYsn5TfUZwkI6Aib6Y0tOzQzcoZKstURqxyl-PJXW1DKTkF2cPPNNUbP3iuDNsOBVOYx7p-ZwrodI5w9fyqEwoabj8rU0mLzSbT5GCFUKpfCc4s_LrtHcWFDvvRstCghAfQi5Zfv2fipdZG8h4dU4vGt-eFRn-gS3QTg6_JJKhv0Yysr_ZY/s1600/82126.png";


// This is a client-side fallback, NOT the primary method.
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

  await runTransaction(db, async (transaction) => {
    transaction.set(userRef, newAppUser);
    const transLogRef = doc(db, 'transactions', user.uid + '_signup');
    transaction.set(transLogRef, {
      userId: user.uid,
      userName: newAppUser.displayName || 'N/A',
      amount: 10,
      type: 'Sign Up',
      status: 'completed',
      notes: 'Welcome bonus',
      createdAt: serverTimestamp(),
    });
  });
};


const ensureUserDocument = async (u: User, referralCode?: string, additionalData: Partial<AppUser> = {}) => {
  const userRef = doc(db, 'users', u.uid);
  let snap = await getDoc(userRef);
  if (snap.exists()) return;

  try {
    const functions = getFunctions();
    const onUserCreate = httpsCallable(functions, 'onUserCreate');
    await onUserCreate({ name: u.displayName, phone: additionalData.phone, referralCode });
  } catch (e) {
    console.warn('onUserCreate callable failed (will fallback):', e);
  }

  await new Promise(r => setTimeout(r, 1500));
  snap = await getDoc(userRef);
  if (snap.exists()) return;

  try {
    await createFirestoreUserDocument(u, additionalData);
    console.log("Client-side fallback document created.");
  } catch (e) {
    console.error('Fallback client-side user doc create failed:', e);
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
        setLoading(true);
        const userRef = doc(db, 'users', authUser.uid);
        
        let safetyTimer = setTimeout(() => {
            console.warn("Auth context timed out. Stopping loader.");
            setLoading(false);
        }, 8000);

        unsubscribeFirestore = onSnapshot(
          userRef,
          (snapshot) => {
            clearTimeout(safetyTimer);
            if (snapshot.exists()) {
              const data = snapshot.data() as AppUser;
              setAppUser({ ...data, uid: authUser.uid, isKycVerified: data.kycStatus === 'Verified' });
              setLoading(false);
            } else {
              // Document doesn't exist. It might be a new user.
              // ensureUserDocument will be called from signUp/signInWithGoogle.
              // We keep listening, but we don't want to get stuck.
              // A new snapshot will arrive once the doc is created.
            }
          },
          (error) => {
            clearTimeout(safetyTimer);
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
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
      }
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
    
    await ensureUserDocument(userCredential.user, referralCode, { phone });
    
    return userCredential;
  };

  const signIn = (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const signInWithGoogle = async (referralCode?: string) => {
    const result = await signInWithPopup(auth, googleAuthProvider);
    await ensureUserDocument(result.user, referralCode);
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
