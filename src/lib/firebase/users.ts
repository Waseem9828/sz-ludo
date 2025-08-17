
import { doc, updateDoc, Timestamp, getDoc, onSnapshot, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from './config';

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
 * Listens for real-time updates on all users.
 * @param callback - The function to call with the updated users array.
 * @param onError - Optional callback for handling errors.
 * @returns An unsubscribe function to stop listening for updates.
 */
export const listenForAllUsers = (
  callback: (users: AppUser[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, orderBy('createdAt', 'desc'));

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const users = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as AppUser));
    callback(users);
  }, (error) => {
    console.error("Error listening for all users:", error);
    if (onError) {
      onError(error);
    }
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
