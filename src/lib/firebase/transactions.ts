

import { collection, addDoc, serverTimestamp, where, query, onSnapshot } from 'firebase/firestore';
import { db } from './config';

const TRANSACTIONS_COLLECTION = 'transactions';

export type TransactionType = 'deposit' | 'withdrawal' | 'winnings' | 'game_fee' | 'penalty' | 'refund';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'rejected' | 'approved';

export interface Transaction {
    id: string;
    userId: string;
    userName: string;
    amount: number;
    type: TransactionType;
    status: TransactionStatus;
    createdAt: any;
    relatedGameId?: string;
    upiId?: string; // For deposits and withdrawals
}

// For creating deposit requests that an admin needs to approve
export const createDepositRequest = async (data: {
    userId: string;
    userName: string;
    amount: number;
    upiId: string;
    status: 'pending';
}) => {
    return await addDoc(collection(db, TRANSACTIONS_COLLECTION), {
        ...data,
        type: 'deposit',
        createdAt: serverTimestamp(),
    });
};


// Listen for user transactions
export const listenForUserTransactions = (
    userId: string,
    callback: (transactions: Transaction[]) => void,
    onError?: (error: Error) => void
) => {
    const q = query(collection(db, TRANSACTIONS_COLLECTION), where("userId", "==", userId));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const transactions: Transaction[] = [];
        querySnapshot.forEach((doc) => {
            transactions.push({ id: doc.id, ...doc.data() } as Transaction);
        });
        callback(transactions);
    }, (error) => {
        console.error("Error listening for transactions: ", error);
        if (onError) {
            onError(error);
        }
    });

    return unsubscribe;
};
