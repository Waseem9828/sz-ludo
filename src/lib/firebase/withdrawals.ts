

import { 
    collection, 
    addDoc, 
    serverTimestamp,
    onSnapshot,
    query,
    doc,
    updateDoc,
    writeBatch,
    increment
} from 'firebase/firestore';
import { db } from './config';
import { createTransaction } from './transactions';

export interface Withdrawal {
    id: string;
    userId: string;
    userName: string;
    userAvatar: string;
    amount: number;
    upiId: string;
    createdAt: any; // Firestore timestamp
    status: 'pending' | 'approved' | 'rejected';
}

const WITHDRAWALS_COLLECTION = 'withdrawals';

export const createWithdrawalRequest = async (data: {
    userId: string;
    userName: string;
    userAvatar: string;
    amount: number;
    upiId: string;
    status: 'pending'
}) => {
     const batch = writeBatch(db);
     const userRef = doc(db, 'users', data.userId);
     const withdrawalRef = doc(collection(db, WITHDRAWALS_COLLECTION));

     // 1. Decrement user's winnings
     batch.update(userRef, { 'wallet.winnings': increment(-data.amount) });

     // 2. Create withdrawal request
     batch.set(withdrawalRef, {
        ...data,
        createdAt: serverTimestamp()
     });

     await batch.commit();
     return withdrawalRef;
};


export const updateWithdrawalStatus = async (id: string, status: Withdrawal['status']) => {
    const withdrawalRef = doc(db, WITHDRAWALS_COLLECTION, id);
    return updateDoc(withdrawalRef, { status });
}


export const listenForWithdrawals = (
    callback: (withdrawals: Withdrawal[]) => void,
    onError?: (error: Error) => void
) => {
    const q = query(collection(db, WITHDRAWALS_COLLECTION));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const withdrawals: Withdrawal[] = [];
        querySnapshot.forEach((doc) => {
            withdrawals.push({ id: doc.id, ...doc.data() } as Withdrawal);
        });
        callback(withdrawals.sort((a, b) => b.createdAt - a.createdAt));
    }, (error) => {
        console.error("Error listening for withdrawals: ", error);
        if (onError) {
            onError(error);
        }
    });

    return unsubscribe;
};
