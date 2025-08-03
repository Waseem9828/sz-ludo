

import { collection, addDoc, serverTimestamp, where, query, onSnapshot, updateDoc, doc, writeBatch, orderBy, getDocs } from 'firebase/firestore';
import { db, storage } from './config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const TRANSACTIONS_COLLECTION = 'transactions';
export const DEPOSITS_COLLECTION = 'deposits';


export type TransactionType = 'deposit' | 'withdrawal' | 'winnings' | 'game_fee' | 'penalty' | 'refund' | 'deposit_manual' | 'withdrawal_manual' | 'withdrawal_rejection';
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
    
    await addDoc(collection(db, DEPOSITS_COLLECTION), {
        ...firestoreData,
        screenshotUrl,
        createdAt: serverTimestamp(),
    });
};

export const updateDepositStatus = async (id: string, status: DepositRequest['status']) => {
    const depositRef = doc(db, DEPOSITS_COLLECTION, id);
    const batch = writeBatch(db);

    batch.update(depositRef, { status });

    // Also update the corresponding transaction log if it exists
    const q = query(collection(db, TRANSACTIONS_COLLECTION), where("relatedId", "==", id));
    const querySnapshot = await getDocs(q);

    querySnapshot.forEach((doc) => {
        if (doc.exists()) {
            const transactionRef = doc.ref;
            batch.update(transactionRef, { status: status === 'approved' ? 'completed' : status });
        }
    });

    return batch.commit();
}

// Listen for all deposit requests
export const listenForDepositRequests = (
    callback: (requests: DepositRequest[]) => void,
    onError?: (error: Error) => void
) => {
    const q = query(collection(db, DEPOSITS_COLLECTION), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const requests: DepositRequest[] = [];
        querySnapshot.forEach((doc) => {
            requests.push({ id: doc.id, ...doc.data() } as DepositRequest);
        });
        callback(requests);
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
