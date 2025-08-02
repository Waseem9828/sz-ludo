
'use server';
import { doc, getDoc, updateDoc, increment, collection, onSnapshot } from 'firebase/firestore';
import { db } from './config';

export interface AppUser {
    uid: string;
    email: string | null;
    displayName: string | null;
    phone?: string;
    photoURL?: string | null;
    wallet?: {
        balance: number;
        winnings: number;
    },
    kycStatus?: 'Pending' | 'Verified' | 'Rejected';
    upiId?: string; // For withdrawals
    gameStats?: {
        played: number;
        won: number;
        lost: number;
    },
    lifetimeStats?: {
        totalDeposits: number;
        totalWithdrawals: number;
    }
}


export const getUser = async (uid: string): Promise<AppUser | null> => {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data() as AppUser;
    }
    return null;
}


export const updateUserWallet = async (uid: string, amount: number, type: 'balance' | 'winnings') => {
    const userRef = doc(db, 'users', uid);
    const fieldToUpdate = type === 'balance' ? 'wallet.balance' : 'wallet.winnings';
    
    return await updateDoc(userRef, {
        [fieldToUpdate]: increment(amount)
    });
}

export const listenForAllUsers = (
    callback: (users: AppUser[]) => void,
    onError?: (error: Error) => void
) => {
    const q = collection(db, 'users');

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const users: AppUser[] = [];
        querySnapshot.forEach((doc) => {
            users.push({ uid: doc.id, ...doc.data() } as AppUser);
        });
        callback(users);
    }, (error) => {
        console.error("Error listening for users: ", error);
        if (onError) {
            onError(error);
        }
    });

    return unsubscribe;
}
