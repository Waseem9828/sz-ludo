
import { doc, getDoc, updateDoc, increment, collection, onSnapshot, writeBatch, serverTimestamp, runTransaction, query, where, getDocs, DocumentReference, Transaction as FirestoreTransaction } from 'firebase/firestore';
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
    
    // Special case for revenue, which is not a real transaction for a user wallet
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

        // If deducting, check from which wallet to pull
        if (amount < 0) {
             const totalBalance = currentBalance + currentWinnings;
             const deductionAmount = Math.abs(amount);

             if (totalBalance < deductionAmount) {
                 throw new Error('Insufficient total balance.');
             }

             // Prioritize deducting from deposit balance first, then winnings
             let remainingDeduction = deductionAmount;
             
             const balanceDeduction = Math.min(remainingDeduction, currentBalance);
             if (balanceDeduction > 0) {
                transaction.update(userRef, { 'wallet.balance': increment(-balanceDeduction) });
                remainingDeduction -= balanceDeduction;
             }

             if (remainingDeduction > 0) {
                 const winningsDeduction = Math.min(remainingDeduction, currentWinnings);
                 if (winningsDeduction > 0) {
                    transaction.update(userRef, { 'wallet.winnings': increment(-winningsDeduction) });
                    remainingDeduction -= winningsDeduction;
                 }
             }
             
             if (remainingDeduction > 0) {
                 // This should not happen if total balance check is correct, but as a safeguard:
                 throw new Error("Balance deduction calculation error.");
             }

        } else {
            // If adding, add to the specified wallet type
            if (walletType === 'agent') {
                transaction.update(userRef, {
                    'agentWallet.balance': increment(amount),
                    'agentWallet.totalIn': increment(amount)
                });
            } else {
                const fieldToUpdate = walletType === 'balance' ? 'wallet.balance' : 'wallet.winnings';
                transaction.update(userRef, { [fieldToUpdate]: increment(amount) });
            }
        }
        
        // Update lifetime stats for deposits or approved withdrawals
        if (transactionType === 'deposit' && (notes?.includes('Approved') || notes?.includes('Paytm'))) {
            transaction.update(userRef, { 'lifetimeStats.totalDeposits': increment(amount) });
        } else if (transactionType === 'withdrawal' && notes === 'Withdrawal Approved') {
            transaction.update(userRef, { 'lifetimeStats.totalWithdrawals': increment(Math.abs(amount)) });
        } else if (transactionType === 'winnings') {
            transaction.update(userRef, { 'lifetimeStats.totalWinnings': increment(amount) });
        } else if (transactionType === 'Referral Earning') {
            transaction.update(userRef, { 'referralStats.totalEarnings': increment(amount) });
        }


        // Create a transaction log
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

    // Header
    doc.setFontSize(22);
    doc.text("User Transaction Report", 14, 22);
    doc.setFontSize(12);
    doc.text(`User: ${user.displayName} (${user.email})`, 14, 32);
    doc.text(`Report Generated: ${new Date().toLocaleString()}`, 14, 38);
    
    // Summary
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

    // Transactions Table
    // Check if there's enough space, otherwise add a new page
    // @ts-ignore
    if (doc.lastAutoTable.finalY > 200) {
      doc.addPage();
      doc.setFontSize(16);
      doc.text("Transaction History", 14, 22);
    } else {
      doc.setFontSize(16);
      // @ts-ignore
      doc.text("Transaction History", 14, doc.lastAutoTable.finalY + 15);
    }
    

    const tableData = transactions.map(tx => [
        tx.createdAt?.toDate().toLocaleString() || 'N/A',
        tx.type.replace(/_/g, ' '),
        `₹${tx.amount.toFixed(2)}`,
        tx.status,
        tx.notes || tx.relatedId || 'N/A',
    ]);
    
    (doc as any).autoTable({
        // @ts-ignore
        startY: doc.lastAutoTable.finalY ? doc.lastAutoTable.finalY + 25 : 30,
        head: [['Date', 'Type', 'Amount', 'Status', 'Notes']],
        body: tableData,
        theme: 'grid'
    });
    
    // Save the PDF
    doc.save(`report_${user.uid}_${new Date().toISOString().split('T')[0]}.pdf`);
}
