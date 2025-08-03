

import { 
    collection, 
    addDoc, 
    serverTimestamp,
    onSnapshot,
    query,
    doc,
    updateDoc,
    writeBatch,
    increment,
    getDoc,
    orderBy
} from 'firebase/firestore';
import { db } from './config';
import { createTransaction } from './transactions';
import { updateUserWallet } from './users';

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

     const userSnap = await getDoc(userRef);
     if (!userSnap.exists() || (userSnap.data().wallet?.winnings || 0) < data.amount) {
         throw new Error("Insufficient winning balance.");
     }

     // 1. Decrement user's winnings
     batch.update(userRef, { 'wallet.winnings': increment(-data.amount) });

     // 2. Create withdrawal request
     batch.set(withdrawalRef, {
        ...data,
        createdAt: serverTimestamp()
     });

     // 3. Create a pending transaction log
     await createTransaction({
        userId: data.userId,
        userName: data.userName,
        amount: data.amount,
        type: 'withdrawal',
        status: 'pending',
        relatedId: withdrawalRef.id,
     });

     await batch.commit();
     return withdrawalRef;
};


export const updateWithdrawalStatus = async (id: string, status: Withdrawal['status']) => {
    const withdrawalRef = doc(db, WITHDRAWALS_COLLECTION, id);
    const withdrawalSnap = await getDoc(withdrawalRef);
    if (!withdrawalSnap.exists()) throw new Error("Withdrawal request not found");
    const withdrawalData = withdrawalSnap.data() as Withdrawal;

    await updateDoc(withdrawalRef, { status });

    if (status === 'approved') {
        // Update user's lifetime withdrawal stats
        await updateUserWallet(withdrawalData.userId, withdrawalData.amount, 'winnings', 'withdrawal', 'Withdrawal Approved');
    }
}


export const listenForWithdrawals = (
    callback: (withdrawals: Withdrawal[]) => void,
    onError?: (error: Error) => void
) => {
    const q = query(collection(db, WITHDRAWALS_COLLECTION), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const withdrawals: Withdrawal[] = [];
        querySnapshot.forEach((doc) => {
            withdrawals.push({ id: doc.id, ...doc.data() } as Withdrawal);
        });
        callback(withdrawals);
    }, (error) => {
        console.error("Error listening for withdrawals: ", error);
        if (onError) {
            onError(error);
        }
    });

    return unsubscribe;
};
