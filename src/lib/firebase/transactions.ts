

import { collection, addDoc, serverTimestamp, where, query, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db, storage } from './config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const TRANSACTIONS_COLLECTION = 'transactions';
export const DEPOSITS_COLLECTION = 'deposits';


export type TransactionType = 'deposit' | 'withdrawal' | 'winnings' | 'game_fee' | 'penalty' | 'refund' | 'deposit_manual' | 'withdrawal_manual';
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
    notes?: string; // For manual adjustments
}

export interface DepositRequest {
    id: string;
    userId: string;
    userName: string;
    userAvatar: string;
    amount: number;
    upiId: string; // The UPI ID the user paid to
    status: 'pending' | 'approved' | 'rejected';
    createdAt: any; // Firestore timestamp
    screenshotUrl?: string; // URL of the payment screenshot
}

// For creating deposit requests that an admin needs to approve
export const createDepositRequest = async (data: {
    userId: string;
    userName: string;
    userAvatar: string;
    amount: number;
    upiId: string;
    status: 'pending';
    screenshotFile: File;
}) => {
    // 1. Upload screenshot to Firebase Storage
    const screenshotRef = ref(storage, `deposit_screenshots/${data.userId}/${Date.now()}_${data.screenshotFile.name}`);
    const uploadResult = await uploadBytes(screenshotRef, data.screenshotFile);
    const screenshotUrl = await getDownloadURL(uploadResult.ref);

    // 2. Create the document in Firestore
    const { screenshotFile, ...firestoreData } = data;
    return await addDoc(collection(db, DEPOSITS_COLLECTION), {
        ...firestoreData,
        screenshotUrl,
        createdAt: serverTimestamp(),
    });
};

export const updateDepositStatus = async (id: string, status: DepositRequest['status']) => {
    const depositRef = doc(db, DEPOSITS_COLLECTION, id);
    return updateDoc(depositRef, { status });
}

// Listen for all deposit requests
export const listenForDepositRequests = (
    callback: (requests: DepositRequest[]) => void,
    onError?: (error: Error) => void
) => {
    const q = query(collection(db, DEPOSITS_COLLECTION));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const requests: DepositRequest[] = [];
        querySnapshot.forEach((doc) => {
            requests.push({ id: doc.id, ...doc.data() } as DepositRequest);
        });
        callback(requests.sort((a, b) => b.createdAt - a.createdAt));
    }, (error) => {
        console.error("Error listening for deposit requests: ", error);
        if (onError) onError(error);
    });

    return unsubscribe;
};


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
    const q = query(collection(db, TRANSACTIONS_COLLECTION), where("userId", "==", userId));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const transactions: Transaction[] = [];
        querySnapshot.forEach((doc) => {
            transactions.push({ id: doc.id, ...doc.data() } as Transaction);
        });
        callback(transactions.sort((a, b) => b.createdAt - a.createdAt));
    }, (error) => {
        console.error("Error listening for transactions: ", error);
        if (onError) {
            onError(error);
        }
    });

    return unsubscribe;
};
