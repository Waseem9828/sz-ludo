
import { doc, updateDoc, Timestamp, getDoc, onSnapshot, collection, query, orderBy, limit, getDocs, writeBatch, increment, serverTimestamp, where } from 'firebase/firestore';
import { db } from './config';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import type { Transaction } from './transactions';

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  phone?: string | null;
  role?: 'superadmin' | 'finance' | 'support' | 'user';
  
  wallet: {
    balance: number;
    winnings: number;
  };

  kycStatus: 'Pending' | 'Verified' | 'Rejected';
  isKycVerified: boolean;
  aadhaar?: string;
  pan?: string;
  bankAccount?: string;
  ifsc?: string;
  bankName?: string;
  upiId?: string;
  
  status: 'active' | 'suspended';

  gameStats: {
    played: number;
    won: number;
    lost: number;
  };

  lifetimeStats: {
    totalDeposits: number;
    totalWithdrawals: number;
    totalWinnings: number;
    totalRevenue?: number; // Only for admin roles
  };
  
  referralStats?: {
    referralCode: string;
    referredBy?: string;
    referredCount: number;
    totalEarnings: number;
  };

  agentWallet?: {
    balance: number;
    totalIn: number;
    totalOut: number;
  };

  createdAt: Timestamp;
  lastLogin?: Timestamp;
}

/**
 * Listens for real-time updates on a single user's data.
 * @param uid - The user's unique ID.
 * @param callback - The function to call with the updated user data.
 * @returns An unsubscribe function to stop listening for updates.
 */
export const listenForUser = (uid: string, callback: (user: AppUser | null) => void): (() => void) => {
    const userRef = doc(db, 'users', uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
            callback({ uid, ...docSnap.data() } as AppUser);
        } else {
            callback(null);
        }
    }, (error) => {
        console.error("Error listening to user document:", error);
        callback(null);
    });
    return unsubscribe;
};


/**
 * Listens for real-time updates on all users, with optional role filtering.
 * @param callback - The function to call with the updated users array.
 * @param onError - Optional callback for handling errors.
 * @param role - Optional role to filter users by.
 * @returns An unsubscribe function to stop listening for updates.
 */
export const listenForAllUsers = (
  callback: (users: AppUser[]) => void,
  onError?: (error: Error) => void,
  role?: AppUser['role']
): (() => void) => {
  const usersRef = collection(db, 'users');
  let q = query(usersRef, orderBy('createdAt', 'desc'));

  if (role) {
    q = query(q, where('role', '==', role));
  }

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const users = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as AppUser));
    callback(users);
  }, (error) => {
    console.error("Error listening for users:", error);
    if (onError) onError(error);
  });

  return unsubscribe;
};


/**
 * Fetches a single user's data from Firestore.
 * @param uid - The user's unique ID.
 * @returns A promise that resolves to the AppUser object or null if not found.
 */
export const getUser = async (uid: string): Promise<AppUser | null> => {
  const userRef = doc(db, 'users', uid);
  const docSnap = await getDoc(userRef);
  if (docSnap.exists()) {
    return { uid, ...docSnap.data() } as AppUser;
  }
  return null;
};


/**
 * Updates a user's wallet and creates a transaction log.
 * @param userId - The ID of the user whose wallet is to be updated.
 * @param amount - The amount to add or subtract. Positive for credit, negative for debit.
 * @param walletType - The type of wallet to update ('balance' or 'winnings').
 * @param transactionType - The type of transaction for logging.
 * @param notes - Notes for the transaction.
 * @param relatedId - Optional related document ID (e.g., gameId, depositId).
 */
export const updateUserWallet = async (
    userId: string,
    amount: number,
    walletType: 'balance' | 'winnings' | 'agent',
    transactionType: string,
    notes: string,
    relatedId?: string
): Promise<void> => {
    const userRef = doc(db, 'users', userId);
    const batch = writeBatch(db);

    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) throw new Error("User not found for wallet update.");
    const userData = userDoc.data();
    
    // For regular users
    if (walletType === 'balance' || walletType === 'winnings') {
        const updateField = `wallet.${walletType}`;
        batch.update(userRef, { [updateField]: increment(amount) });

        if (transactionType === 'deposit') {
            batch.update(userRef, { 'lifetimeStats.totalDeposits': increment(Math.abs(amount)) });
        } else if (transactionType === 'winnings') {
             batch.update(userRef, { 'lifetimeStats.totalWinnings': increment(Math.abs(amount)) });
        } else if (transactionType === 'withdrawal') {
             batch.update(userRef, { 'lifetimeStats.totalWithdrawals': increment(Math.abs(amount)) });
        }
    }

    // For agents
    if (walletType === 'agent') {
        batch.update(userRef, { 
            'agentWallet.balance': increment(amount),
            'agentWallet.totalIn': increment(amount > 0 ? amount : 0),
            'agentWallet.totalOut': increment(amount < 0 ? Math.abs(amount) : 0),
         });
    }
    
    // If it's revenue for admin, update admin's lifetime stats
    if (transactionType === 'revenue') {
        batch.update(userRef, { 'lifetimeStats.totalRevenue': increment(amount) });
    }

    // Log the transaction
    const transLogRef = doc(collection(db, 'transactions'));
    batch.set(transLogRef, {
        userId,
        userName: userData.displayName || 'N/A',
        amount: Math.abs(amount),
        type: transactionType,
        status: 'completed',
        notes,
        relatedId: relatedId || null,
        createdAt: serverTimestamp(),
    });

    await batch.commit();
};


// Function to update user's KYC details
export const updateUserKycDetails = async (uid: string, kycData: Partial<AppUser>) => {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    ...kycData,
    kycStatus: 'Pending'
  });
};

// Function to update user's status by an admin
export const updateUserStatus = async (uid: string, status: 'active' | 'suspended') => {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, { status });
};

export const updateUserKycStatus = async (uid: string, kycStatus: 'Verified' | 'Rejected' | 'Pending') => {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
        kycStatus,
        isKycVerified: kycStatus === 'Verified'
    });
};

/**
 * Generates a PDF report for a user's transactions.
 * @param user - The AppUser object.
 * @param transactions - An array of the user's transactions.
 */
export const generateUserReport = async (user: AppUser, transactions: Transaction[]): Promise<void> => {
  const doc = new jsPDF();
  
  doc.setFontSize(20);
  doc.text("User Transaction Report", 14, 22);
  doc.setFontSize(12);
  doc.text(`User: ${user.displayName} (${user.email})`, 14, 32);
  doc.text(`Report Generated: ${new Date().toLocaleDateString()}`, 14, 38);
  
  const tableColumn = ["Date", "Type", "Amount", "Status", "Notes"];
  const tableRows: (string | number)[][] = [];

  transactions.forEach(tx => {
    const txData = [
      tx.createdAt ? new Date(tx.createdAt.toDate()).toLocaleString() : 'N/A',
      tx.type,
      `Rs. ${tx.amount.toFixed(2)}`,
      tx.status,
      tx.notes || tx.relatedId || 'N/A'
    ];
    tableRows.push(txData);
  });

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 50,
  });
  
  doc.save(`${user.displayName}_transaction_report.pdf`);
};
