
'use client';

import {
  collection,
  query,
  where,
  onSnapshot,
  Timestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from './config';

export interface Player {
    uid: string;
    displayName: string;
    photoURL: string;
    isKycVerified: boolean;
}

export interface Game {
    id: string;
    amount: number;
    createdBy: Player;
    status: 'challenge' | 'ongoing' | 'under_review' | 'completed' | 'cancelled' | 'disputed';
    player1: Player;
    player2?: Player;
    playerUids: string[];
    winner?: string | null;
    loser?: string | null;
    roomCode?: string;
    screenshotUrl?: string;
    player1_result?: 'WON' | 'LOST' | 'CANCEL';
    player2_result?: 'WON' | 'LOST' | 'CANCEL';
    createdAt: Timestamp;
    lastUpdatedAt: Timestamp;
    message?: string;
}

/**
 * Listens for real-time updates on games based on their status.
 * @param callback - The function to call with the updated games array.
 * @param status - The status of the games to listen for.
 * @param onError - Optional callback for handling errors.
 * @returns An unsubscribe function to stop listening for updates.
 */
export const listenForGames = (
  callback: (games: Game[]) => void,
  status: Game['status'],
  onError?: (error: Error) => void
): (() => void) => {
  const gamesRef = collection(db, 'games');
  const q = query(
    gamesRef, 
    where('status', '==', status), 
    orderBy('createdAt', 'desc')
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const games = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Game));
    callback(games);
  }, (error) => {
    console.error(`Error listening for ${status} games:`, error);
    if (onError) {
      onError(error);
    }
  });

  return unsubscribe;
};
