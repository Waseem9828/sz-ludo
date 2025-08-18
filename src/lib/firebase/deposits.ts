
'use client';

import {
  collection,
  query,
  where,
  onSnapshot,
  Timestamp,
  orderBy,
  limit,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './config';
import type { AppUser } from './users';

export interface DepositRequest {
    id: string;
    userId: string;
    userName: string;
    amount: number;
    utr: string;
    upiId: string;
    screenshotUrl: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: Timestamp;
}

/**
 * Creates a new manual deposit request for review.
 * @param data - The deposit request data.
 * @returns A promise that resolves when the request is created.
 */
export const createDepositRequest = async (data: {
    userId: string;
    userName: string;
    amount: number;
    upiId: string;
    utr: string;
    screenshotFile: File;
}) => {
    // 1. Upload screenshot
    const screenshotRef = ref(storage, `deposits/${data.userId}/${Date.now()}-${data.screenshotFile.name}`);
    const snapshot = await uploadBytes(screenshotRef, data.screenshotFile);
    const screenshotUrl = await getDownloadURL(snapshot.ref);

    // 2. Create deposit request document
    const requestsRef = collection(db, 'deposits');
    await addDoc(requestsRef, {
        ...data,
        screenshotUrl,
        status: 'pending',
        createdAt: serverTimestamp(),
    });
};

/**
 * Listens for all deposit requests for the admin panel.
 * @param callback - The function to call with the updated requests array.
 * @param onError - Optional callback for handling errors.
 * @returns An unsubscribe function to stop listening for updates.
 */
export const listenForDepositRequests = (
  callback: (requests: DepositRequest[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const requestsRef = collection(db, 'deposits');
  const q = query(requestsRef, orderBy('createdAt', 'desc'));

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DepositRequest));
    callback(requests);
  }, (error) => {
    console.error("Error listening for deposit requests:", error);
    if (onError) onError(error);
  });

  return unsubscribe;
};

/**
 * Updates the status of a deposit request.
 * @param requestId - The ID of the deposit request to update.
 * @param status - The new status.
 */
export const updateDepositStatus = async (requestId: string, status: 'approved' | 'rejected'): Promise<void> => {
    const requestRef = doc(db, 'deposits', requestId);
    await updateDoc(requestRef, { status });
};
