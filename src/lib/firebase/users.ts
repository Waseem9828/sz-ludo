
import { doc, getDoc, updateDoc, increment, collection, onSnapshot, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from './config';
import { TransactionType } from './transactions';

export interface AppUser {
    uid: string;
    email: string | null;
    displayName: string | null;
    phone?: string;
    photoURL?: string | null;
    status?: 'active' | 'suspended';
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


export const updateUserWallet = async (uid: string, amount: number, type: 'balance' | 'winnings', transactionType: TransactionType, notes?: string, relatedId?: string) => {
    const userRef = doc(db, 'users', uid);
    
    return db.runTransaction(async (transaction) => {
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) {
            throw new Error("User not found");
        }
        const userData = userSnap.data() as AppUser;

        // Determine the wallet field to update
        const fieldToUpdate = type === 'balance' ? 'wallet.balance' : 'wallet.winnings';
        const currentBalance = userData.wallet ? userData.wallet[type] : 0;

        // Check for sufficient funds if amount is negative
        if (amount < 0 && currentBalance < Math.abs(amount)) {
            throw new Error(`Insufficient ${type} balance.`);
        }
        
        // --- Start Batch Operations ---
        transaction.update(userRef, {
            [fieldToUpdate]: increment(amount)
        });

        // Update lifetime stats for deposits or approved withdrawals
        if (transactionType === 'deposit') {
            transaction.update(userRef, { 'lifetimeStats.totalDeposits': increment(amount) });
        } else if (transactionType === 'withdrawal' && notes === 'Withdrawal Approved') {
            transaction.update(userRef, { 'lifetimeStats.totalWithdrawals': increment(amount) });
        }

        // Create a transaction log
        const transactionRef = doc(collection(db, 'transactions'));
        transaction.set(transactionRef, {
            userId: uid,
            userName: userData.displayName || 'N/A',
            amount: Math.abs(amount),
            type: transactionType,
            status: 'completed', // Default to completed for direct updates
            notes: notes,
            relatedId: relatedId || null,
            createdAt: serverTimestamp(),
        });
    });
}

export const updateUserKycStatus = async (uid: string, status: AppUser['kycStatus']) => {
    const userRef = doc(db, 'users', uid);
    return await updateDoc(userRef, { kycStatus: status });
}

export const updateUserStatus = async (uid: string, status: AppUser['status']) => {
    const userRef = doc(db, 'users', uid);
    return await updateDoc(userRef, { status: status });
};


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
