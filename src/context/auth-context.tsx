
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
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


const AuthContext = createContext<AuthContextType | undefined>(undefined);


// This is a dedicated function to create the user document, ensuring separation of concerns.
const createFirestoreUserDocument = async (user: User, additionalData: Partial<AppUser> = {}, referralCode?: string) => {
    const userRef = doc(db, 'users', user.uid);
    const { displayName, email, photoURL } = user;

    const newAppUser: AppUser = {
      uid: user.uid,
      email: email,
      displayName: displayName,
      photoURL: photoURL || defaultAvatar,
      wallet: { balance: 10, winnings: 0 },
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

    try {
        await runTransaction(db, async (transaction) => {
            // Check if referral code is valid and apply bonus
            if (referralCode && referralCode.startsWith('SZLUDO')) {
                const referrerId = referralCode.replace('SZLUDO', '');
                if (referrerId && referrerId !== user.uid) {
                    newAppUser.referralStats = { ...newAppUser.referralStats, referredBy: referrerId };
                    const referrerRef = doc(db, 'users', referrerId);
                    transaction.update(referrerRef, { 'referralStats.referredCount': increment(1) });
                }
            }
            
            // Set the new user document
            transaction.set(userRef, newAppUser);

            // Log the sign-up bonus transaction
            const transLogRef = doc(collection(db, 'transactions'));
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
        
    } catch (error) {
        console.error("Error creating user document or transaction: ", error);
        throw error;
    }
};

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
      setUser(authUser);
      if (authUser) {
        const userRef = doc(db, 'users', authUser.uid);
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

  useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
          if (user) {
              const userRef = doc(db, 'users', user.uid);
              const docSnap = await getDoc(userRef);
              if (!docSnap.exists()) {
                  try {
                      await createFirestoreUserDocument(user, { phone: user.phoneNumber || undefined });
                  } catch (error) {
                      console.error("Failed to create Firestore user doc for new user:", error);
                  }
              }
          }
      });
      return () => unsubscribe();
  }, []);

  
  const signUp = async (email: string, password: string, name: string, phone: string, referralCode?: string) => {
    const methods = await fetchSignInMethodsForEmail(auth, email);
    if (methods.length > 0) throw new Error('This email address is already in use.');
      
    const usersRef = collection(db, "users");
    const phoneQuery = query(usersRef, where("phone", "==", phone), limit(1));
    const phoneQuerySnapshot = await getDocs(phoneQuery);
    if (!phoneQuerySnapshot.empty) throw new Error("This phone number is already registered.");
      
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const newUser = userCredential.user;

    await updateProfile(newUser, { displayName: name, photoURL: defaultAvatar });
    
    await createFirestoreUserDocument(newUser, { phone }, referralCode);

    return userCredential;
  };

  const signIn = (email:string, password:string) => {
      return signInWithEmailAndPassword(auth, email, password);
  }

  const signInWithGoogle = async (referralCode?: string) => {
    const result = await signInWithPopup(auth, googleAuthProvider);
    const newUser = result.user;
    
    const userRef = doc(db, 'users', newUser.uid);
    const docSnap = await getDoc(userRef);
    if (!docSnap.exists()) {
        await createFirestoreUserDocument(newUser, {}, referralCode);
    }
    
    return result;
  }

  const logout = async () => {
    setUser(null);
    setAppUser(null);
    await signOut(auth);
  };
  
  if (loading && !user) {
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
      logout
  };

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
