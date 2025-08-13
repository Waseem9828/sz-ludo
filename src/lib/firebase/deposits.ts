
import { 
    collection, 
    addDoc, 
    doc, 
    updateDoc, 
    serverTimestamp, 
    query, 
    onSnapshot,
    orderBy,
    where
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './config';

export interface DepositRequest {
    id: string;
    userId: string;
    userName: string;
    amount: number;
    upiId: string;
    utr: string; // UPI Transaction ID
    screenshotUrl: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: any;
}

const DEPOSITS_COLLECTION = 'deposits';

// Create a new deposit request
export const createDepositRequest = async (data: {
    userId: string;
    userName: string;
    amount: number;
    upiId: string;
    utr: string;
    screenshotFile: File;
}) => {
    // 1. Upload screenshot to Firebase Storage in a user-specific folder
    // This path is secure and matches storage.rules
    const filePath = `deposits/${data.userId}/${Date.now()}_${data.screenshotFile.name}`;
    const screenshotRef = ref(storage, filePath);
    const uploadResult = await uploadBytes(screenshotRef, data.screenshotFile);
    const screenshotUrl = await getDownloadURL(uploadResult.ref);

    // 2. Create the deposit request document in Firestore
    return await addDoc(collection(db, DEPOSITS_COLLECTION), {
        userId: data.userId,
        userName: data.userName,
        amount: data.amount,
        upiId: data.upiId,
        utr: data.utr,
        screenshotUrl: screenshotUrl,
        status: 'pending',
        createdAt: serverTimestamp(),
    });
};

// Update deposit status
export const updateDepositStatus = async (id: string, status: DepositRequest['status']) => {
    const depositRef = doc(db, DEPOSITS_COLLECTION, id);
    return await updateDoc(depositRef, { status });
}

// Listen for all deposit requests for the admin panel
export const listenForDepositRequests = (
    callback: (requests: DepositRequest[]) => void, 
    onError?: (error: Error) => void
) => {
    const q = query(collection(db, DEPOSITS_COLLECTION), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const requests: DepositRequest[] = [];
        querySnapshot.forEach((doc) => {
            requests.push({ id: doc.id, ...doc.data() } as DepositRequest);
        });
        callback(requests);
    }, (error) => {
        console.error("Error listening for deposit requests: ", error);
        if (onError) {
            onError(error);
        }
    });

    return unsubscribe;
};
