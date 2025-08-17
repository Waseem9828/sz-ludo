
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
import { doc, onSnapshot, getDoc, setDoc, serverTimestamp, collection, writeBatch } from 'firebase/firestore';
import { SplashScreen } from '@/components/ui/splash-screen';
import type { AppUser } from '@/lib/firebase/users';
import { getFunctions, httpsCallable } from 'firebase/functions';

const defaultAvatar = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi_h6LUuqTTKYsn5TfUZwkI6Aib6Y0tOzQzcoZKstURqxyl-PJXW1DKTkF2cPPNNUbP3iuDNsOBVOYx7p-ZwrodI5w9fyqEwoabj8rU0mLzSbT5GCFUKpfCc4s_LrtHcWFDvvRstCghAfQi5Zfv2fipdZG8h4dU4vGt-eFRn-gS3QTg6_JJKhv0Yysr_ZY/s1600/82126.png";

// This helper function creates the user document on the client-side as a fallback.
const createFirestoreUserDocument = async (user: User, additionalData: Partial<AppUser> = {}) => {
    const userRef = doc(db, 'users', user.uid);
    const { displayName, email, photoURL } = user;

    const newAppUser: Omit<AppUser, 'createdAt' | 'uid'> & { createdAt: any } = {
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
    batch.set(userRef, newAppUser);
    
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

  try {
    console.log('Attempting to create user doc via cloud function...');
    const functions = getFunctions();
    const onUserCreate = httpsCallable(functions, 'onUserCreate');
    await onUserCreate({ 
        name: additionalData.displayName || u.displayName || null, 
        phone: additionalData.phone || null, 
        referralCode: additionalData.referralCode || null 
    });
    console.log('Cloud function executed successfully.');
    await new Promise(r => setTimeout(r, 800));
  } catch (e) {
    console.warn('onUserCreate callable failed; will fallback to client create:', e);
    try {
        const snap2 = await getDoc(userRef);
        if (!snap2.exists()) {
            console.log('Fallback: creating user doc client-side for', u.uid);
            await createFirestoreUserDocument(u, additionalData);
            console.log('Fallback user doc created.');
            await new Promise(r => setTimeout(r, 600));
        }
    } catch (e) {
        console.error('CRITICAL: Fallback user document creation failed:', e);
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

    const unsubscribeAuth = onAuthStateChanged(auth, async (authUser) => {
        if (unsubscribeFirestore) {
            unsubscribeFirestore();
            unsubscribeFirestore = null;
        }

        setUser(authUser);

        if (!authUser) {
            console.log('Auth state changed: No user.');
            setAppUser(null);
            setLoading(false);
            return;
        }
        
        console.log('Auth state changed: User is present.', authUser.uid);
        setLoading(true);

        // Safety net to prevent infinite loading screen
        safetyTimer = setTimeout(() => {
            console.warn('Safety timer fired (8s)! Forcing loading state to false.');
            if (loading) setLoading(false);
        }, 8000);

        const userRef = doc(db, 'users', authUser.uid);
        
        // Ensure the user document exists before we listen to it.
        // This is the critical fix for new user sign-ups.
        const docSnap = await getDoc(userRef);
        if (!docSnap.exists()) {
            console.log('User document NOT found. Attempting to create it now.');
            await ensureUserDocument(authUser, { 
                displayName: authUser.displayName || undefined, 
                phone: authUser.phoneNumber || undefined 
            });
        }
        
        unsubscribeFirestore = onSnapshot(userRef, (snapshot) => {
            clearTimeout(safetyTimer!); // Clear the safety timer if snapshot is successful
            if (snapshot.exists()) {
                const data = snapshot.data() as AppUser;
                setAppUser({ ...data, uid: authUser.uid, isKycVerified: data.kycStatus === 'Verified' });
                console.log('AppUser state updated. Loading complete.');
            } else {
                setAppUser(null); // Should not happen after ensureUserDocument, but good for safety
                console.warn('User doc disappeared after initial check.');
            }
            setLoading(false);
        }, (error) => {
            console.error('onSnapshot error (userRef):', error);
            clearTimeout(safetyTimer!);
            setAppUser(null);
            setLoading(false);
        });
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
    
    // The onAuthStateChanged listener will now reliably handle the document creation.
    // Forcing it here again can speed things up on first sign-up.
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
