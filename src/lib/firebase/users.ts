

import { doc, getDoc, updateDoc, increment, collection, onSnapshot, writeBatch, serverTimestamp, runTransaction, query, where, getDocs, DocumentReference, Transaction as FirestoreTransaction, setDoc } from 'firebase/firestore';
import { db } from './config';
import { Transaction, TransactionType } from './transactions';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export type UserRole = 'superadmin' | 'finance' | 'support';

export interface AppUser {
    uid: string;
    email: string | null;
    displayName: string | null;
    phone?: string;
    photoURL?: string | null;
    role?: UserRole;
    status?: 'active' | 'suspended';
    wallet?: {
        balance: number;
        winnings: number;
    },
    // Agent Wallet for Finance role
    agentWallet?: {
        balance: number;
        totalIn: number; // Total amount received from superadmin
        totalOut: number; // Total amount paid to users
    }
    // KYC Details
    kycStatus?: 'Pending' | 'Verified' | 'Rejected';
    isKycVerified?: boolean; // Derived field for easy access
    aadhaar?: string;
    pan?: string;
    bankAccount?: string;
    ifsc?: string;
    bankName?: string;
    upiId?: string; // For withdrawals
    
    gameStats?: {
        played: number;
        won: number;
        lost: number;
    },
    lifetimeStats?: {
        totalDeposits: number;
        totalWithdrawals: number;
        totalWinnings: number;
        totalRevenue?: number; // For admin user
    },
    referralStats?: {
        referredBy?: string; // UID of the user who referred them
        referredCount: number;
        totalEarnings: number;
    }
}

export interface KycDetails {
    aadhaar: string;
    pan: string;
    bankAccount: string;
    ifsc: string;
    bankName: string;
    upiId: string;
}

export const getUser = async (uid: string): Promise<AppUser | null> => {
    if (!uid) return null;
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        const data = docSnap.data() as AppUser;
        return { 
            uid: docSnap.id, 
            ...data,
            isKycVerified: data.kycStatus === 'Verified' 
        };
    }
    return null;
}

export const updateUserKycDetails = async (uid: string, details: KycDetails) => {
    const userRef = doc(db, 'users', uid);
    return await updateDoc(userRef, {
        ...details,
        kycStatus: 'Pending',
        isKycVerified: false,
    });
};


const createTransactionInBatch = (
    transaction: FirestoreTransaction,
    userRef: DocumentReference,
    userData: AppUser,
    amount: number,
    transactionType: TransactionType,
    notes?: string,
    relatedId?: string
) => {
    const transactionRef = doc(collection(db, 'transactions'));
    transaction.set(transactionRef, {
        userId: userRef.id,
        userName: userData.displayName || 'N/A',
        amount: Math.abs(amount),
        type: transactionType,
        status: 'completed', // Default to completed for direct updates
        notes: notes || null,
        relatedId: relatedId || null,
        createdAt: serverTimestamp(),
    });
};


export const updateUserWallet = async (uid: string, amount: number, walletType: 'balance' | 'winnings' | 'agent', transactionType: TransactionType, notes?: string, relatedId?: string) => {
    const userRef = doc(db, 'users', uid);
    
    if (transactionType === 'revenue') {
        const adminUserRef = doc(db, 'users', uid);
        return await updateDoc(adminUserRef, {
            'lifetimeStats.totalRevenue': increment(amount)
        });
    }

    return await runTransaction(db, async (transaction) => {
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) {
            throw new Error("User not found");
        }
        const userData = userSnap.data() as AppUser;

        const currentBalance = userData.wallet?.balance || 0;
        const currentWinnings = userData.wallet?.winnings || 0;

        // This is a simple, direct wallet update. 
        // The logic for complex deductions (balance vs winnings) should be handled before calling this function if needed.
        if (amount < 0) {
             const deductionAmount = Math.abs(amount);
             if (walletType === 'balance' && currentBalance < deductionAmount) {
                 throw new Error('Insufficient deposit balance.');
             }
             if (walletType === 'winnings' && currentWinnings < deductionAmount) {
                 throw new Error('Insufficient winnings balance.');
             }
        }
        
        if (walletType === 'agent') {
            const fieldToUpdate = amount > 0 ? 'agentWallet.totalIn' : 'agentWallet.totalOut';
            transaction.update(userRef, {
                'agentWallet.balance': increment(amount),
                [fieldToUpdate]: increment(Math.abs(amount))
            });
        } else {
            const fieldToUpdate = walletType === 'balance' ? 'wallet.balance' : 'wallet.winnings';
            transaction.update(userRef, { [fieldToUpdate]: increment(amount) });
        }
        
        // Update lifetime stats
        if (transactionType === 'deposit') {
            transaction.update(userRef, { 'lifetimeStats.totalDeposits': increment(amount) });
        } else if (transactionType === 'withdrawal' && (notes === 'Withdrawal Approved' || status === 'approved')) {
            transaction.update(userRef, { 'lifetimeStats.totalWithdrawals': increment(Math.abs(amount)) });
        } else if (transactionType === 'winnings') {
            transaction.update(userRef, { 'lifetimeStats.totalWinnings': increment(amount) });
        } else if (transactionType === 'Referral Bonus') {
             transaction.update(userRef, { 'referralStats.totalEarnings': increment(amount) });
        }

        createTransactionInBatch(transaction, userRef, userData, amount, transactionType, notes, relatedId);
    });
}

export const updateUserKycStatus = async (uid: string, status: AppUser['kycStatus']) => {
    const userRef = doc(db, 'users', uid);
    const isVerified = status === 'Verified';
    return await updateDoc(userRef, { kycStatus: status, isKycVerified: isVerified });
}

export const updateUserStatus = async (uid: string, status: AppUser['status']) => {
    const userRef = doc(db, 'users', uid);
    return await updateDoc(userRef, { status: status });
};


export const listenForAllUsers = (
    callback: (users: AppUser[]) => void,
    onError?: (error: Error) => void,
    role?: UserRole
) => {
    const usersCollection = collection(db, 'users');
    const constraints = role ? [where('role', '==', role)] : [];
    const q = query(usersCollection, ...constraints);

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const users: AppUser[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data() as AppUser;
            users.push({ 
                uid: doc.id, 
                ...data,
                isKycVerified: data.kycStatus === 'Verified'
            });
        });
        callback(users);
    }, (error) => {
        console.error("Error listening for users: ", error);
        if (onError) {
            onError(error);
        }
    });

    return unsubscribe;
}

export const generateUserReport = async (user: AppUser, transactions: Transaction[]) => {
    const doc = new jsPDF();
    const totalBalance = (user.wallet?.balance || 0) + (user.wallet?.winnings || 0);

    doc.setFontSize(22);
    doc.text("User Transaction Report", 14, 22);
    doc.setFontSize(12);
    doc.text(`User: ${user.displayName} (${user.email})`, 14, 32);
    doc.text(`Report Generated: ${new Date().toLocaleString()}`, 14, 38);
    
    doc.setFontSize(16);
    doc.text("Account Summary", 14, 50);
    (doc as any).autoTable({
        startY: 55,
        head: [['Metric', 'Value']],
        body: [
            ['Total Balance', `₹${totalBalance.toFixed(2)}`],
            ['Deposit Balance', `₹${(user.wallet?.balance || 0).toFixed(2)}`],
            ['Winnings Balance', `₹${(user.wallet?.winnings || 0).toFixed(2)}`],
            ['KYC Status', user.kycStatus || 'N/A'],
            ['Account Status', user.status || 'active'],
        ],
        theme: 'striped',
    });

    // @ts-ignore
    const lastY = doc.lastAutoTable.finalY;
    
    doc.setFontSize(16);
    doc.text("Transaction History", 14, lastY + 15);
    

    const tableData = transactions.map(tx => [
        tx.createdAt?.toDate().toLocaleString() || 'N/A',
        tx.type.replace(/_/g, ' '),
        `₹${tx.amount.toFixed(2)}`,
        tx.status,
        tx.notes || tx.relatedId || 'N/A',
    ]);
    
    (doc as any).autoTable({
        startY: lastY + 25,
        head: [['Date', 'Type', 'Amount', 'Status', 'Notes']],
        body: tableData,
        theme: 'grid'
    });
    
    doc.save(`report_${user.uid}_${new Date().toISOString().split('T')[0]}.pdf`);
}
