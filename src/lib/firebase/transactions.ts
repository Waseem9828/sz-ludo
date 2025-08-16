

import { collection, addDoc, serverTimestamp, where, query, onSnapshot, updateDoc, doc, writeBatch, orderBy, getDocs, limit, Timestamp, QueryConstraint } from 'firebase/firestore';
import { db } from './config';

const TRANSACTIONS_COLLECTION = 'transactions';

export type TransactionType = 'deposit' | 'withdrawal' | 'winnings' | 'game_fee' | 'penalty' | 'refund' | 'Admin Credit' | 'Admin Debit' | 'Withdrawal Rejected' | 'Challenge Created' | 'Challenge Accepted' | 'revenue' | 'Referral Bonus' | 'Sign Up';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'rejected' | 'approved';

export interface Transaction {
    id: string;
    userId: string;
    userName: string;
    amount: number;
    type: TransactionType;
    status: TransactionStatus;
    createdAt: Timestamp; // Using Firestore Timestamp for consistency
    relatedId?: string; // For deposits, withdrawals, games etc.
    notes?: string; // For manual adjustments
}

// For creating any transaction log
export const createTransaction = async (data: Omit<Transaction, 'id'>) => {
    return await addDoc(collection(db, TRANSACTIONS_COLLECTION), data);
}


// Listen for user transactions
export const listenForUserTransactions = (
    userId: string,
    callback: (transactions: Transaction[]) => void,
    limitCount: number = 20, // Default limit to 20
    onError?: (error: Error) => void
) => {
    const q = query(
        collection(db, TRANSACTIONS_COLLECTION), 
        where("userId", "==", userId), 
        orderBy("createdAt", "desc"), 
        limit(limitCount)
    );

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
    callback: (transactions: Transaction[]) => void,
    onError?: (error: Error) => void,
    options?: {
        limitCount?: number;
        statuses?: TransactionStatus[];
    }
) => {
     const constraints: QueryConstraint[] = [];

     if (options?.statuses && options.statuses.length > 0) {
        constraints.push(where("status", "in", options.statuses));
     }

     constraints.push(orderBy("createdAt", "desc"));

     if (options?.limitCount) {
        constraints.push(limit(options.limitCount));
     }
     
     const q = query(collection(db, TRANSACTIONS_COLLECTION), ...constraints);

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
