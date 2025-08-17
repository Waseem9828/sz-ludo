
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
  getDoc,
  updateDoc,
  deleteDoc,
  runTransaction,
  writeBatch,
  arrayUnion,
  increment,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './config';
import type { AppUser } from './users';

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


export const createChallenge = async (data: { amount: number; createdBy: Player; message?: string }): Promise<any> => {
  const { amount, createdBy, message } = data;

  return await runTransaction(db, async (transaction) => {
    const userRef = doc(db, 'users', createdBy.uid);
    const userDoc = await transaction.get(userRef);

    if (!userDoc.exists()) {
      throw new Error("User does not exist.");
    }

    const appUser = userDoc.data() as AppUser;
    const totalBalance = (appUser.wallet.balance || 0) + (appUser.wallet.winnings || 0);

    if (totalBalance < amount) {
      throw new Error("Insufficient balance.");
    }

    // Deduct from winnings first, then balance
    let winningsDeducted = 0;
    let balanceDeducted = 0;
    if ((appUser.wallet.winnings || 0) >= amount) {
      winningsDeducted = amount;
    } else {
      winningsDeducted = appUser.wallet.winnings || 0;
      balanceDeducted = amount - winningsDeducted;
    }

    transaction.update(userRef, {
      'wallet.winnings': increment(-winningsDeducted),
      'wallet.balance': increment(-balanceDeducted),
    });

    // Create the game
    const newGameRef = doc(collection(db, "games"));
    transaction.set(newGameRef, {
      amount,
      createdBy,
      player1: createdBy,
      playerUids: [createdBy.uid],
      status: 'challenge',
      createdAt: Timestamp.now(),
      lastUpdatedAt: Timestamp.now(),
      message: message || '',
    });
    
     // Log the transaction
    const transLogRef = doc(collection(db, 'transactions'));
    transaction.set(transLogRef, {
        userId: createdBy.uid,
        userName: createdBy.displayName,
        amount,
        type: 'Challenge Created',
        status: 'on_hold',
        notes: `Battle created: ${newGameRef.id}`,
        relatedId: newGameRef.id,
        createdAt: Timestamp.now(),
    });

    return newGameRef;
  });
};

export const acceptChallenge = async (challengeId: string, player2: Player): Promise<string> => {
    return runTransaction(db, async (transaction) => {
        const gameRef = doc(db, "games", challengeId);
        const player2Ref = doc(db, "users", player2.uid);
        
        const [gameDoc, player2Doc] = await Promise.all([
            transaction.get(gameRef),
            transaction.get(player2Ref)
        ]);
        
        if (!gameDoc.exists()) throw new Error("Challenge not found or already accepted.");
        if (!player2Doc.exists()) throw new Error("Accepting player not found.");

        const game = gameDoc.data();
        const appUser = player2Doc.data() as AppUser;

        const totalBalance = (appUser.wallet.balance || 0) + (appUser.wallet.winnings || 0);
        if (totalBalance < game.amount) throw new Error("Insufficient balance.");

        let winningsDeducted = 0;
        let balanceDeducted = 0;
        if ((appUser.wallet.winnings || 0) >= game.amount) {
            winningsDeducted = game.amount;
        } else {
            winningsDeducted = appUser.wallet.winnings || 0;
            balanceDeducted = game.amount - winningsDeducted;
        }

        transaction.update(player2Ref, {
            'wallet.winnings': increment(-winningsDeducted),
            'wallet.balance': increment(-balanceDeducted)
        });

        transaction.update(gameRef, {
            status: 'ongoing',
            player2: player2,
            playerUids: arrayUnion(player2.uid),
            lastUpdatedAt: Timestamp.now(),
        });
        
        const transLogRef = doc(collection(db, 'transactions'));
        transaction.set(transLogRef, {
            userId: player2.uid,
            userName: player2.displayName,
            amount: game.amount,
            type: 'Challenge Accepted',
            status: 'on_hold',
            notes: `Accepted battle: ${gameDoc.id}`,
            relatedId: gameDoc.id,
            createdAt: Timestamp.now(),
        });
        
        return gameDoc.id;
    });
};


export const deleteChallenge = async (challengeId: string): Promise<void> => {
    const gameRef = doc(db, "games", challengeId);
    
    await runTransaction(db, async (transaction) => {
        const gameDoc = await transaction.get(gameRef);
        if (!gameDoc.exists()) throw new Error("Challenge not found.");

        const game = gameDoc.data();
        if (game.status !== 'challenge') throw new Error("This is not an open challenge.");

        const userRef = doc(db, "users", game.createdBy.uid);
        
        // Refund the amount to balance
        transaction.update(userRef, {
            'wallet.balance': increment(game.amount)
        });

        // Delete the game document
        transaction.delete(gameRef);
        
        // Mark the transaction log as refunded
        const transQuery = query(collection(db, "transactions"), where("relatedId", "==", challengeId));
        const transDocs = await getDocs(transQuery);
        transDocs.forEach(doc => {
            transaction.update(doc.ref, { status: "refunded", notes: "Challenge deleted by user" });
        });
    });
};

export const updateGameRoomCode = async (gameId: string, roomCode: string): Promise<void> => {
    const gameRef = doc(db, 'games', gameId);
    await updateDoc(gameRef, {
        roomCode,
        lastUpdatedAt: Timestamp.now(),
    });
};


export const listenForGameUpdates = (gameId: string, callback: (game: Game | null) => void): (() => void) => {
    const gameRef = doc(db, 'games', gameId);
    return onSnapshot(gameRef, (docSnap) => {
        if (docSnap.exists()) {
            callback({ id: docSnap.id, ...docSnap.data() } as Game);
        } else {
            callback(null);
        }
    });
};


export const submitPlayerResult = async (gameId: string, playerId: string, result: 'WON' | 'LOST' | 'CANCEL', screenshot?: File): Promise<void> => {
    let screenshotUrl = '';
    if (screenshot) {
        const screenshotRef = ref(storage, `screenshots/${gameId}/${playerId}-${Date.now()}`);
        await uploadBytes(screenshotRef, screenshot);
        screenshotUrl = await getDownloadURL(screenshotRef);
    }
    
    const gameRef = doc(db, 'games', gameId);

    await runTransaction(db, async (transaction) => {
        const gameDoc = await transaction.get(gameRef);
        if (!gameDoc.exists()) throw new Error('Game not found');

        const gameData = gameDoc.data() as Game;

        const playerField = gameData.player1.uid === playerId ? 'player1_result' : 'player2_result';
        const opponentField = gameData.player1.uid !== playerId ? 'player1_result' : 'player2_result';
        
        const updateData: any = {
            [playerField]: result,
            lastUpdatedAt: Timestamp.now(),
        };

        if (result === 'WON' && screenshotUrl) {
            updateData.screenshotUrl = screenshotUrl;
            updateData.winner = playerId; // Tentatively set winner
        }

        // Apply the player's result
        transaction.update(gameRef, updateData);
        
        const opponentResult = gameData[opponentField as keyof Game];

        // Logic to determine new game status
        if (result === 'CANCEL') {
            if (opponentResult === 'CANCEL') {
                transaction.update(gameRef, { status: 'cancelled' });
            } else {
                 // First to cancel, wait for opponent
            }
        } else if (result === 'WON') {
            if (opponentResult === 'LOST') {
                transaction.update(gameRef, { status: 'under_review', winner: playerId, loser: gameData.player1.uid === playerId ? gameData.player2!.uid : gameData.player1.uid });
            } else if (opponentResult === 'WON') {
                transaction.update(gameRef, { status: 'disputed' });
            } else {
                 // Wait for opponent
            }
        } else if (result === 'LOST') {
            if (opponentResult === 'WON') {
                 transaction.update(gameRef, { status: 'under_review', winner: gameData.player1.uid !== playerId ? gameData.player1.uid : gameData.player2!.uid, loser: playerId });
            } else if (opponentResult === 'LOST') {
                 transaction.update(gameRef, { status: 'disputed' }); // Both lost? Dispute.
            } else {
                // Wait for opponent
            }
        }
    });
};


// For admin panel
export const listenForGamesHistory = (
    callback: (games: Game[]) => void,
    onError?: (error: Error) => void
): (() => void) => {
  const gamesRef = collection(db, 'games');
  const q = query(
      gamesRef, 
      where('status', 'in', ['completed', 'cancelled', 'disputed']), 
      orderBy('createdAt', 'desc'),
      limit(50) // Limit to last 50 for performance
    );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const games = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Game));
    callback(games);
  }, (error) => {
    console.error(`Error listening for game history:`, error);
    if (onError) onError(error);
  });

  return unsubscribe;
};

// For admin panel
export const updateGameStatus = async (gameId: string, status: Game['status']): Promise<void> => {
    const gameRef = doc(db, 'games', gameId);
    await updateDoc(gameRef, { status });
};


// For History/Wallet page
export const listenForUserGames = (userId: string, count: number, callback: (games: Game[]) => void): (() => void) => {
    const gamesRef = collection(db, 'games');
    const q = query(
        gamesRef,
        where('playerUids', 'array-contains', userId),
        orderBy('createdAt', 'desc'),
        limit(count)
    );

    return onSnapshot(q, (snapshot) => {
        const games = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}) as Game);
        callback(games);
    });
};
