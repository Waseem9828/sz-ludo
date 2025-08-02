import { doc, getDoc, updateDoc, increment, collection, onSnapshot, writeBatch } from 'firebase/firestore';
import { db } from './config';
import { createTransaction } from './transactions';

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
    if (!uid) return null;
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { uid: docSnap.id, ...docSnap.data() } as AppUser;
    }
    return null;
}


export const updateUserWallet = async (uid: string, amount: number, type: 'balance' | 'winnings', notes?: string) => {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) throw new Error("User not found");
    const userData = userSnap.data() as AppUser;

    const fieldToUpdate = type === 'balance' ? 'wallet.balance' : 'wallet.winnings';
    
    const batch = writeBatch(db);

    batch.update(userRef, {
        [fieldToUpdate]: increment(amount)
    });

    // Create a transaction log
    let transactionType;
    if (amount > 0) {
        transactionType = type === 'balance' ? 'deposit_manual' : 'winnings';
    } else {
        transactionType = type === 'balance' ? 'game_fee' : 'withdrawal_manual';
    }
    
     await createTransaction({
        userId: uid,
        userName: userData.displayName || 'N/A',
        amount: Math.abs(amount),
        type: transactionType,
        status: 'completed',
        notes: notes || (amount > 0 ? 'Admin Credit' : 'Admin Debit'),
    });

    return batch.commit();
}

export const updateUserKycStatus = async (uid: string, status: AppUser['kycStatus']) => {
    const userRef = doc(db, 'users', uid);
    return await updateDoc(userRef, { kycStatus: status });
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
