
import { doc, getDoc, updateDoc, increment, collection, onSnapshot, writeBatch, serverTimestamp, runTransaction, query, where, getDocs, DocumentReference, Transaction as FirestoreTransaction, setDoc, orderBy, limit } from 'firebase/firestore';
import { db } from './config';
import { Transaction, TransactionType } from './transactions';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { User } from 'firebase/auth';

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
    isKycVerified: boolean; // Derived field for easy access
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
        const data = docSnap.data() as Omit<AppUser, 'isKycVerified' | 'uid'>;
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
    const userRef = doc(db, "users", uid);

    return runTransaction(db, async (transaction) => {
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) {
            throw new Error("User not found");
        }
        const userData = userSnap.data() as AppUser;

        const updates: { [key: string]: any } = {};

        if (walletType === 'agent') {
            updates['agentWallet.balance'] = increment(amount);
            if (amount > 0) {
                updates['agentWallet.totalIn'] = increment(amount);
            } else {
                updates['agentWallet.totalOut'] = increment(Math.abs(amount));
            }
        } else {
            if (amount < 0) {
                // Handle deduction from both wallets if necessary
                const deductionAmount = Math.abs(amount);
                const currentBalance = userData.wallet?.balance || 0;
                
                if (currentBalance < deductionAmount) {
                    const fromWinnings = deductionAmount - currentBalance;
                    if ((userData.wallet?.winnings || 0) < fromWinnings) {
                        throw new Error("Insufficient total balance for this action.");
                    }
                    updates['wallet.balance'] = increment(-currentBalance);
                    updates['wallet.winnings'] = increment(-fromWinnings);
                } else {
                    updates['wallet.balance'] = increment(-deductionAmount);
                }

            } else {
                // Handle addition to a specific wallet
                const fieldToUpdate = walletType === 'balance' ? 'wallet.balance' : 'wallet.winnings';
                updates[fieldToUpdate] = increment(amount);
            }
        }

        // Update lifetime stats for specific transaction types
        if (transactionType === 'deposit') {
            updates['lifetimeStats.totalDeposits'] = increment(amount);
        } else if (transactionType === 'withdrawal' && (notes === 'Withdrawal Approved' || notes?.startsWith('Withdrawal Processed'))) {
             updates['lifetimeStats.totalWithdrawals'] = increment(Math.abs(amount));
        } else if (transactionType === 'winnings') {
            updates['lifetimeStats.totalWinnings'] = increment(amount);
        }

        transaction.update(userRef, updates);
        
        // Always create a transaction log for the wallet update
        createTransactionInBatch(transaction, userRef, userData, amount, transactionType, notes, relatedId);

        // Special handling for deposit referral bonus
        if (transactionType === 'deposit' && userData.referralStats?.referredBy) {
            const referrerRef = doc(db, 'users', userData.referralStats.referredBy);
            const referrerSnap = await transaction.get(referrerRef);
            if (referrerSnap.exists()) {
                const bonusAmount = amount * 0.02; // 2% commission
                transaction.update(referrerRef, {
                    'wallet.balance': increment(bonusAmount),
                    'referralStats.totalEarnings': increment(bonusAmount)
                });
                createTransactionInBatch(transaction, referrerRef, referrerSnap.data() as AppUser, bonusAmount, 'Referral Bonus', `From ${userData.displayName}'s deposit`);
            }
        }
    });
};

export const updateUserKycStatus = async (uid: string, status: 'Pending' | 'Verified' | 'Rejected') => {
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
    const q = role ? query(usersCollection, where('role', '==', role), orderBy('createdAt', 'desc')) : query(usersCollection, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const users: AppUser[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data() as Omit<AppUser, 'isKycVerified' | 'uid'>;
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
    try {
        const { jsPDF } = await import('jspdf');
        await import('jspdf-autotable');
        
        const doc = new jsPDF();
        const totalBalance = (user.wallet?.balance || 0) + (user.wallet?.winnings || 0);

        doc.setFontSize(22);
        doc.text("User Transaction Report", 14, 22);
        doc.setFontSize(12);
        doc.text(`User: ${user.displayName || 'N/A'} (${user.email || 'N/A'})`, 14, 32);
        doc.text(`Report Generated: ${new Date().toLocaleString()}`, 14, 38);
        
        doc.setFontSize(16);
        doc.text("Account Summary", 14, 50);
        const summaryBody = [
            ['Total Balance', `₹${totalBalance.toFixed(2)}`],
            ['Deposit Balance', `₹${(user.wallet?.balance || 0).toFixed(2)}`],
            ['Winnings Balance', `₹${(user.wallet?.winnings || 0).toFixed(2)}`],
            ['KYC Status', user.kycStatus || 'N/A'],
            ['Account Status', user.status || 'active'],
        ];
        (doc as any).autoTable({
            startY: 55,
            head: [['Metric', 'Value']],
            body: summaryBody,
            theme: 'striped',
        });

        const lastY = (doc as any).lastAutoTable?.finalY ?? 100;
        
        doc.setFontSize(16);
        doc.text("Transaction History", 14, lastY + 15);
        

        const transactionBody = transactions.map(tx => [
            tx.createdAt?.toDate().toLocaleString() || 'N/A',
            tx.type ? tx.type.replace(/_/g, ' ') : 'N/A',
            `₹${tx.amount.toFixed(2)}`,
            tx.status || 'N/A',
            tx.notes || tx.relatedId || 'N/A',
        ]);
        
        (doc as any).autoTable({
            startY: lastY + 20,
            head: [['Date', 'Type', 'Amount', 'Status', 'Notes']],
            body: transactionBody,
            theme: 'grid'
        });
        
        doc.save(`report_${user.uid}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch(e) {
        console.error("Error generating PDF:", e);
        throw new Error("Failed to generate PDF report.");
    }
}
