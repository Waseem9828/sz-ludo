
import { doc, getDoc, setDoc, updateDoc, increment, collection, query, where, getDocs, writeBatch, Timestamp } from 'firebase/firestore';
import { db, storage } from './config';
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

const SETTINGS_COLLECTION = 'settings';
const APP_CONFIG_DOC = 'app-config';

export interface UpiId {
    id: string;
    name: string;
    limit: number;
    currentAmount: number;
}

export type FestivalType = 'None' | 'Generic' | 'Holi' | 'Diwali' | 'Eid' | 'Christmas' | 'IndependenceDay';

export interface FestiveGreeting {
    enabled: boolean;
    type: FestivalType;
    message: string;
}

export interface HomePageCard {
  id: string;
  type: 'game' | 'tournament';
  enabled: boolean;
  title: string;
  description: string;
  images: string[];
  aiHint?: string;
}

export interface ReferralSettings {
    imageUrl: string;
    shareText: string;
    howItWorksText: string;
}

export interface AppSettings {
  upiIds?: UpiId[];
  appSettings?: {
      adminCommission: number; // Percentage
  }
  // Content Management
  termsContent?: string;
  privacyContent?: string;
  refundContent?: string;
  gstContent?: string;
  // App Settings
  promotionBannerText?: string;
  festiveGreeting?: FestiveGreeting;
  homePageCards: HomePageCard[];
  referralSettings?: ReferralSettings;
}

const defaultGstPolicy = `
### GST Policy for SZ Ludo

**Effective Date: [Date]**

This GST Policy outlines how Goods and Services Tax (GST) is applied to the services offered on the SZ Ludo platform.

1.  **Applicability of GST:**
    *   As per the regulations set by the Government of India, a Goods and Services Tax (GST) of 28% is applicable on all deposits made by users into their SZ Ludo wallets.
    *   This tax is levied on the amount you deposit to play games on our platform.

2.  **How GST is Calculated:**
    *   When you make a deposit, the total amount is inclusive of GST.
    *   **Example:** If you deposit ₹100, this amount is treated as the value of the service plus the applicable GST. The breakdown will be as follows:
        *   Deposited Amount (A): ₹78.12
        *   GST (28% on A): ₹21.88
        *   Total Paid by User: ₹100.00
    *   The amount of ₹78.12 will be credited to your Deposit Wallet for gameplay.

3.  **Cashback Bonus:**
    *   To support our players, SZ Ludo provides a Cashback Bonus equivalent to the GST amount paid.
    *   In the example above, you will receive a Cashback Bonus of ₹21.88.
    *   This bonus will also be added to your Deposit Wallet.
    *   Therefore, your total wallet balance after a ₹100 deposit will be ₹100 (₹78.12 Deposit + ₹21.88 Cashback).

4.  **Invoices:**
    *   SZ Ludo will maintain records of all transactions, including the GST collected. Users can request transaction details through our support channels.

5.  **Policy Changes:**
    *   SZ Ludo reserves the right to modify this GST Policy in accordance with changes in government regulations. Any changes will be updated on this page and communicated to our users.

For any questions regarding our GST policy, please contact our customer support.
`;

const defaultRefundPolicy = `
### Refund and Cancellation Policy for SZ Ludo

**Effective Date: [Date]**

This policy outlines the terms and conditions for refunds and cancellations on the SZ Ludo platform.

1.  **General Policy:**
    *   Once a user joins a battle by paying the entry fee, the fee is non-refundable. The entry fee is pooled to form the prize money for the winner.
    *   SZ Ludo is a skill-based gaming platform, and we are not responsible for losses incurred due to game outcomes.

2.  **Game Cancellation:**
    *   **User-Initiated Cancellation:** If a player cancels a game after the room code has been shared or fails to join the game room within a reasonable time, the opponent will be declared the winner, and no refund will be issued to the canceling player.
    *   **Mutual Cancellation:** If both players agree to cancel a game before a result is submitted, the entry fee will be refunded to both players' deposit wallets.
    *   **Technical Issues:** If a game is canceled due to a technical failure on the SZ Ludo platform, a full refund of the entry fee will be processed to the users' deposit wallets.

3.  **Disputed Games:**
    *   If a game result is disputed by one or both players, the game will be put "under review."
    *   Our support team will investigate the dispute by reviewing the submitted evidence (e.g., screenshots).
    *   If the dispute is found to be valid and a clear winner cannot be determined, SZ Ludo may, at its discretion, cancel the game and refund the entry fee to both players.
    *   Submitting false claims or fake screenshots will result in a penalty and may lead to account suspension, with no refund.

4.  **Deposit Refunds:**
    *   Amounts deposited into your wallet are for the sole purpose of participating in games on the platform and cannot be withdrawn or refunded.
    *   Only winnings from games can be withdrawn, subject to our withdrawal policy and KYC verification.

5.  **Processing Refunds:**
    *   All eligible refunds will be credited directly to the user's SZ Ludo deposit wallet. Refunds are typically processed within 24-48 hours after a decision is made.

For any questions or to raise a dispute, please contact our support team immediately.
`;


export const getSettings = async (): Promise<AppSettings> => {
  const docRef = doc(db, SETTINGS_COLLECTION, APP_CONFIG_DOC);
  const docSnap = await getDoc(docRef);

  const defaults: AppSettings = { 
        upiIds: [],
        appSettings: { adminCommission: 5 },
        termsContent: '',
        privacyContent: '',
        refundContent: defaultRefundPolicy,
        gstContent: defaultGstPolicy,
        promotionBannerText: 'Commission 5% for all games\nRefer and earn 2% on every win!\nJoin the new tournament now!',
        festiveGreeting: {
            enabled: false,
            type: 'None',
            message: ''
        },
        homePageCards: [
          {
            id: 'classic-ludo',
            type: 'game',
            enabled: true,
            title: 'Classic Ludo',
            description: 'Entry: ₹50 - ₹50,000',
            images: ['https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhB0r-oO8dVhvrf38QyLfm-51CbBGQpTf1vaodlbX-FTEwAoIRD1Erekk472T8ToyMbvpcYsbPk9w5p6dz9RyoSHp5ZR91ThRUe7yCebrAH445VkNJBXJXImhpJsBNpgyOXY_HUJIFErAPUQqtDyxZwoqi8zfjWYRpgeMM4U2EBOd7crErzdxFY_-KIDmw/s1600/74360.jpg'],
            aiHint: 'ludo game'
          },
          {
            id: 'popular-ludo',
            type: 'game',
            enabled: true,
            title: 'Popular Ludo',
            description: 'Entry: ₹50,000 - ₹1,00,000',
            images: ['https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhB0r-oO8dVhvrf38QyLfm-51CbBGQpTf1vaodlbX-FTEwAoIRD1Erekk472T8ToyMbvpcYsbPk9w5p6dz9RyoSHp5ZR91ThRUe7yCebrAH445VkNJBXJXImhpJsBNpgyOXY_HUJIFErAPUQqtDyxZwoqi8zfjWYRpgeMM4U2EBOd7crErzdxFY_-KIDmw/s1600/74360.jpg'],
            aiHint: 'ludo board'
          },
           {
            id: 'ludo-tournament',
            type: 'tournament',
            enabled: true,
            title: 'Ludo Tournament',
            description: 'Join the battle & win big!',
            images: ['https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjMYnl_sLxTw811HdcMKNc8yZvwKgRYyA-ksBV8El6ACH4NGWgUALgHZPLthwmji23N9jTdWdJn1xo0XKYRIIRaCj6nklevYEbRLZACYyneB-Weogz-tnIGHGJ2heKTl2LRjzhNv7w_g8YWX2HubOuP6CSlmBw0pr_TdvoFKg25ddZHgoXCa-umHp4JIMg/s1600/90758.png'],
            aiHint: 'tournament banner'
          },
          {
            id: 'mega-tournament',
            type: 'tournament',
            enabled: false,
            title: 'Mega Tournament',
            description: 'The ultimate prize awaits!',
            images: ['https://placehold.co/600x400.png'],
            aiHint: 'gold prize'
          }
        ]
    };

  if (docSnap.exists()) {
    const data = docSnap.data() as AppSettings;
    // Ensure nested objects have defaults
    const upiIds = (data.upiIds || []).map(upi => ({ name: '', currentAmount: 0, limit: 50000, ...upi }));
    const festiveGreeting = data.festiveGreeting || defaults.festiveGreeting;
    const homePageCards = data.homePageCards && data.homePageCards.length > 0 ? data.homePageCards : defaults.homePageCards;
    
    // Ensure content fields have defaults if they are empty or null
    const gstContent = data.gstContent || defaults.gstContent;
    const refundContent = data.refundContent || defaults.refundContent;

    return { ...defaults, ...data, upiIds, festiveGreeting, homePageCards, gstContent, refundContent };
  } else {
    // If the document doesn't exist, create it with default values
    await setDoc(docRef, defaults);
    return defaults;
  }
};

export const updateSettings = async (settings: Partial<AppSettings>): Promise<void> => {
  const docRef = doc(db, SETTINGS_COLLECTION, APP_CONFIG_DOC);
  await setDoc(docRef, settings, { merge: true });
};


export const getActiveUpiId = async (): Promise<UpiId | null> => {
    const settings = await getSettings();
    if (!settings.upiIds || settings.upiIds.length === 0) {
        return null;
    }

    // Find the first UPI ID that has not reached its limit
    const activeUpi = settings.upiIds.find(upi => upi.currentAmount < upi.limit);

    return activeUpi || null;
}

// Function to increment the currentAmount of a specific UPI ID
export const incrementUpiAmount = async (upiId: string, amount: number) => {
    const settings = await getSettings();
    if (!settings.upiIds) return;

    const newUpiIds = settings.upiIds.map(upi => {
        if (upi.id === upiId) {
            return {
                ...upi,
                currentAmount: upi.currentAmount + amount,
            };
        }
        return upi;
    });

    await updateSettings({ upiIds: newUpiIds });
};

// Upload a banner image to storage
export const uploadBannerImage = async (file: File, folder: 'classic' | 'popular' | 'tournaments'): Promise<string> => {
    const filePath = `banners/${folder}/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, filePath);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
};

// Delete a banner image from storage
export const deleteBannerImage = async (url: string): Promise<void> => {
    try {
        const decodedUrl = decodeURIComponent(url);
        // Extract the path from the full URL.
        // e.g., from https://firebasestorage.googleapis.com/v0/b/project-id.appspot.com/o/path%2Fto%2Fimage.jpg?alt=media&token=...
        // to path/to/image.jpg
        const pathRegex = /o\/(.*?)\?alt=media/;
        const match = decodedUrl.match(pathRegex);
        
        if (!match || !match[1]) {
            throw new Error("Could not parse Firebase Storage URL.");
        }
        
        const filePath = match[1];
        const storageRef = ref(storage, filePath);
        await deleteObject(storageRef);
    } catch (error: any) {
        if (error.code === 'storage/object-not-found') {
            console.warn(`Attempted to delete an image that doesn't exist: ${url}`);
            return;
        }
        console.error("Error deleting image: ", error);
        throw new Error("Failed to delete image from storage. Check console for details.");
    }
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
