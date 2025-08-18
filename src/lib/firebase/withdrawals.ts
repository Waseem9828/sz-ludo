
'use client';

import {
  collection,
  query,
  where,
  onSnapshot,
  Timestamp,
  orderBy,
  limit,
  addDoc,
  doc,
  updateDoc,
  runTransaction,
  increment,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './config';
import type { AppUser } from './users';
import { updateUserWallet } from './users';

export interface Withdrawal {
    id: string;
    userId: string;
    userName: string;
    userAvatar: string;
    amount: number;
    upiId: string;
    status: 'pending' | 'assigned' | 'completed' | 'rejected';
    createdAt: Timestamp;
    processedAt?: Timestamp;
    processedByAdminId?: string;
    processedByAdminName?: string;
    utr?: string;
}

/**
 * Creates a new withdrawal request.
 * @param data - The withdrawal request data.
 * @returns A promise that resolves when the request is created.
 */
export const createWithdrawalRequest = async (data: Omit<Withdrawal, 'id' | 'createdAt'>): Promise<void> => {
    const userRef = doc(db, 'users', data.userId);

    await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) throw new Error("User does not exist.");

        const appUser = userDoc.data() as AppUser;
        if ((appUser.wallet.winnings || 0) < data.amount) {
            throw new Error("Insufficient winning balance for withdrawal.");
        }

        // Deduct from user's winnings wallet
        transaction.update(userRef, {
            'wallet.winnings': increment(-data.amount)
        });

        // Create the withdrawal request
        const withdrawalRef = doc(collection(db, 'withdrawals'));
        transaction.set(withdrawalRef, {
            ...data,
            createdAt: serverTimestamp(),
        });
        
         // Log the transaction
        const transLogRef = doc(collection(db, 'transactions'));
        transaction.set(transLogRef, {
            userId: data.userId,
            userName: data.userName,
            amount: data.amount,
            type: 'withdrawal',
            status: 'pending',
            notes: `Withdrawal request to ${data.upiId}`,
            relatedId: withdrawalRef.id,
            createdAt: serverTimestamp(),
        });
    });
};

/**
 * Listens for all withdrawal requests for the admin panel.
 * @param callback - The function to call with the updated requests array.
 * @param onError - Optional callback for handling errors.
 * @returns An unsubscribe function to stop listening for updates.
 */
export const listenForWithdrawals = (
    callback: (withdrawals: Withdrawal[]) => void,
    onError?: (error: Error) => void
): (() => void) => {
    const withdrawalsRef = collection(db, 'withdrawals');
    const q = query(withdrawalsRef, orderBy('createdAt', 'desc'));

    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Withdrawal));
        callback(data);
    }, (error) => {
        console.error("Error listening for withdrawals:", error);
        if (onError) onError(error);
    });
};

/**
 * Listens for withdrawal requests assigned to a specific finance agent.
 * @param agentId The ID of the finance agent.
 * @param callback The function to call with the updated requests array.
 * @param onError Optional callback for handling errors.
 * @returns An unsubscribe function.
 */
export const listenForWithdrawalsByAgent = (agentId: string, callback: (withdrawals: Withdrawal[]) => void, onError: (error: Error) => void): (() => void) => {
    const q = query(
        collection(db, 'withdrawals'),
        where('processedByAdminId', '==', agentId),
        where('status', '==', 'assigned'),
        orderBy('createdAt', 'asc')
    );

    return onSnapshot(q, snapshot => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Withdrawal));
        callback(data);
    }, onError);
};

/**
 * Listens for all pending withdrawal requests that haven't been assigned yet.
 * @param callback The function to call with the updated requests array.
 * @param onError Optional callback for handling errors.
 * @returns An unsubscribe function.
 */
export const listenForPendingWithdrawals = (callback: (withdrawals: Withdrawal[]) => void, onError: (error: Error) => void): (() => void) => {
     const q = query(
        collection(db, 'withdrawals'),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'asc')
    );

    return onSnapshot(q, snapshot => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Withdrawal));
        callback(data);
    }, onError);
}


/**
 * Assigns a withdrawal request to a finance agent for processing.
 * @param withdrawalId The ID of the withdrawal request.
 * @param agentId The ID of the finance agent.
 * @param agentName The name of the finance agent.
 */
export const assignWithdrawalToAgent = async (withdrawalId: string, agentId: string, agentName: string): Promise<void> => {
    const withdrawalRef = doc(db, 'withdrawals', withdrawalId);
    
    await runTransaction(db, async (transaction) => {
        const withdrawalDoc = await transaction.get(withdrawalRef);
        if (!withdrawalDoc.exists()) throw new Error("Withdrawal request not found.");

        const withdrawal = withdrawalDoc.data();
        if (withdrawal.status !== 'pending') throw new Error("This withdrawal has already been assigned or processed.");

        transaction.update(withdrawalRef, {
            status: 'assigned',
            processedByAdminId: agentId,
            processedByAdminName: agentName
        });
        
         const transQuery = query(collection(db, 'transactions'), where("relatedId", "==", withdrawalId));
         const transDocs = await getDocs(transQuery);
         transDocs.forEach(doc => {
            transaction.update(doc.ref, { status: "assigned" });
        });
    });
};

/**
 * Confirms that a withdrawal payment has been made by the agent.
 * @param withdrawalId The ID of the withdrawal request.
 * @param utr The UPI Transaction ID (UTR) for the payment.
 */
export const confirmWithdrawalPayment = async (withdrawalId: string, utr: string): Promise<void> => {
    const withdrawalRef = doc(db, 'withdrawals', withdrawalId);

    await runTransaction(db, async (transaction) => {
        const withdrawalDoc = await transaction.get(withdrawalRef);
        if (!withdrawalDoc.exists()) throw new Error("Withdrawal request not found.");
        
        const withdrawal = withdrawalDoc.data() as Withdrawal;
        if (withdrawal.status !== 'assigned') throw new Error("This payment cannot be confirmed in its current state.");

        // Update withdrawal document
        transaction.update(withdrawalRef, {
            status: 'completed',
            utr: utr,
            processedAt: serverTimestamp()
        });

        // Debit the agent's wallet
        const agentRef = doc(db, 'users', withdrawal.processedByAdminId!);
        transaction.update(agentRef, {
            'agentWallet.balance': increment(-withdrawal.amount),
            'agentWallet.totalOut': increment(withdrawal.amount)
        });

        // Mark transaction log as completed
        const transQuery = query(collection(db, 'transactions'), where("relatedId", "==", withdrawalId));
        const transDocs = await getDocs(transQuery);
        transDocs.forEach(doc => {
            transaction.update(doc.ref, { status: "completed", notes: `UTR: ${utr}` });
        });
        
        // Add a credit transaction for the agent's commission (if applicable)
        // This logic can be added later if agents get a commission per payout
    });
};
