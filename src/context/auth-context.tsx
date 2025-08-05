
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, updateProfile } from 'firebase/auth';
import { auth, db, googleAuthProvider } from '@/lib/firebase/config';
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { SplashScreen } from '@/components/ui/splash-screen';
import type { AppUser } from '@/lib/firebase/users';

interface AuthContextType {
  user: User | null;
  appUser: AppUser | null;
  loading: boolean;
  signUp: (email:string, password:string, name:string, phone:string) => Promise<any>;
  signIn: (email:string, password:string) => Promise<any>;
  signInWithGoogle: () => Promise<any>;
  logout: () => Promise<void>;
}

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
                setAppUser(data);
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
  
  const signUp = async (email:string, password:string, name:string, phone:string) => {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await updateProfile(user, { displayName: name });
      
      const userRef = doc(db, "users", user.uid);
      const newAppUser: AppUser = {
          uid: user.uid,
          email: user.email,
          displayName: name,
          phone: phone,
          photoURL: user.photoURL,
          wallet: {
              balance: 0,
              winnings: 0,
          },
          kycStatus: 'Pending',
          gameStats: { played: 0, won: 0, lost: 0 },
          lifetimeStats: { totalDeposits: 0, totalWithdrawals: 0, totalWinnings: 0 },
          referralStats: { referredCount: 0, totalEarnings: 0 },
      };
      // Assign role if it's the admin user
      if (email === 'admin@example.com') {
          newAppUser.role = 'superadmin';
      }
      
      await setDoc(userRef, newAppUser);
      setAppUser(newAppUser);
      setUser(user);
      return userCredential;
  }

  const signIn = (email:string, password:string) => {
      return signInWithEmailAndPassword(auth, email, password);
  }

  const signInWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleAuthProvider);
    const user = result.user;
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      const newAppUser: AppUser = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        wallet: { balance: 0, winnings: 0 },
        kycStatus: 'Pending',
        gameStats: { played: 0, won: 0, lost: 0 },
        lifetimeStats: { totalDeposits: 0, totalWithdrawals: 0, totalWinnings: 0 },
        referralStats: { referredCount: 0, totalEarnings: 0 },
      };
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
