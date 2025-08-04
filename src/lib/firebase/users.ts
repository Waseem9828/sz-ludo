
import { doc, getDoc, updateDoc, increment, collection, onSnapshot, writeBatch, serverTimestamp, runTransaction } from 'firebase/firestore';
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


export const updateUserWallet = async (uid: string, amount: number, walletType: 'balance' | 'winnings', transactionType: TransactionType, notes?: string, relatedId?: string) => {
    const userRef = doc(db, 'users', uid);
    
    return await runTransaction(db, async (transaction) => {
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) {
            throw new Error("User not found");
        }
        const userData = userSnap.data() as AppUser;

        const currentBalance = userData.wallet?.balance || 0;
        const currentWinnings = userData.wallet?.winnings || 0;

        // If deducting, check from which wallet to pull
        if (amount < 0) {
             const totalBalance = currentBalance + currentWinnings;
             const deductionAmount = Math.abs(amount);

             if (totalBalance < deductionAmount) {
                 throw new Error('Insufficient total balance.');
             }

             // Prioritize deducting from deposit balance first, then winnings
             let remainingDeduction = deductionAmount;
             
             const balanceDeduction = Math.min(remainingDeduction, currentBalance);
             if (balanceDeduction > 0) {
                transaction.update(userRef, { 'wallet.balance': increment(-balanceDeduction) });
                remainingDeduction -= balanceDeduction;
             }

             if (remainingDeduction > 0) {
                 const winningsDeduction = Math.min(remainingDeduction, currentWinnings);
                 if (winningsDeduction > 0) {
                    transaction.update(userRef, { 'wallet.winnings': increment(-winningsDeduction) });
                    remainingDeduction -= winningsDeduction;
                 }
             }
             
             if (remainingDeduction > 0) {
                 // This should not happen if total balance check is correct, but as a safeguard:
                 throw new Error("Balance deduction calculation error.");
             }

        } else {
            // If adding, add to the specified wallet type
            const fieldToUpdate = walletType === 'balance' ? 'wallet.balance' : 'wallet.winnings';
            transaction.update(userRef, { [fieldToUpdate]: increment(amount) });
        }
        
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
            notes: notes || null,
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
