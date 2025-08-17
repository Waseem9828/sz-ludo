
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
import { doc, onSnapshot, getDoc, setDoc, serverTimestamp, collection, writeBatch } from 'firebase/firestore';
import { SplashScreen } from '@/components/ui/splash-screen';
import type { AppUser } from '@/lib/firebase/users';
import { getFunctions, httpsCallable } from 'firebase/functions';

const defaultAvatar = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi_h6LUuqTTKYsn5TfUZwkI6Aib6Y0tOzQzcoZKstURqxyl-PJXW1DKTkF2cPPNNUbP3iuDNsOBVOYx7p-ZwrodI5w9fyqEwoabj8rU0mLzSbT5GCFUKpfCc4s_LrtHcWFDvvRstCghAfQi5Zfv2fipdZG8h4dU4vGt-eFRn-gS3QTg6_JJKhv0Yysr_ZY/s1600/82126.png";

// This helper function creates the user document on the client-side as a fallback.
const createFirestoreUserDocument = async (user: User, additionalData: Partial<AppUser> = {}) => {
    const userRef = doc(db, 'users', user.uid);
    const { displayName, email, photoURL } = user;

    const newAppUser: Omit<AppUser, 'createdAt'> & { createdAt: any } = {
        uid: user.uid,
        email: email || "",
        displayName: additionalData.displayName || displayName || "New User",
        photoURL: photoURL || defaultAvatar,
        phone: additionalData.phone || "",
        wallet: { balance: 10, winnings: 0 },
        kycStatus: 'Pending',
        isKycVerified: false,
        status: 'active',
        gameStats: { played: 0, won: 0, lost: 0 },
        lifetimeStats: { totalDeposits: 0, totalWithdrawals: 0, totalWinnings: 0 },
        referralStats: { referredCount: 0, totalEarnings: 0 },
        ...(additionalData.role && {role: additionalData.role}),
        createdAt: serverTimestamp(),
    };
    
    if (email && (email.toLowerCase() === "admin@example.com" || email.toLowerCase() === "super@admin.com")) {
        (newAppUser as any).role = 'superadmin';
        (newAppUser as any).lifetimeStats.totalRevenue = 0;
    }
    
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
    
    await batch.commit();
};


// helper: tries callable then falls back to client-side create
const ensureUserDocument = async (u: User, additionalData: Partial<AppUser> = {}) => {
  const userRef = doc(db, 'users', u.uid);
  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) {
        console.log('User doc already exists for:', u.uid);
        return;
    }
  } catch (err) {
    console.warn('Error checking user doc (getDoc):', err);
  }

  // Try callable first (fastest when functions deployed)
  try {
    console.log('Attempting to create user doc via cloud function...');
    const functions = getFunctions();
    const onUserCreate = httpsCallable(functions, 'onUserCreate');
    await onUserCreate({ 
        name: additionalData.displayName || u.displayName || null, 
        phone: additionalData.phone || null, 
        referralCode: additionalData.referralCode || null 
    });
    // small wait for function to commit
    await new Promise(r => setTimeout(r, 800));
    console.log('Cloud function executed.');
  } catch (e) {
    console.warn('onUserCreate callable failed or not deployed; will fallback to client create:', e);
  }

  // Final fallback: create user doc on client (allowed by your rules)
  try {
    const snap2 = await getDoc(userRef);
    if (!snap2.exists()) {
      console.log('Fallback: creating user doc client-side for', u.uid);
      await createFirestoreUserDocument(u, additionalData);
      // Wait briefly for onSnapshot to pick it up
      await new Promise(r => setTimeout(r, 600));
      console.log('Fallback user doc created.');
    }
  } catch (e) {
    console.error('CRITICAL: Fallback user document creation failed:', e);
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
      if (safetyTimer) {
          clearTimeout(safetyTimer);
      }
  
      setUser(authUser);
  
      if (authUser) {
        setLoading(true);
        
        // Safety net to prevent infinite loading screen
        safetyTimer = setTimeout(() => {
            console.warn('Safety timer fired (8s)! Forcing loading state to false.');
            if (loading) { // Check if still loading before forcing
               setLoading(false);
            }
        }, 8000);
        
        // Try to ensure the document exists before setting up the listener.
        await ensureUserDocument(authUser, { displayName: authUser.displayName, phone: authUser.phoneNumber || '' });
  
        const userRef = doc(db, 'users', authUser.uid);
        unsubscribeFirestore = onSnapshot(userRef, (snapshot) => {
          if (safetyTimer) clearTimeout(safetyTimer);
          if (snapshot.exists()) {
            const data = snapshot.data() as AppUser;
            setAppUser({ ...data, uid: authUser.uid, isKycVerified: data.kycStatus === 'Verified' });
          } else {
             // This case should be rare now because of ensureUserDocument,
             // but as a safeguard, we set appUser to null.
            setAppUser(null);
          }
          setLoading(false); // SUCCESS: Both auth user and app user are loaded/handled.
        }, (error) => {
          console.error('onSnapshot error (userRef):', error);
          if(safetyTimer) clearTimeout(safetyTimer);
          setAppUser(null);
          setLoading(false);
        });
  
      } else {
        setAppUser(null);
        setLoading(false);
      }
    });
  
    return () => {
      unsubscribeAuth();
      if (unsubscribeFirestore) unsubscribeFirestore();
      if(safetyTimer) clearTimeout(safetyTimer);
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
    
    // The ensureUserDocument logic in onAuthStateChanged will handle doc creation,
    // but calling here can speed it up on initial sign-up.
    await ensureUserDocument(newUser, { displayName: name, phone, referralCode });
    
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
