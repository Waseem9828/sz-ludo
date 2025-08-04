

import { collection, addDoc, serverTimestamp, where, query, onSnapshot, updateDoc, doc, writeBatch, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from './config';

const TRANSACTIONS_COLLECTION = 'transactions';

export type TransactionType = 'deposit' | 'withdrawal' | 'winnings' | 'game_fee' | 'penalty' | 'refund' | 'Admin Credit' | 'Admin Debit' | 'Withdrawal Rejected' | 'Challenge Created' ;
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'rejected' | 'approved';

export interface Transaction {
    id: string;
    userId: string;
    userName: string;
    amount: number;
    type: TransactionType;
    status: TransactionStatus;
    createdAt: any;
    relatedId?: string; // For deposits, withdrawals, games etc.
    notes?: string; // For manual adjustments
}

// For creating any transaction log
export const createTransaction = async (data: Omit<Transaction, 'id' | 'createdAt'>) => {
    return await addDoc(collection(db, TRANSACTIONS_COLLECTION), {
        ...data,
        createdAt: serverTimestamp(),
    });
}


// Listen for user transactions
export const listenForUserTransactions = (
    userId: string,
    callback: (transactions: Transaction[]) => void,
    onError?: (error: Error) => void
) => {
    const q = query(collection(db, TRANSACTIONS_COLLECTION), where("userId", "==", userId), orderBy("createdAt", "desc"));

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

// Listen for all transactions for admin dashboard
export const listenForAllTransactions = (
    limitCount: number,
    callback: (transactions: Transaction[]) => void,
    onError?: (error: Error) => void
) => {
     const q = query(
        collection(db, TRANSACTIONS_COLLECTION), 
        orderBy("createdAt", "desc"), 
        where("status", "in", ["completed", "approved", "pending", "rejected"]), 
        limit(limitCount)
    );

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const transactions: Transaction[] = [];
        querySnapshot.forEach((doc) => {
            transactions.push({ id: doc.id, ...doc.data() } as Transaction);
        });
        callback(transactions);
    }, (error) => {
        console.error("Error listening for all transactions: ", error);
        if (onError) {
            onError(error);
        }
    });

    return unsubscribe;
}
