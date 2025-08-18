
'use client';

import {
  collection,
  query,
  where,
  onSnapshot,
  Timestamp,
  orderBy,
  limit,
  getDocs,
} from 'firebase/firestore';
import { db } from './config';

export type TransactionType = 'deposit' | 'withdrawal' | 'winnings' | 'penalty' | 'refund' | 'Admin Credit' | 'Admin Debit' | 'Challenge Created' | 'Challenge Accepted' | 'Sign Up' | 'Referral Bonus' | 'Tournament Entry' | 'revenue';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'on_hold' | 'refunded' | 'approved' | 'rejected' | 'assigned';


export interface Transaction {
    id: string;
    userId: string;
    userName: string;
    amount: number;
    type: TransactionType;
    status: TransactionStatus;
    notes?: string;
    relatedId?: string; // e.g., gameId, withdrawalId
    createdAt: Timestamp;
}

/**
 * Listens for a user's transactions.
 * @param userId - The ID of the user.
 * @param callback - The function to call with the transactions array.
 * @param count - The number of transactions to fetch.
 * @returns An unsubscribe function.
 */
export const listenForUserTransactions = (
    userId: string,
    callback: (transactions: Transaction[]) => void,
    count = 50
  ): (() => void) => {
  const transactionsRef = collection(db, 'transactions');
  const q = query(
    transactionsRef,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(count)
  );

  return onSnapshot(q, (snapshot) => {
    const transactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
    callback(transactions);
  });
};


interface GetAllTransactionsOptions {
    limitCount?: number;
    statuses?: TransactionStatus[];
}

/**
 * Fetches all transactions, with optional filters. For admin use.
 * @param options - Filtering options.
 * @returns A promise that resolves to an array of transactions.
 */
export const getAllTransactions = async (options: GetAllTransactionsOptions = {}): Promise<Transaction[]> => {
    const { limitCount = 100, statuses } = options;
    const transactionsRef = collection(db, 'transactions');
    
    let q = query(transactionsRef, orderBy('createdAt', 'desc'));

    if (statuses && statuses.length > 0) {
        q = query(q, where('status', 'in', statuses));
    }
    
    if (limitCount) {
        q = query(q, limit(limitCount));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
};
