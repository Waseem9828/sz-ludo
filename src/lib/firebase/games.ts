
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
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './config';

export interface PlayerInfo {
    uid: string;
    displayName: string | null;
    photoURL: string | null;
}

export interface Game {
    id: string;
    amount: number;
    status: 'challenge' | 'ongoing' | 'under_review' | 'completed' | 'cancelled' | 'disputed';
    createdBy: PlayerInfo;
    player1: PlayerInfo;
    player2?: PlayerInfo;
    palyer2?: PlayerInfo; // Typo from previous version, keeping for compatibility if needed, but will use player2
    roomCode: string;
    createdAt: any;
    winner?: string; // winner uid
    screenshotUrl?: string;
}

const GAMES_COLLECTION = 'games';

// Create a new challenge
export const createChallenge = async (data: { amount: number; createdBy: PlayerInfo; roomCode: string; }) => {
    return await addDoc(collection(db, GAMES_COLLECTION), {
        ...data,
        player1: data.createdBy,
        status: 'challenge',
        createdAt: serverTimestamp(),
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


// Listen for real-time updates on games
export const listenForGames = (
    callback: (games: Game[]) => void, 
    onError?: (error: Error) => void
) => {
    const q = query(collection(db, GAMES_COLLECTION));
    
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
