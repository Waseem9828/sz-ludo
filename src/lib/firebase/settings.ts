
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

export const getSettings = async (): Promise<AppSettings> => {
  const docRef = doc(db, SETTINGS_COLLECTION, APP_CONFIG_DOC);
  const docSnap = await getDoc(docRef);

  const defaults: AppSettings = { 
        upiIds: [],
        appSettings: { adminCommission: 5 },
        termsContent: '',
        privacyContent: '',
        refundContent: '',
        gstContent: '',
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
            images: ['https://placehold.co/600x400.png'],
            aiHint: 'trophy prize'
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

    return { ...defaults, ...data, upiIds, festiveGreeting, homePageCards };
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
export const uploadBannerImage = async (file: File, folder: string): Promise<string> => {
    const filePath = `banners/${folder}/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, filePath);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
};

// Delete a banner image from storage
export const deleteBannerImage = async (url: string): Promise<void> => {
    try {
        const storageRef = ref(storage, url);
        await deleteObject(storageRef);
    } catch (error: any) {
        // If the object does not exist, Firebase throws an error. We can ignore it.
        if (error.code === 'storage/object-not-found') {
            console.warn(`Attempted to delete an image that doesn't exist: ${url}`);
            return;
        }
        throw error;
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

    