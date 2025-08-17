
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
import { doc, onSnapshot, getDoc, setDoc, serverTimestamp, Timestamp, writeBatch } from 'firebase/firestore';
import { SplashScreen } from '@/components/ui/splash-screen';
import type { AppUser } from '@/lib/firebase/users';
import { getFunctions, httpsCallable } from 'firebase/functions';

const defaultAvatar = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi_h6LUuqTTKYsn5TfUZwkI6Aib6Y0tOzQzcoZKstURqxyl-PJXW1DKTkF2cPPNNUbP3iuDNsOBVOYx7p-ZwrodI5w9fyqEwoabj8rU0mLzSbT5GCFUKpfCc4s_LrtHcWFDvvRstCghAfQi5Zfv2fipdZG8h4dU4vGt-eFRn-gS3QTg6_JJKhv0Yysr_ZY/s1600/82126.png";

// This helper function creates the user document on the client-side.
const createFirestoreUserDocument = async (user: User, additionalData: Partial<AppUser> = {}) => {
    const userRef = doc(db, 'users', user.uid);
    const { displayName, email, photoURL } = user;

    const newAppUser: Omit<AppUser, 'createdAt'> = {
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
        ...(additionalData.role && {role: additionalData.role}),
    };
    
    if (email && (email.toLowerCase() === "admin@example.com" || email.toLowerCase() === "super@admin.com")) {
        (newAppUser as any).role = 'superadmin';
        (newAppUser as any).lifetimeStats.totalRevenue = 0;
    }
    
    const batch = writeBatch(db);
    
    // Set the new user document
    batch.set(userRef, {
        ...newAppUser,
        createdAt: serverTimestamp(),
    });
    
    // Log the sign-up bonus transaction
    const transLogRef = doc(db, 'transactions', `signup_${user.uid}`);
    batch.set(transLogRef, {
        userId: user.uid,
        userName: newAppUser.displayName,
        amount: 10,
        type: "Sign Up",
        status: "completed",
        notes: "Welcome bonus",
        createdAt: serverTimestamp(),
    });
    
    await batch.commit();
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

    const unsubscribeAuth = onAuthStateChanged(auth, async (authUser) => {
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
        unsubscribeFirestore = null;
      }
      
      setUser(authUser);

      if (authUser) {
        setLoading(true);
        const userRef = doc(db, 'users', authUser.uid);
        
        // This is the listener that will keep appUser in sync
        unsubscribeFirestore = onSnapshot(userRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data() as AppUser;
            setAppUser({ ...data, uid: authUser.uid, isKycVerified: data.kycStatus === 'Verified' });
          }
          // The loading state is managed below, not here, to prevent race conditions.
        });

        // This block ensures the document exists and handles the initial loading state.
        try {
            const docSnap = await getDoc(userRef);
            if (!docSnap.exists()) {
                console.log("User doc not found, attempting to create it now (client-side fallback).");
                await createFirestoreUserDocument(authUser);
            }
        } catch (error) {
            console.error("CRITICAL: Error ensuring user document exists:", error);
        } finally {
            // No matter what, stop loading. If doc doesn't exist, onSnapshot will eventually pick it up.
            setLoading(false);
        }
      } else {
        // User is signed out
        setAppUser(null);
        setLoading(false);
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
    const methods = await fetchSignInMethodsForEmail(auth, email);
    if (methods.length > 0) {
      throw new Error('This email address is already in use.');
    }
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const newUser = userCredential.user;
    await updateProfile(newUser, { displayName: name });
    
    try {
        const functions = getFunctions();
        const onUserCreate = httpsCallable(functions, 'onUserCreate');
        await onUserCreate({ name, phone, referralCode });
    } catch (e) {
        console.warn('onUserCreate callable failed, client-side creation will handle it.', e);
        // The onAuthStateChanged listener will now reliably create the document.
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
