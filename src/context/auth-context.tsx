
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, updateProfile, fetchSignInMethodsForEmail } from 'firebase/auth';
import { auth, db, googleAuthProvider } from '@/lib/firebase/config';
import { doc, setDoc, getDoc, onSnapshot, updateDoc, increment, collection, query, where, getDocs, limit, runTransaction } from 'firebase/firestore';
import { SplashScreen } from '@/components/ui/splash-screen';
import type { AppUser } from '@/lib/firebase/users';

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
    const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
      setUser(authUser);
      if (authUser) {
        const userRef = doc(db, 'users', authUser.uid);
        const unsubscribeFirestore = onSnapshot(userRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data() as AppUser;
                if (data.email === 'admin@example.com' && !data.role) {
                    data.role = 'superadmin';
                }
                setAppUser({ ...data, isKycVerified: data.kycStatus === 'Verified' });
            }
            setLoading(false); // Set loading to false once we have user data or know it doesn't exist
        }, (error) => {
            console.error("Firestore onSnapshot error:", error);
            setLoading(false);
        });
        return () => unsubscribeFirestore();
      } else {
        setAppUser(null);
        setLoading(false); // Set loading to false if there's no user
      }
    });

    return () => unsubscribeAuth();
  }, []);
  
  const signUp = async (email:string, password:string, name:string, phone:string, referralCode?: string) => {
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
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;
      await updateProfile(newUser, { displayName: name, photoURL: defaultAvatar });
      
      return await runTransaction(db, async (transaction) => {
        const userRef = doc(db, "users", newUser.uid);
        const newAppUser: AppUser = {
            uid: newUser.uid,
            email: newUser.email,
            displayName: name,
            phone: phone,
            photoURL: defaultAvatar,
            wallet: {
                balance: 0,
                winnings: 0,
            },
            kycStatus: 'Pending',
            status: 'active',
            gameStats: { played: 0, won: 0, lost: 0 },
            lifetimeStats: { totalDeposits: 0, totalWithdrawals: 0, totalWinnings: 0 },
            referralStats: { referredCount: 0, totalEarnings: 0 },
        };
        
        if (referralCode && referralCode.startsWith('SZLUDO')) {
            const referrerUid = referralCode.replace('SZLUDO', '');
            if (referrerUid) {
                 const referrerRef = doc(db, 'users', referrerUid);
                 const referrerSnap = await transaction.get(referrerRef);
                 if (referrerSnap.exists()) {
                     newAppUser.referralStats.referredBy = referrerUid;
                     transaction.update(referrerRef, {
                         'referralStats.referredCount': increment(1),
                     });
                 }
            }
        }

        if (email === 'admin@example.com') {
            newAppUser.role = 'superadmin';
            newAppUser.lifetimeStats.totalRevenue = 0;
        }
        
        transaction.set(userRef, newAppUser);
        setAppUser(newAppUser);
        setUser(newUser);
        return userCredential;
      });
  }

  const signIn = (email:string, password:string) => {
      return signInWithEmailAndPassword(auth, email, password);
  }

  const signInWithGoogle = async (referralCode?: string) => {
    return runTransaction(db, async (transaction) => {
        const result = await signInWithPopup(auth, googleAuthProvider);
        const newUser = result.user;
        const userRef = doc(db, 'users', newUser.uid);
        const userSnap = await transaction.get(userRef);

        if (!userSnap.exists()) {
            const newAppUser: AppUser = {
                uid: newUser.uid,
                email: newUser.email,
                displayName: newUser.displayName,
                photoURL: newUser.photoURL || defaultAvatar,
                wallet: { balance: 0, winnings: 0 },
                kycStatus: 'Pending',
                status: 'active',
                gameStats: { played: 0, won: 0, lost: 0 },
                lifetimeStats: { totalDeposits: 0, totalWithdrawals: 0, totalWinnings: 0 },
                referralStats: { referredCount: 0, totalEarnings: 0 },
            };

            if (referralCode && referralCode.startsWith('SZLUDO')) {
                const referrerUid = referralCode.replace('SZLUDO', '');
                 if (referrerUid) {
                    const referrerRef = doc(db, 'users', referrerUid);
                    const referrerSnap = await transaction.get(referrerRef);
                    if (referrerSnap.exists()) {
                        newAppUser.referralStats.referredBy = referrerUid;
                        transaction.update(referrerRef, {
                            'referralStats.referredCount': increment(1),
                        });
                    }
                }
            }
            transaction.set(userRef, newAppUser);
            setAppUser(newAppUser);
        }
        return result;
    });
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
