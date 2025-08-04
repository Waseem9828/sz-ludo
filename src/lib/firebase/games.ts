

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
    deleteField
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './config';
import { updateUserWallet } from './users';

export interface PlayerInfo {
    uid: string;
    displayName: string | null;
    photoURL: string | null;
}

export interface Game {
    id: string;
    amount: number;
    status: 'challenge' | 'ongoing' | 'under_review' | 'completed' | 'cancelled' | 'disputed';
    type?: 'user' | 'computer';
    createdBy: PlayerInfo;
    player1: PlayerInfo;
    player2?: PlayerInfo;
    roomCode?: string;
    createdAt: any;
    winner?: string; // winner uid
    screenshotUrl?: string;
    message?: string;
}

const GAMES_COLLECTION = 'games';

// Create a new challenge
export const createChallenge = async (data: { amount: number; createdBy: PlayerInfo, message?: string }) => {
    return await addDoc(collection(db, GAMES_COLLECTION), {
        ...data,
        player1: data.createdBy,
        status: 'challenge',
        type: 'user',
        createdAt: serverTimestamp(),
    });
};

// Delete a challenge
export const deleteChallenge = async (gameId: string) => {
    const gameRef = doc(db, GAMES_COLLECTION, gameId);
    
    await runTransaction(db, async (transaction) => {
        const gameSnap = await transaction.get(gameRef);
        if (!gameSnap.exists() || gameSnap.data().status !== 'challenge') {
            throw new Error("Challenge not found or can no longer be deleted.");
        }
        const gameData = gameSnap.data() as Game;
        
        // Refund the creator's wallet - this is now handled within updateUserWallet transaction logic
        await updateUserWallet(gameData.createdBy.uid, gameData.amount, 'balance', 'refund', 'Challenge Deleted');
        
        // Delete the game document
        transaction.delete(gameRef);
    });
};


// Accept a challenge
export const acceptChallenge = async (gameId: string, player2: PlayerInfo) => {
    const gameRef = doc(db, GAMES_COLLECTION, gameId);
    return await updateDoc(gameRef, {
        player2: player2,
        status: 'ongoing',
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

        // 1. Refund player 2's wallet
        await updateUserWallet(player2Id, gameData.amount, 'balance', 'refund', 'Accepted Challenge Canceled');
        
        // 2. Update the game document to revert it to a challenge
        transaction.update(gameRef, {
            status: 'challenge',
            player2: deleteField() // Remove player2 field
        });
    });
};

// Update game room code
export const updateGameRoomCode = async (gameId: string, roomCode: string) => {
    const gameRef = doc(db, GAMES_COLLECTION, gameId);
    return await updateDoc(gameRef, {
        roomCode: roomCode,
    });
};

// Update game status
export const updateGameStatus = async (gameId: string, status: Game['status'], winnerId?: string) => {
    const gameRef = doc(db, GAMES_COLLECTION, gameId);
    const updateData: { status: Game['status'], winner?: string } = { status };
    if (winnerId) {
        updateData.winner = winnerId;
    }
    return await updateDoc(gameRef, updateData);
}

// Submit game result with screenshot
export const submitGameResult = async (gameId: string, winnerId: string, screenshotFile: File) => {
    // 1. Upload screenshot to Firebase Storage
    const screenshotRef = ref(storage, `screenshots/${gameId}/${screenshotFile.name}`);
    const uploadResult = await uploadBytes(screenshotRef, screenshotFile);
    const screenshotUrl = await getDownloadURL(uploadResult.ref);

    // 2. Update the game document in Firestore
    const gameRef = doc(db, GAMES_COLLECTION, gameId);
    await updateDoc(gameRef, {
        status: 'under_review',
        winner: winnerId,
        screenshotUrl: screenshotUrl,
    });
};

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
    let q;
    if (status) {
        q = query(collection(db, GAMES_COLLECTION), where("status", "==", status), where("type", "==", "user"));
    } else {
        q = query(collection(db, GAMES_COLLECTION), where("type", "==", "user"));
    }
    
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


// Listen for real-time updates on games vs computer
export const listenForComputerGames = (
    callback: (games: Game[]) => void, 
    onError?: (error: Error) => void
) => {
    const q = query(collection(db, GAMES_COLLECTION), where("type", "==", "computer"));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const games: Game[] = [];
        querySnapshot.forEach((doc) => {
            games.push({ id: doc.id, ...doc.data() } as Game);
        });
        callback(games);
    }, (error) => {
        console.error("Error listening for computer games: ", error);
        if (onError) {
            onError(error);
        }
    });

    return unsubscribe;
};
