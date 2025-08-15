
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, updateProfile, fetchSignInMethodsForEmail } from 'firebase/auth';
import { auth, db, googleAuthProvider } from '@/lib/firebase/config';
import { doc, setDoc, getDoc, updateDoc, increment, collection, query, where, getDocs, limit, runTransaction, Timestamp, serverTimestamp } from 'firebase/firestore';
import { SplashScreen } from '@/components/ui/splash-screen';
import type { AppUser } from '@/lib/firebase/users';
import { createTransaction } from '@/lib/firebase/transactions';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed',
    platform: string,
  }>;
  prompt(): Promise<void>;
}

interface AuthContextType {
  user: User | null;
  appUser: AppUser | null;
  loading: boolean;
  installable: boolean;
  installPwa: () => void;
  signUp: (email:string, password:string, name:string, phone:string, referralCode?: string) => Promise<any>;
  signIn: (email:string, password:string) => Promise<any>;
  signInWithGoogle: (referralCode?: string) => Promise<any>;
  logout: () => Promise<void>;
}

const defaultAvatar = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi_h6LUuqTTKYsn5TfUZwkI6Aib6Y0tOzQzcoZKstURqxyl-PJXW1DKTkF2cPPNNUbP3iuDNsOBVOYx7p-ZwrodI5w9fyqEwoabj8rU0mLzSbT5GCFUKpfCc4s_LrtHcWFDvvRstCghAfQi5Zfv2fipdZG8h4dU4vGt-eFRn-gS3QTg6_JJKhv0Yysr_ZY/s1600/82126.png";

// This is a global variable to hold referral code temporarily during signup process.
let tempReferralCode: string | undefined = undefined;

const AuthContext = createContext<AuthContextType>({
  user: null,
  appUser: null,
  loading: true,
  installable: false,
  installPwa: () => {},
  signUp: async () => {},
  signIn: async () => {},
  signInWithGoogle: async () => {},
  logout: async () => {},
});

const createFirestoreUserDocument = async (user: User, additionalData: Partial<AppUser> = {}) => {
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    // If the document already exists, we don't need to do anything.
    return;
  }

  const { displayName, email, photoURL } = user;
  const newAppUser: AppUser = {
    uid: user.uid,
    email: email,
    displayName: displayName,
    photoURL: photoURL || defaultAvatar,
    wallet: { balance: 0, winnings: 0 },
    kycStatus: 'Pending',
    status: 'active',
    gameStats: { played: 0, won: 0, lost: 0 },
    lifetimeStats: { totalDeposits: 0, totalWithdrawals: 0, totalWinnings: 0 },
    referralStats: { referredCount: 0, totalEarnings: 0 },
    isKycVerified: false,
    ...additionalData,
  };
  
   if ((email?.toLowerCase() === 'admin@example.com' || email?.toLowerCase() === 'super@admin.com')) { 
      newAppUser.role = 'superadmin';
      newAppUser.lifetimeStats.totalRevenue = 0;
  }

  // Handle Referral logic
  const referralCode = tempReferralCode;
  if (referralCode && referralCode.startsWith('SZLUDO')) {
      const referrerUid = referralCode.replace('SZLUDO', '');
      if (referrerUid && referrerUid !== user.uid) {
         newAppUser.referralStats = { referredBy: referrerUid, referredCount: 0, totalEarnings: 0 };
         const referrerRef = doc(db, 'users', referrerUid);
         try {
           await runTransaction(db, async (transaction) => {
             const referrerSnap = await transaction.get(referrerRef);
             if (referrerSnap.exists()) {
               transaction.update(referrerRef, { 'referralStats.referredCount': increment(1) });
             }
           });
         } catch (e) {
           console.error("Referral count update transaction failed, user might not exist: ", e);
         }
      }
  }
  
  await setDoc(userRef, newAppUser);
  tempReferralCode = undefined; // Clear the temporary referral code
  
  await createTransaction({
      userId: user.uid,
      userName: newAppUser.displayName,
      amount: 0,
      type: 'Sign Up',
      status: 'completed',
      notes: 'User account created.',
      createdAt: serverTimestamp() as Timestamp
  });
};


export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
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

    return () => {
        window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const installPwa = async () => {
    if (!deferredPrompt) {
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the A2HS prompt');
    } else {
      console.log('User dismissed the A2HS prompt');
    }
    setInstallable(false);
    setDeferredPrompt(null);
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (authUser) => {
      setUser(authUser);
      if (authUser) {
        // Create Firestore document if it doesn't exist. This is the key fix.
        // This runs every time auth state changes, but `createFirestoreUserDocument` has a check to prevent overwriting.
        await createFirestoreUserDocument(authUser);

        const userRef = doc(db, 'users', authUser.uid);
        const unsubscribeFirestore = onSnapshot(userRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data() as AppUser;
                setAppUser({ ...data, isKycVerified: data.kycStatus === 'Verified' });
            }
            setLoading(false); 
        }, (error) => {
            console.error("Firestore onSnapshot error:", error);
            setLoading(false);
        });
        return () => unsubscribeFirestore();
      } else {
        setAppUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);
  
const signUp = async (email: string, password: string, name: string, phone: string, referralCode?: string) => {
    const methods = await fetchSignInMethodsForEmail(auth, email);
    if (methods.length > 0) {
      throw new Error('This email address is already in use.');
    }
    
    const usersRef = collection(db, "users");
    const phoneQuery = query(usersRef, where("phone", "==", phone), limit(1));
    const phoneQuerySnapshot = await getDocs(phoneQuery);
    if (!phoneQuerySnapshot.empty) {
      throw new Error("This phone number is already registered.");
    }

    // Set temporary referral code before creating user
    tempReferralCode = referralCode;
    
    // Step 1: Create user in Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const newUser = userCredential.user;

    // Step 2: Update Auth Profile (name, photo)
    await updateProfile(newUser, { displayName: name, photoURL: defaultAvatar });
    
    // The `onAuthStateChanged` listener will handle creating the Firestore document.

    return userCredential;
};


  const signIn = (email:string, password:string) => {
      return signInWithEmailAndPassword(auth, email, password);
  }

 const signInWithGoogle = async (referralCode?: string) => {
    // Set temporary referral code before sign-in
    tempReferralCode = referralCode;
    const result = await signInWithPopup(auth, googleAuthProvider);
    // The onAuthStateChanged listener will handle document creation
    return result;
  }


  const logout = async () => {
    setUser(null);
    setAppUser(null);
    await signOut(auth);
  };
  
  if (loading) {
    return <SplashScreen />;
  }

  return (
    <AuthContext.Provider value={{ user, appUser, loading, installable, installPwa, signUp, signIn, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
