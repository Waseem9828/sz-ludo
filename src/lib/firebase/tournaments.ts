

import {
    collection,
    addDoc,
    doc,
    updateDoc,
    serverTimestamp,
    query,
    onSnapshot,
    orderBy,
    Timestamp,
    where,
    QueryConstraint,
    runTransaction,
    arrayUnion,
    increment
} from 'firebase/firestore';
import { db } from './config';
import type { AppUser } from './users';
import { createTransaction } from './transactions';

export interface PrizeDistribution {
  rankStart: number;
  rankEnd: number;
  percentage: number;
}

export interface Tournament {
  id: string;
  title: string;
  entryFee: number;
  playerCap: number;
  adminCommission: number; // e.g., 10 for 10%
  prizeDistribution: PrizeDistribution[];
  players: string[]; // Array of user UIDs
  status: 'upcoming' | 'live' | 'completed' | 'cancelled';
  startTime: Timestamp;
  createdAt: Timestamp;
  prizePool: number;
}

const TOURNAMENTS_COLLECTION = 'tournaments';

// Admin: Create a new tournament
export const createTournament = async (data: Omit<Tournament, 'id' | 'players' | 'status' | 'createdAt' | 'prizePool' | 'startTime'> & { startTime: Date }) => {
    const prizePool = 0;

    return await addDoc(collection(db, TOURNAMENTS_COLLECTION), {
        ...data,
        startTime: Timestamp.fromDate(data.startTime),
        players: [],
        status: 'upcoming',
        prizePool: prizePool,
        createdAt: serverTimestamp(),
    });
};

// User: Join a tournament
export const joinTournament = async (tournamentId: string, userId: string) => {
    const tournamentRef = doc(db, TOURNAMENTS_COLLECTION, tournamentId);
    const userRef = doc(db, 'users', userId);

    return await runTransaction(db, async (transaction) => {
        const tSnap = await transaction.get(tournamentRef);
        const uSnap = await transaction.get(userRef);

        if (!tSnap.exists()) {
            throw new Error("Tournament not found.");
        }
        if (!uSnap.exists()) {
            throw new Error("User not found.");
        }

        const tournament = tSnap.data() as Tournament;
        const user = uSnap.data() as AppUser;

        // --- Validation Checks ---
        if (tournament.status !== 'upcoming') {
            throw new Error("This tournament is no longer open for joining.");
        }
        if ((tournament.players || []).includes(userId)) {
            throw new Error("You have already joined this tournament.");
        }
        if ((tournament.players || []).length >= tournament.playerCap) {
            throw new Error("This tournament is full.");
        }
        const totalBalance = (user.wallet?.balance || 0) + (user.wallet?.winnings || 0);
        if (totalBalance < tournament.entryFee) {
            throw new Error("Insufficient balance to join.");
        }

        // --- Database Updates ---
        // 1. Deduct entry fee from user's wallet
        const newBalance = (user.wallet?.balance || 0) - tournament.entryFee;
        if(newBalance < 0){
             const remainingDeduction = Math.abs(newBalance);
             const newWinnings = (user.wallet?.winnings || 0) - remainingDeduction;
             transaction.update(userRef, { 'wallet.balance': 0, 'wallet.winnings': newWinnings });
        } else {
            transaction.update(userRef, { 'wallet.balance': newBalance });
        }

        // 2. Add user to the tournament's players list and update prize pool
        transaction.update(tournamentRef, {
            players: arrayUnion(userId),
            prizePool: increment(tournament.entryFee)
        });

        // 3. Create a transaction log
        const transRef = doc(collection(db, 'transactions'));
        transaction.set(transRef, {
            userId,
            userName: user.displayName,
            amount: tournament.entryFee,
            type: 'game_fee',
            status: 'completed',
            notes: `Joined tournament: ${tournament.title}`,
            relatedId: tournamentId,
            createdAt: serverTimestamp(),
        });
    });
};


// Admin: Update tournament details
export const updateTournament = async (id: string, data: Partial<Tournament>) => {
    const tournamentRef = doc(db, TOURNAMENTS_COLLECTION, id);
    return await updateDoc(tournamentRef, data);
};

// Listen for tournaments
export const listenForTournaments = (
    callback: (tournaments: Tournament[]) => void,
    onError: (error: Error) => void,
    status?: Tournament['status'][]
) => {
    const constraints: QueryConstraint[] = [orderBy('startTime', 'asc')];
    if (status && status.length > 0) {
        constraints.push(where('status', 'in', status));
    }
    
    const q = query(collection(db, TOURNAMENTS_COLLECTION), ...constraints);

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const tournaments: Tournament[] = [];
        snapshot.forEach((doc) => {
            tournaments.push({ id: doc.id, ...doc.data() } as Tournament);
        });
        callback(tournaments);
    }, onError);

    return unsubscribe;
};

// Listen for a single tournament
export const listenForTournament = (
    tournamentId: string,
    callback: (tournament: Tournament | null) => void,
    onError: (error: Error) => void,
) => {
    const tournamentRef = doc(db, TOURNAMENTS_COLLECTION, tournamentId);
    const unsubscribe = onSnapshot(tournamentRef, (doc) => {
        if (doc.exists()) {
            callback({ id: doc.id, ...doc.data() } as Tournament);
        } else {
            callback(null);
        }
    }, onError);
    return unsubscribe;
};
