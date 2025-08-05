
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
    QueryConstraint
} from 'firebase/firestore';
import { db } from './config';

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
    // Calculate initial prize pool (it will update as players join)
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

// More functions will be needed:
// - joinTournament(tournamentId, userId)
// - submitMatchResult(tournamentId, matchId, userId, score)
// - endTournament(tournamentId)
// etc.
