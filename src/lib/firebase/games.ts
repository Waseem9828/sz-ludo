

import { 
    collection, 
    addDoc, 
    doc, 
    updateDoc, 
    serverTimestamp, 
    query, 
    where, 
    onSnapshot,
    getDoc, 
    deleteDoc,
    runTransaction,
    FieldValue,
    deleteField,
    increment,
    orderBy,
    limit,
    getDocs,
    QueryConstraint,
    Timestamp,
    writeBatch
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './config';
import { AppUser, updateUserWallet } from './users';
import { updateTournamentPoints } from './tournaments';

export interface PlayerInfo {
    uid: string;
    displayName: string | null;
    photoURL: string | null;
    isKycVerified: boolean;
}

export interface Game {
    id: string;
    amount: number;
    status: 'challenge' | 'ongoing' | 'under_review' | 'completed' | 'cancelled' | 'disputed';
    type?: 'user';
    createdBy: PlayerInfo;
    player1: PlayerInfo;
    player2?: PlayerInfo;
    player1_result?: 'WON' | 'LOST' | 'CANCEL';
    player2_result?: 'WON' | 'LOST' | 'CANCEL';
    playerUids: string[];
    roomCode?: string;
    createdAt: any;
    lastUpdatedAt: any;
    winner?: string; // winner uid
    loser?: string; // loser uid
    screenshotUrl?: string;
    message?: string;
}

const GAMES_COLLECTION = 'games';

// Create a new challenge
export const createChallenge = async (data: { amount: number; createdBy: PlayerInfo, message?: string }) => {
    return await addDoc(collection(db, GAMES_COLLECTION), {
        ...data,
        player1: data.createdBy,
        playerUids: [data.createdBy.uid],
        status: 'challenge',
        type: 'user',
        createdAt: serverTimestamp(),
        lastUpdatedAt: serverTimestamp(),
    });
};

// Delete a challenge
export const deleteChallenge = async (gameId: string) => {
    const gameRef = doc(db, GAMES_COLLECTION, gameId);
    
    return await runTransaction(db, async (transaction) => {
        const gameSnap = await transaction.get(gameRef);

        if (!gameSnap.exists() || gameSnap.data().status !== 'challenge') {
            throw new Error("Challenge not found or can no longer be deleted.");
        }
        
        const gameData = gameSnap.data() as Game;
        
        // This transaction will create its own separate transaction log for the refund.
        await updateUserWallet(gameData.createdBy.uid, gameData.amount, 'balance', 'refund', `Challenge Deleted: ${gameId}`);
        
        transaction.delete(gameRef);
    });
};


// Accept a challenge
export const acceptChallenge = async (gameId: string, player2: PlayerInfo) => {
    const gameRef = doc(db, GAMES_COLLECTION, gameId);
    const gameSnap = await getDoc(gameRef);
    if (!gameSnap.exists()) {
        throw new Error("Game not found");
    }
    const gameData = gameSnap.data() as Game;

    return await updateDoc(gameRef, {
        player2: player2,
        playerUids: [...gameData.playerUids, player2.uid],
        status: 'ongoing',
        lastUpdatedAt: serverTimestamp(),
    });
};

// Cancel an accepted challenge before room code is set
export const cancelAcceptedChallenge = async (gameId: string, player2Id: string) => {
    const gameRef = doc(db, GAMES_COLLECTION, gameId);
    
    return await runTransaction(db, async (transaction) => {
        const gameSnap = await transaction.get(gameRef);
        if (!gameSnap.exists()) {
            throw new Error("Game not found.");
        }
        
        const gameData = gameSnap.data() as Game;

        if (gameData.status !== 'ongoing' || gameData.player2?.uid !== player2Id || gameData.roomCode) {
            throw new Error("This game cannot be canceled by you at this stage.");
        }

        await updateUserWallet(player2Id, gameData.amount, 'balance', 'refund', `Accepted Challenge Canceled: ${gameId}`);
        
        transaction.update(gameRef, {
            status: 'challenge',
            playerUids: [gameData.player1.uid],
            player2: deleteField(),
            lastUpdatedAt: serverTimestamp(),
        });
    });
};

// Update game room code
export const updateGameRoomCode = async (gameId: string, roomCode: string) => {
    const gameRef = doc(db, GAMES_COLLECTION, gameId);
    return await updateDoc(gameRef, {
        roomCode: roomCode,
        lastUpdatedAt: serverTimestamp(),
    });
};

// Submit a player's result
export const submitPlayerResult = async (gameId: string, userId: string, result: 'WON' | 'LOST' | 'CANCEL', screenshotFile?: File) => {
    const gameRef = doc(db, GAMES_COLLECTION, gameId);

    return await runTransaction(db, async (transaction) => {
        const gameSnap = await transaction.get(gameRef);
        if (!gameSnap.exists()) throw new Error("Game not found");

        const gameData = gameSnap.data() as Game;
        if (!gameData.player2) throw new Error("Opponent has not joined yet.");
        
        const player1Id = gameData.player1.uid;
        const player2Id = gameData.player2.uid;
        const isPlayer1 = userId === player1Id;

        const myResultField = isPlayer1 ? 'player1_result' : 'player2_result';
        const opponentResultField = isPlayer1 ? 'player2_result' : 'player1_result';
        
        const updateData: any = { 
            lastUpdatedAt: serverTimestamp(),
            [myResultField]: result,
        };

        // Upload screenshot if player won
        if (result === 'WON' && screenshotFile) {
            const screenshotRef = ref(storage, `screenshots/${gameId}/${userId}_${screenshotFile.name}`);
            const uploadResult = await uploadBytes(screenshotRef, screenshotFile);
            updateData.screenshotUrl = await getDownloadURL(uploadResult.ref);
        }
        
        transaction.update(gameRef, updateData);
        
        const opponentResult = gameData[opponentResultField];
        
        // --- Process Outcome if both results are in ---
        if (opponentResult) {
            const p1Result = isPlayer1 ? result : opponentResult;
            const p2Result = isPlayer1 ? opponentResult : result;

            // Case 1: Agreement (Win/Loss)
            if ((p1Result === 'WON' && p2Result === 'LOST') || (p1Result === 'LOST' && p2Result === 'WON')) {
                const winnerId = p1Result === 'WON' ? player1Id : player2Id;
                const loserId = p1Result === 'WON' ? player2Id : player1Id;
                
                transaction.update(gameRef, { status: 'under_review', winner: winnerId, loser: loserId });
                transaction.update(doc(db, 'users', winnerId), { 'gameStats.played': increment(1), 'gameStats.won': increment(1) });
                transaction.update(doc(db, 'users', loserId), { 'gameStats.played': increment(1), 'gameStats.lost': increment(1) });
                
                // Update tournament points for both players
                await updateTournamentPoints(winnerId, gameData.amount);
                await updateTournamentPoints(loserId, gameData.amount);
            }
            // Case 2: Dispute (Both Won)
            else if (p1Result === 'WON' && p2Result === 'WON') {
                transaction.update(gameRef, { status: 'disputed' });
            }
            // Case 3: Cancellation Agreement or one cancels/one loses
            else if (p1Result === 'CANCEL' || p2Result === 'CANCEL') {
                transaction.update(gameRef, { status: 'cancelled' });
                // We will handle refunds in a separate, more robust function or transaction later.
                // For now, just updating status.
                 await updateUserWallet(player1Id, gameData.amount, 'balance', 'refund', `Game Cancelled: ${gameData.id}`);
                 await updateUserWallet(player2Id, gameData.amount, 'balance', 'refund', `Game Cancelled: ${gameData.id}`);
            }
        }
    });
};


// Old updateGameStatus function, might still be used by admin
export const updateGameStatus = async (gameId: string, status: Game['status'], winnerId?: string) => {
    const gameRef = doc(db, GAMES_COLLECTION, gameId);
    
    return await runTransaction(db, async (transaction) => {
        const gameSnap = await transaction.get(gameRef);
        if (!gameSnap.exists()) {
            throw new Error("Game not found to update status");
        }
        const gameData = gameSnap.data() as Game;

        const updateData: { status: Game['status'], winner?: string, loser?: string, lastUpdatedAt: any } = { status, lastUpdatedAt: serverTimestamp() };
        if (winnerId) {
            updateData.winner = winnerId;
            updateData.loser = gameData.playerUids.find(uid => uid !== winnerId);
        }
        
        transaction.update(gameRef, updateData);

        // If game is completed, update tournament points (already handled in submitPlayerResult, but keep as fallback)
        if (status === 'completed' && winnerId) {
            const loserId = gameData.playerUids.find(uid => uid !== winnerId);
            await updateTournamentPoints(winnerId, gameData.amount); 
            if (loserId) {
                await updateTournamentPoints(loserId, gameData.amount);
            }
        }
    });
}

// Get a single game by ID
export const getGameById = async (gameId: string): Promise<Game | null> => {
    const gameRef = doc(db, GAMES_COLLECTION, gameId);
    const docSnap = await getDoc(gameRef);

    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Game;
    } else {
        return null;
    }
}

// Listen for real-time updates on a single game
export const listenForGameUpdates = (
    gameId: string,
    callback: (game: Game | null) => void
) => {
    const gameRef = doc(db, GAMES_COLLECTION, gameId);
    
    const unsubscribe = onSnapshot(gameRef, (docSnap) => {
        if (docSnap.exists()) {
            callback({ id: docSnap.id, ...docSnap.data() } as Game);
        } else {
            callback(null);
        }
    });

    return unsubscribe;
};


// Listen for real-time updates on games, with optional status filtering
export const listenForGames = (
    callback: (games: Game[]) => void, 
    status?: Game['status'],
    onError?: (error: Error) => void
) => {
    const queryConstraints: QueryConstraint[] = [where("type", "==", "user")];
    if (status) {
        queryConstraints.push(where("status", "==", status));
    }
    
    const q = query(collection(db, GAMES_COLLECTION), ...queryConstraints, orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const games: Game[] = [];
        querySnapshot.forEach((doc) => {
            games.push({ id: doc.id, ...doc.data() } as Game);
        });
        
        callback(games);
    }, (error) => {
        console.error("Error listening for games: ", error);
        if (onError) {
            onError(error);
        }
    });

    return unsubscribe;
};

// Listen for a user's recent games
export const listenForUserGames = (
    userId: string,
    limitCount: number,
    callback: (games: Game[]) => void,
    onError?: (error: Error) => void
) => {
    const gamesRef = collection(db, 'games');
    const q = query(gamesRef, where("playerUids", "array-contains", userId), orderBy("createdAt", "desc"), limit(limitCount));

    const unsubscribe = onSnapshot(q, (snap) => {
        const games: Game[] = [];
        snap.docs.forEach(doc => games.push({ id: doc.id, ...doc.data() } as Game));
        callback(games);
    }, (err) => {
        console.error("Error in user games listener: ", err);
        if (onError) onError(err);
    });

    return unsubscribe;
};

// Listen for completed games (for revenue calculation)
export const listenForCompletedGames = (
    callback: (games: Game[]) => void,
    onError?: (error: Error) => void
) => {
    const q = query(collection(db, GAMES_COLLECTION), where("status", "==", "completed"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const games: Game[] = [];
        snapshot.forEach(doc => games.push({ id: doc.id, ...doc.data() } as Game));
        callback(games);
    }, (error) => {
        console.error("Error listening for completed games: ", error);
        if (onError) onError(error);
    });
    return unsubscribe;
}

// Listen for game history (completed, cancelled, disputed)
export const listenForGamesHistory = (
    callback: (games: Game[]) => void,
    onError?: (error: Error) => void
) => {
    const q = query(
        collection(db, GAMES_COLLECTION),
        where("status", "in", ["completed", "cancelled", "disputed"]),
        orderBy("createdAt", "desc")
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const games: Game[] = [];
        querySnapshot.forEach((doc) => {
            games.push({ id: doc.id, ...doc.data() } as Game);
        });
        
        callback(games);
    }, (error) => {
        console.error("Error listening for game history: ", error);
        if (onError) {
            onError(error);
        }
    });

    return unsubscribe;
};


// This function is intended to be run by a Cloud Scheduler periodically
export const applyPenaltyForNoUpdate = async () => {
    console.log('Running penalty check for battles not updated in 2 hours...');
    const twoHoursAgo = Timestamp.fromMillis(Date.now() - 2 * 60 * 60 * 1000);

    const q = query(
        collection(db, 'games'),
        where('status', '==', 'ongoing'),
        where('lastUpdatedAt', '<', twoHoursAgo)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        console.log('No battles found for penalty.');
        return;
    }

    const batch = writeBatch(db);
    let penaltyCount = 0;

    for (const doc of snapshot.docs) {
        const game = doc.data() as Game;
        const player1Id = game.player1.uid;
        const player2Id = game.player2?.uid;

        if (!player1Id || !player2Id) continue;

        // Mark game as cancelled
        batch.update(doc.ref, { status: 'cancelled' });

        // Apply penalty to both players
        // These calls will create transactions internally
        await updateUserWallet(player1Id, -50, 'balance', 'penalty', `No update on battle ${game.id}`);
        await updateUserWallet(player2Id, -50, 'balance', 'penalty', `No update on battle ${game.id}`);
        
        penaltyCount += 2;
    }

    await batch.commit();
    console.log(`Penalty applied to ${penaltyCount} players in ${snapshot.size} battles.`);
};

// Admin: Delete old game records
export const deleteOldGameRecords = async (): Promise<number> => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const timestamp = Timestamp.fromDate(thirtyDaysAgo);

    const gamesRef = collection(db, 'games');
    const q = query(
        gamesRef,
        where('status', 'in', ['completed', 'cancelled', 'disputed']),
        where('createdAt', '<=', timestamp)
    );

    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
        return 0;
    }

    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });

    await batch.commit();

    return snapshot.size;
}
