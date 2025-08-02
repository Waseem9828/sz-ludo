
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, updateProfile } from 'firebase/auth';
import { auth, db, googleAuthProvider } from '@/lib/firebase/config';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { SplashScreen } from '@/components/ui/splash-screen';

interface AppUser {
    uid: string;
    email: string | null;
    displayName: string | null;
    phone?: string;
    wallet?: {
        balance: number;
        winnings: number;
    }
}

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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
              setAppUser(userSnap.data() as AppUser);
          } else {
              const newAppUser: AppUser = {
                  uid: user.uid,
                  email: user.email,
                  displayName: user.displayName,
              };
              await setDoc(userRef, newAppUser);
              setAppUser(newAppUser);
          }
      } else {
          setAppUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
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
          wallet: {
              balance: 0,
              winnings: 0,
          }
      };
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
        wallet: { balance: 0, winnings: 0 },
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
