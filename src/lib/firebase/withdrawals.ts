

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
    orderBy,
    runTransaction,
    getDocs,
    where
} from 'firebase/firestore';
import { db } from './config';
import { createTransaction } from './transactions';
import { AppUser, getUser, updateUserWallet } from './users';

export interface Withdrawal {
    id: string;
    userId: string;
    userName: string;
    userAvatar: string;
    amount: number;
    upiId: string;
    createdAt: any; // Firestore timestamp
    status: 'pending' | 'approved' | 'rejected';
    processedByAdminId?: string;
    processedByAdminName?: string;
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


export const updateWithdrawalStatus = async (id: string, status: Withdrawal['status'], adminId: string) => {
    const withdrawalRef = doc(db, WITHDRAWALS_COLLECTION, id);
    
    await runTransaction(db, async (transaction) => {
        const withdrawalSnap = await transaction.get(withdrawalRef);
        if (!withdrawalSnap.exists()) throw new Error("Withdrawal request not found");
        
        const withdrawalData = withdrawalSnap.data() as Withdrawal;
        const userRef = doc(db, 'users', withdrawalData.userId);
        const adminRef = doc(db, 'users', adminId);

        const adminSnap = await transaction.get(adminRef);
        if (!adminSnap.exists()) throw new Error("Admin user not found.");
        const adminData = adminSnap.data() as AppUser;

        const updatePayload: Partial<Withdrawal> = { 
            status,
            processedByAdminId: adminId,
            processedByAdminName: adminData.displayName || adminData.email,
        };

        // Update the withdrawal document status
        transaction.update(withdrawalRef, updatePayload);

        if (status === 'approved') {
            // Deduct from agent's wallet if they are a finance agent
            if (adminData.role === 'finance') {
                const agentBalance = adminData.agentWallet?.balance || 0;
                if (agentBalance < withdrawalData.amount) {
                    throw new Error("The agent has insufficient funds to process this withdrawal.");
                }
                transaction.update(adminRef, {
                    'agentWallet.balance': increment(-withdrawalData.amount),
                    'agentWallet.totalOut': increment(withdrawalData.amount),
                });
            }
            // Update user's lifetime withdrawal stats
            transaction.update(userRef, { 'lifetimeStats.totalWithdrawals': increment(withdrawalData.amount) });
        } else if (status === 'rejected') {
            // If rejected, refund the amount to the user's winnings wallet
            transaction.update(userRef, { 'wallet.winnings': increment(withdrawalData.amount) });
        }
        
        // Find and update the corresponding transaction log
        const transQuery = query(collection(db, "transactions"), where("relatedId", "==", id), where("type", "==", "withdrawal"));
        const transSnapshot = await getDocs(transQuery);
        
        if (!transSnapshot.empty) {
            const transDocRef = transSnapshot.docs[0].ref;
            transaction.update(transDocRef, { status: status });
        }
    });
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
