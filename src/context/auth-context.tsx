
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, updateProfile, fetchSignInMethodsForEmail, UserCredential } from 'firebase/auth';
import { auth, db, googleAuthProvider } from '@/lib/firebase/config';
import { doc, setDoc, getDoc, updateDoc, increment, collection, query, where, getDocs, limit, runTransaction, Timestamp, serverTimestamp, onSnapshot, DocumentReference, Transaction as FirestoreTransaction } from 'firebase/firestore';
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


// This function is now the single source of truth for creating a new user document in Firestore.
// It's called ONLY when a user is fully authenticated but their document doesn't exist.
const createFirestoreUserDocument = async (user: User, additionalData: Partial<AppUser> = {}, referralCode?: string) => {
  const userRef = doc(db, 'users', user.uid);
  
  return runTransaction(db, async (transaction) => {
    const userSnap = await transaction.get(userRef);
    // Double-check if the document was created in another process, to prevent overwriting.
    if (userSnap.exists()) {
        console.log("User document already exists, skipping creation.");
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
    
    // Assign superadmin role if email matches
    if ((email?.toLowerCase() === 'admin@example.com' || email?.toLowerCase() === 'super@admin.com')) { 
        newAppUser.role = 'superadmin';
        newAppUser.lifetimeStats.totalRevenue = 0;
    }

    // Handle Referral logic
    if (referralCode && referralCode.startsWith('SZLUDO')) {
        const referrerId = referralCode.replace('SZLUDO', '');
        if (referrerId && referrerId !== user.uid) {
           newAppUser.referralStats = { ...newAppUser.referralStats, referredBy: referrerId };
           const referrerRef = doc(db, 'users', referrerId);
           transaction.update(referrerRef, { 'referralStats.referredCount': increment(1) });
        }
    }
    
    // Create the user document
    transaction.set(userRef, newAppUser);
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
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setInstallable(false);
  };
  
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (authUser) => {
      setUser(authUser);
      if (authUser) {
        // First, check if the Firestore document exists.
        const userRef = doc(db, 'users', authUser.uid);
        const docSnap = await getDoc(userRef);

        if (!docSnap.exists()) {
           // This is a new user or a user whose document was never created.
           // Create it now that we are sure they are authenticated.
           // We pass an empty object for additionalData as it's handled in signUp/signInWithGoogle.
           console.log(`User document for ${authUser.uid} not found. Creating...`);
           try {
             await createFirestoreUserDocument(authUser, { phone: authUser.phoneNumber || '' });
           } catch (error) {
             console.error("Error creating Firestore document on-the-fly:", error);
           }
        }
        
        // Now, set up the real-time listener for the appUser state.
        const unsubscribeFirestore = onSnapshot(userRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data() as AppUser;
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
    if (methods.length > 0) throw new Error('This email address is already in use.');
      
    const usersRef = collection(db, "users");
    const phoneQuery = query(usersRef, where("phone", "==", phone), limit(1));
    const phoneQuerySnapshot = await getDocs(phoneQuery);
    if (!phoneQuerySnapshot.empty) throw new Error("This phone number is already registered.");
      
    // Step 1: Only create the user in Auth and update their Auth profile.
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const newUser = userCredential.user;
    await updateProfile(newUser, { displayName: name, photoURL: defaultAvatar });
    
    // Step 2: Create the Firestore document in a separate, secure transaction.
    // This will be handled by the onAuthStateChanged listener, but we can also trigger it here.
    await createFirestoreUserDocument(newUser, { phone }, referralCode);

    return userCredential;
  };

  const signIn = (email:string, password:string) => {
      return signInWithEmailAndPassword(auth, email, password);
  }

 const signInWithGoogle = async (referralCode?: string) => {
    const result = await signInWithPopup(auth, googleAuthProvider);
    const newUser = result.user;
    
    // The onAuthStateChanged listener will handle document creation if it doesn't exist.
    // This makes the logic consistent and reliable.
    // We can just return the result here.
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
