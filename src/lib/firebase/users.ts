
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
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
