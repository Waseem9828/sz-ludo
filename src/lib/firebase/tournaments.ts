
'use client';

import {
  collection,
  query,
  where,
  onSnapshot,
  Timestamp,
  orderBy,
  doc,
  writeBatch,
  getDoc,
  updateDoc,
  arrayUnion,
  increment,
  getDocs
} from 'firebase/firestore';
import { db } from './config';
import { AppUser } from './users';

export interface LeaderboardPlayer {
    uid: string;
    displayName: string;
    photoURL?: string | null;
    points: number;
}

export interface PrizeDistribution {
    rankStart: number;
    rankEnd: number;
    percentage: number;
}

export interface Tournament {
    id: string;
    title: string;
    imageUrl: string;
    entryFee: number;
    playerCap: number;
    adminCommission: number;
    prizePool: number;
    status: 'upcoming' | 'live' | 'completed' | 'cancelled';
    startTime: Timestamp;
    endTime: Timestamp;
    createdAt: Timestamp;
    players: string[];
    leaderboard: LeaderboardPlayer[];
    prizeDistribution: PrizeDistribution[];
}


/**
 * Listens for real-time updates on tournaments.
 * @param callback The function to call with the updated tournaments array.
 * @param onError Optional callback for handling errors.
 * @param statuses The statuses of the tournaments to listen for.
 * @returns An unsubscribe function to stop listening for updates.
 */
export const listenForTournaments = (
  callback: (tournaments: Tournament[]) => void,
  onError?: (error: Error) => void,
  statuses: Tournament['status'][] = ['upcoming', 'live']
): (() => void) => {
  const tournamentsRef = collection(db, 'tournaments');
  const q = query(
    tournamentsRef,
    where('status', 'in', statuses),
    orderBy('startTime', 'asc')
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const tournaments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tournament));
    callback(tournaments);
  }, (error) => {
    console.error("Error listening for tournaments:", error);
    if (onError) {
      onError(error);
    }
  });

  return unsubscribe;
};

/**
 * Allows a user to join a tournament.
 * @param tournamentId The ID of the tournament to join.
 * @param userId The ID of the user joining.
 */
export const joinTournament = async (tournamentId: string, userId: string): Promise<void> => {
    const batch = writeBatch(db);
    const tournamentRef = doc(db, 'tournaments', tournamentId);
    const userRef = doc(db, 'users', userId);

    const [tournamentDoc, userDoc] = await Promise.all([
        getDoc(tournamentRef),
        getDoc(userRef)
    ]);

    if (!tournamentDoc.exists()) throw new Error("Tournament not found.");
    if (!userDoc.exists()) throw new Error("User not found.");

    const tournament = tournamentDoc.data() as Tournament;
    const user = userDoc.data() as AppUser;
    
    // Validations
    if (tournament.status !== 'upcoming') throw new Error("This tournament is not open for registration.");
    if (tournament.players.length >= tournament.playerCap) throw new Error("This tournament is already full.");
    if (tournament.players.includes(userId)) throw new Error("You have already joined this tournament.");
    
    const totalBalance = (user.wallet?.balance || 0) + (user.wallet?.winnings || 0);
    if (totalBalance < tournament.entryFee) throw new Error("Insufficient balance to join.");

    // Determine which wallet to deduct from (winnings first, then balance)
    let winningsDeducted = 0;
    let balanceDeducted = 0;
    
    if (user.wallet.winnings >= tournament.entryFee) {
        winningsDeducted = tournament.entryFee;
    } else {
        winningsDeducted = user.wallet.winnings;
        balanceDeducted = tournament.entryFee - winningsDeducted;
    }

    // Update user's wallet
    batch.update(userRef, {
        'wallet.winnings': increment(-winningsDeducted),
        'wallet.balance': increment(-balanceDeducted)
    });

    // Update tournament data
    batch.update(tournamentRef, {
        players: arrayUnion(userId),
        prizePool: increment(tournament.entryFee)
    });
    
    // Create a transaction log
    const transactionRef = doc(collection(db, 'transactions'));
    batch.set(transactionRef, {
        userId: userId,
        userName: user.displayName,
        amount: tournament.entryFee,
        type: 'Tournament Entry',
        status: 'completed',
        notes: `Joined tournament: ${tournament.title}`,
        relatedId: tournamentId,
        createdAt: Timestamp.now()
    });
    
    await batch.commit();
};


export const hasJoinedLiveTournament = async (userId: string): Promise<boolean> => {
    const tournamentsRef = collection(db, 'tournaments');
    const q = query(
        tournamentsRef,
        where('status', '==', 'live'),
        where('players', 'array-contains', userId)
    );

    const snapshot = await getDocs(q);
    return !snapshot.empty;
}

// Admin functions to be added later: createTournament, updateTournament, deleteTournament, distributeTournamentPrizes

export async function createTournament(tournamentData: Omit<Tournament, 'id' | 'createdAt' | 'prizePool' | 'players' | 'leaderboard'>): Promise<void> {
    // This is a placeholder for the full implementation
}

export async function getTournament(id: string): Promise<Tournament | null> {
    const docRef = doc(db, 'tournaments', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Tournament;
    }
    return null;
}

export async function updateTournament(id: string, data: Partial<Tournament>): Promise<void> {
    const docRef = doc(db, 'tournaments', id);
    await updateDoc(docRef, data);
}

export async function deleteTournament(id: string): Promise<void> {
    const docRef = doc(db, 'tournaments', id);
    await updateDoc(docRef, { status: 'cancelled' });
    // Refunding logic should be handled by a cloud function for security
}

export async function distributeTournamentPrizes(id: string): Promise<void> {
    // This should ideally be a cloud function to prevent manipulation
}

export async function uploadTournamentImage(file: File): Promise<string> {
    // Placeholder for image upload logic
    return "https://placehold.co/400x300.png";
}

export const listenForTournament = (
    id: string,
    callback: (data: Tournament | null) => void,
    onError?: (error: Error) => void
): (() => void) => {
    const docRef = doc(db, 'tournaments', id);
    return onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            callback({ id: docSnap.id, ...docSnap.data() } as Tournament);
        } else {
            callback(null);
        }
    }, (error) => {
        console.error("Error listening to tournament:", error);
        if (onError) onError(error);
    });
};

