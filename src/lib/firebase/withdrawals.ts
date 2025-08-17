

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
    where,
    Timestamp
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
    status: 'pending' | 'assigned' | 'approved' | 'rejected';
    processedByAdminId?: string;
    processedByAdminName?: string;
    utr?: string; // Transaction ID from agent
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
     
     return runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', data.userId);
        const withdrawalRef = doc(collection(db, WITHDRAWALS_COLLECTION));

        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists() || (userSnap.data().wallet?.winnings || 0) < data.amount) {
            throw new Error("Insufficient winning balance.");
        }

        // 1. Decrement user's winnings
        transaction.update(userRef, { 'wallet.winnings': increment(-data.amount) });

        // 2. Create withdrawal request
        transaction.set(withdrawalRef, {
            ...data,
            createdAt: serverTimestamp()
        });

        // 3. Create a pending transaction log
        const transLogRef = doc(collection(db, 'transactions'));
        transaction.set(transLogRef, {
             userId: data.userId,
            userName: data.userName,
            amount: data.amount,
            type: 'withdrawal',
            status: 'pending',
            relatedId: withdrawalRef.id,
        });

        return withdrawalRef;
     });
};

// Agent assigns a withdrawal to themselves
export const assignWithdrawalToAgent = async (withdrawalId: string, agentId: string, agentName: string) => {
    const withdrawalRef = doc(db, WITHDRAWALS_COLLECTION, withdrawalId);
    
    return await runTransaction(db, async (transaction) => {
        const withdrawalSnap = await transaction.get(withdrawalRef);
        if (!withdrawalSnap.exists() || withdrawalSnap.data().status !== 'pending') {
            throw new Error("This withdrawal is no longer available to be assigned.");
        }
        
        transaction.update(withdrawalRef, {
            status: 'assigned',
            processedByAdminId: agentId,
            processedByAdminName: agentName
        });
    });
};

// Agent confirms they have made the payment
export const confirmWithdrawalPayment = async (withdrawalId: string, utr: string) => {
    const withdrawalRef = doc(db, WITHDRAWALS_COLLECTION, withdrawalId);

    return await runTransaction(db, async (transaction) => {
        const withdrawalSnap = await transaction.get(withdrawalRef);
        if (!withdrawalSnap.exists()) throw new Error("Withdrawal request not found");
        
        const withdrawal = withdrawalSnap.data() as Withdrawal;
        if (withdrawal.status !== 'assigned') {
            throw new Error("This withdrawal is not in an assigned state.");
        }

        const agentId = withdrawal.processedByAdminId;
        if (!agentId) throw new Error("No agent assigned to this withdrawal.");

        const agentRef = doc(db, 'users', agentId);
        const agentSnap = await transaction.get(agentRef);
        if (!agentSnap.exists()) throw new Error("Processing agent not found.");
        
        const agentData = agentSnap.data() as AppUser;
        const agentBalance = agentData.agentWallet?.balance || 0;
        if (agentBalance < withdrawal.amount) {
            throw new Error("Agent has insufficient funds to complete this payout.");
        }

        // 1. Update withdrawal status to approved and record UTR
        transaction.update(withdrawalRef, { status: 'approved', utr: utr });

        // 2. Deduct from agent's wallet
        transaction.update(agentRef, {
            'agentWallet.balance': increment(-withdrawal.amount),
            'agentWallet.totalOut': increment(withdrawal.amount),
        });

        // 3. Update user's lifetime withdrawal stats
        const userRef = doc(db, 'users', withdrawal.userId);
        transaction.update(userRef, { 'lifetimeStats.totalWithdrawals': increment(withdrawal.amount) });
        
        // 4. Find and update the corresponding transaction log
        const transQuery = query(collection(db, "transactions"), where("relatedId", "==", withdrawalId), where("type", "==", "withdrawal"));
        const transSnapshot = await getDocs(transQuery);
        if (!transSnapshot.empty) {
            const transDocRef = transSnapshot.docs[0].ref;
            transaction.update(transDocRef, { status: 'approved' });
        }
    });
};

// Listen for all withdrawals for superadmin panel
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

// Listen for withdrawals assigned to a specific agent
export const listenForWithdrawalsByAgent = (
    agentId: string,
    callback: (withdrawals: Withdrawal[]) => void,
    onError?: (error: Error) => void
) => {
    const q = query(
        collection(db, WITHDRAWALS_COLLECTION),
        where("processedByAdminId", "==", agentId),
        where("status", "==", "assigned"),
        orderBy("createdAt", "asc")
    );
    return onSnapshot(q, snapshot => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Withdrawal));
        callback(data);
    }, onError);
};

// Listen for all pending withdrawals
export const listenForPendingWithdrawals = (
    callback: (withdrawals: Withdrawal[]) => void,
    onError?: (error: Error) => void
) => {
    const q = query(
        collection(db, WITHDRAWALS_COLLECTION),
        where("status", "==", "pending"),
        orderBy("createdAt", "asc")
    );
    return onSnapshot(q, snapshot => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Withdrawal));
        callback(data);
    }, onError);
};
