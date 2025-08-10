

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
    increment,
    deleteDoc,
    getDoc,
    writeBatch,
    getDocs
} from 'firebase/firestore';
import { db } from './config';
import type { AppUser } from './users';
import { createTransaction } from './transactions';
import { updateUserWallet, getUser } from './users';


export interface PrizeDistribution {
  rankStart: number;
  rankEnd: number;
  percentage: number;
}

export interface LeaderboardPlayer {
    uid: string;
    displayName: string;
    photoURL: string;
    points: number;
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
  endTime: Timestamp;
  createdAt: Timestamp;
  prizePool: number;
  leaderboard: LeaderboardPlayer[];
}

const TOURNAMENTS_COLLECTION = 'tournaments ';

// Admin: Create a new tournament
export const createTournament = async (data: Omit<Tournament, 'id' | 'players' | 'status' | 'createdAt' | 'prizePool' | 'leaderboard' | 'startTime' | 'endTime'> & { startTime: Date, endTime: Date }) => {
    const prizePool = 0;

    return await addDoc(collection(db, TOURNAMENTS_COLLECTION), {
        ...data,
        startTime: Timestamp.fromDate(data.startTime),
        endTime: Timestamp.fromDate(data.endTime),
        players: [],
        status: 'upcoming',
        prizePool: prizePool,
        leaderboard: [],
        createdAt: serverTimestamp(),
    });
};

// Admin: Delete a tournament
export const deleteTournament = async (tournamentId: string) => {
    const tournamentRef = doc(db, TOURNAMENTS_COLLECTION, tournamentId);
    
    await runTransaction(db, async (transaction) => {
        const tSnap = await transaction.get(tournamentRef);
        if (!tSnap.exists()) {
            throw new Error("Tournament not found.");
        }
        const tournament = tSnap.data() as Tournament;

        // Refund all players
        if (tournament.players && tournament.players.length > 0) {
            const refundPromises = tournament.players.map(playerId => 
                updateUserWallet(playerId, tournament.entryFee, 'balance', 'refund', `Tournament Canceled: ${tournament.title}`)
            );
            await Promise.all(refundPromises);
        }

        // Delete the tournament
        transaction.delete(tournamentRef);
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

        // 2. Add user to the tournament's players list and update prize pool and leaderboard
        const newLeaderboardPlayer: LeaderboardPlayer = {
            uid: userId,
            displayName: user.displayName || 'N/A',
            photoURL: user.photoURL || '',
            points: 0,
        };

        transaction.update(tournamentRef, {
            players: arrayUnion(userId),
            prizePool: increment(tournament.entryFee),
            leaderboard: arrayUnion(newLeaderboardPlayer),
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

export const updateTournamentPoints = async (userId: string, points: number) => {
    const tournamentsRef = collection(db, TOURNAMENTS_COLLECTION);
    const q = query(tournamentsRef, where('status', '==', 'live'), where('players', 'array-contains', userId));

    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return false; // User is not in any live tournament
    }

    const batch = writeBatch(db);
    let updated = false;
    for (const doc of snapshot.docs) {
        const tournament = doc.data() as Tournament;
        const playerIndex = tournament.leaderboard.findIndex(p => p.uid === userId);

        if (playerIndex !== -1) {
            const newLeaderboard = [...tournament.leaderboard];
            newLeaderboard[playerIndex].points += points;
            batch.update(doc.ref, { leaderboard: newLeaderboard });
            updated = true;
        }
    }
    if (updated) {
        await batch.commit();
    }
    return updated; // Return true if points were updated for at least one tournament
}


// Admin: Update tournament details
export const updateTournament = async (id: string, data: Partial<Omit<Tournament, 'id' | 'startTime' | 'endTime'> & { startTime?: Date, endTime?: Date }>) => {
    const tournamentRef = doc(db, TOURNAMENTS_COLLECTION, id);
    
    const updateData: { [key: string]: any } = { ...data };
    if (data.startTime) {
        updateData.startTime = Timestamp.fromDate(data.startTime);
    }
     if (data.endTime) {
        updateData.endTime = Timestamp.fromDate(data.endTime);
    }
    
    return await updateDoc(tournamentRef, updateData);
};

// Admin: Get a single tournament for editing
export const getTournament = async (id: string): Promise<Tournament | null> => {
    const docRef = doc(db, TOURNAMENTS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Tournament;
    }
    return null;
}

// Listen for tournaments
export const listenForTournaments = (
    callback: (tournaments: Tournament[]) => void,
    onError: (error: Error) => void,
    status?: Tournament['status'][]
) => {
    const constraints: QueryConstraint[] = [];
    if (status && status.length > 0) {
        // Firestore requires that if you use an 'in' filter, you must also order by that field first.
        constraints.push(where('status', 'in', status));
        constraints.push(orderBy('status', 'asc')); // Order by status first
    }
    constraints.push(orderBy('startTime', 'asc')); // Then order by startTime
    
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

// Check if a user has joined any live tournament
export const hasJoinedLiveTournament = async (userId: string): Promise<boolean> => {
    const tournamentsRef = collection(db, TOURNAMENTS_COLLECTION);
    const q = query(
        tournamentsRef,
        where('status', '==', 'live'),
        where('players', 'array-contains', userId)
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
};
