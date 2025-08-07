
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, updateProfile, fetchSignInMethodsForEmail } from 'firebase/auth';
import { auth, db, googleAuthProvider } from '@/lib/firebase/config';
import { doc, setDoc, getDoc, onSnapshot, updateDoc, increment, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { SplashScreen } from '@/components/ui/splash-screen';
import type { AppUser } from '@/lib/firebase/users';

interface AuthContextType {
  user: User | null;
  appUser: AppUser | null;
  loading: boolean;
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
  signUp: async () => {},
  signIn: async () => {},
  signInWithGoogle: async () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const unsubscribeFirestore = onSnapshot(userRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data() as AppUser;
                // Special case for admin to assign role on creation
                if (data.email === 'admin@example.com' && !data.role) {
                    data.role = 'superadmin';
                }
                setAppUser({ ...data, isKycVerified: data.kycStatus === 'Verified' });
            }
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
  
  const signUp = async (email:string, password:string, name:string, phone:string, referralCode?: string) => {
      // Check if email is already in use by Firebase Auth
      const methods = await fetchSignInMethodsForEmail(auth, email);
      if (methods.length > 0) {
        throw new Error('This email address is already in use.');
      }
      
      // Check if phone number is already in use in Firestore
      const usersRef = collection(db, "users");
      const phoneQuery = query(usersRef, where("phone", "==", phone), limit(1));
      const phoneQuerySnapshot = await getDocs(phoneQuery);

      if (!phoneQuerySnapshot.empty) {
        throw new Error("This phone number is already registered.");
      }
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await updateProfile(user, { displayName: name, photoURL: defaultAvatar });
      
      const userRef = doc(db, "users", user.uid);
      const newAppUser: AppUser = {
          uid: user.uid,
          email: user.email,
          displayName: name,
          phone: phone,
          photoURL: defaultAvatar,
          wallet: {
              balance: 0,
              winnings: 0,
          },
          kycStatus: 'Pending',
          gameStats: { played: 0, won: 0, lost: 0 },
          lifetimeStats: { totalDeposits: 0, totalWithdrawals: 0, totalWinnings: 0 },
          referralStats: { referredCount: 0, totalEarnings: 0 },
      };
      
      // Handle referral
      if (referralCode && referralCode.startsWith('SZLUDO')) {
          const referrerUid = referralCode.replace('SZLUDO', '');
          const referrerRef = doc(db, 'users', referrerUid);
          const referrerSnap = await getDoc(referrerRef);
          if (referrerSnap.exists()) {
              newAppUser.referralStats.referredBy = referrerUid;
              await updateDoc(referrerRef, {
                  'referralStats.referredCount': increment(1)
              });
          }
      }

      // Assign role if it's the admin user
      if (email === 'admin@example.com') {
          newAppUser.role = 'superadmin';
          newAppUser.lifetimeStats.totalRevenue = 0;
      }
      
      await setDoc(userRef, newAppUser);
      setAppUser(newAppUser);
      setUser(user);
      return userCredential;
  }

  const signIn = (email:string, password:string) => {
      return signInWithEmailAndPassword(auth, email, password);
  }

  const signInWithGoogle = async (referralCode?: string) => {
    const result = await signInWithPopup(auth, googleAuthProvider);
    const user = result.user;
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      const newAppUser: AppUser = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL || defaultAvatar,
        wallet: { balance: 0, winnings: 0 },
        kycStatus: 'Pending',
        gameStats: { played: 0, won: 0, lost: 0 },
        lifetimeStats: { totalDeposits: 0, totalWithdrawals: 0, totalWinnings: 0 },
        referralStats: { referredCount: 0, totalEarnings: 0 },
      };
       // Handle referral
      if (referralCode && referralCode.startsWith('SZLUDO')) {
          const referrerUid = referralCode.replace('SZLUDO', '');
          const referrerRef = doc(db, 'users', referrerUid);
          const referrerSnap = await getDoc(referrerRef);
          if (referrerSnap.exists()) {
              newAppUser.referralStats.referredBy = referrerUid;
              await updateDoc(referrerRef, {
                  'referralStats.referredCount': increment(1)
              });
          }
      }
      await setDoc(userRef, newAppUser);
      setAppUser(newAppUser);
    }
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
    <AuthContext.Provider value={{ user, appUser, loading, signUp, signIn, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
