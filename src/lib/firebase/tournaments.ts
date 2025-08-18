
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
  getDocs,
  addDoc,
  serverTimestamp,
  deleteDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './config';
import { AppUser, updateUserWallet } from './users';

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
  statuses?: Tournament['status'][]
): (() => void) => {
  const tournamentsRef = collection(db, 'tournaments');
  let q = query(tournamentsRef, orderBy('startTime', 'asc'));

  if (statuses && statuses.length > 0) {
    q = query(q, where('status', 'in', statuses));
  }

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
    
    if ((user.wallet?.winnings || 0) >= tournament.entryFee) {
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
        createdAt: serverTimestamp()
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

export async function createTournament(data: Omit<Tournament, 'id' | 'createdAt' | 'prizePool' | 'players' | 'leaderboard' | 'status'>): Promise<void> {
    const tournamentRef = collection(db, 'tournaments');
    await addDoc(tournamentRef, {
        ...data,
        status: 'upcoming',
        prizePool: 0,
        players: [],
        leaderboard: [],
        createdAt: serverTimestamp(),
    });
}

export async function getTournament(id: string): Promise<Tournament | null> {
    const docRef = doc(db, 'tournaments', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Tournament;
    }
    return null;
}

export async function updateTournament(id: string, data: Partial<Omit<Tournament, 'id'>>): Promise<void> {
    const docRef = doc(db, 'tournaments', id);
    await updateDoc(docRef, data);
}

export async function deleteTournament(tournamentId: string): Promise<void> {
    const batch = writeBatch(db);
    const tournamentRef = doc(db, 'tournaments', tournamentId);
    const tournamentDoc = await getDoc(tournamentRef);

    if (!tournamentDoc.exists()) throw new Error("Tournament not found.");
    const tournament = tournamentDoc.data() as Tournament;

    // Refund players
    for (const userId of tournament.players) {
        const userRef = doc(db, 'users', userId);
        batch.update(userRef, { 'wallet.balance': increment(tournament.entryFee) });

        const transactionRef = doc(collection(db, 'transactions'));
        batch.set(transactionRef, {
            userId: userId,
            userName: 'N/A', // We can fetch name, but for simplicity we skip
            amount: tournament.entryFee,
            type: 'refund',
            status: 'completed',
            notes: `Tournament cancelled: ${tournament.title}`,
            relatedId: tournamentId,
            createdAt: serverTimestamp()
        });
    }

    // Delete the tournament document
    batch.delete(tournamentRef);

    await batch.commit();
}


export async function distributeTournamentPrizes(tournamentId: string): Promise<void> {
    const batch = writeBatch(db);
    const tournamentRef = doc(db, 'tournaments', tournamentId);
    const tournamentDoc = await getDoc(tournamentRef);

    if (!tournamentDoc.exists()) throw new Error("Tournament not found.");
    const tournament = tournamentDoc.data() as Tournament;

    if (tournament.status === 'completed') throw new Error("Prizes have already been distributed.");
    if (new Date() < tournament.endTime.toDate()) throw new Error("Tournament has not ended yet.");
    
    const prizePoolAfterCommission = tournament.prizePool * (1 - (tournament.adminCommission / 100));

    const sortedLeaderboard = tournament.leaderboard.sort((a, b) => b.points - a.points);
    
    let distributedAmount = 0;

    for (const dist of tournament.prizeDistribution) {
        for (let rank = dist.rankStart; rank <= dist.rankEnd; rank++) {
            const winnerIndex = rank - 1;
            if (winnerIndex >= sortedLeaderboard.length) continue;

            const winner = sortedLeaderboard[winnerIndex];
            const totalWinnersInRange = Math.max(0, dist.rankEnd - dist.rankStart + 1);
            
            if (totalWinnersInRange > 0) {
                 const prizeAmount = (prizePoolAfterCommission * (dist.percentage / 100)) / totalWinnersInRange;
                 distributedAmount += prizeAmount;

                 if (prizeAmount > 0) {
                    const userRef = doc(db, 'users', winner.uid);
                    batch.update(userRef, { 'wallet.winnings': increment(prizeAmount) });

                    const transactionRef = doc(collection(db, 'transactions'));
                    batch.set(transactionRef, {
                        userId: winner.uid,
                        userName: winner.displayName,
                        amount: prizeAmount,
                        type: 'winnings',
                        status: 'completed',
                        notes: `Tournament Prize: ${tournament.title} - Rank #${rank}`,
                        relatedId: tournamentId,
                        createdAt: serverTimestamp()
                    });
                 }
            }
        }
    }
    
    // Give commission to admin
    const adminId = 'PUT_YOUR_SUPERADMIN_UID_HERE'; // Replace with actual superadmin UID
    const commissionAmount = tournament.prizePool * (tournament.adminCommission / 100);
    if (commissionAmount > 0 && adminId !== 'PUT_YOUR_SUPERADMIN_UID_HERE') {
        updateUserWallet(adminId, commissionAmount, 'balance', 'revenue', `Commission from ${tournament.title}`);
    }

    batch.update(tournamentRef, { status: 'completed' });
    await batch.commit();
}


export async function uploadTournamentImage(file: File): Promise<string> {
   if (!file) throw new Error('No file provided for upload.');
   const storageRef = ref(storage, `tournaments/${Date.now()}_${file.name}`);
   const snapshot = await uploadBytes(storageRef, file);
   const downloadURL = await getDownloadURL(snapshot.ref);
   return downloadURL;
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
