
import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';
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

export interface GameBanners {
    classic: string[];
    popular: string[];
}

export interface ReferralSettings {
    imageUrl: string;
    shareText: string;
    howItWorksText: string;
}

export interface AppSettings {
  upiIds?: UpiId[];
  // Content Management
  termsContent?: string;
  privacyContent?: string;
  refundContent?: string;
  gstContent?: string;
  // App Settings
  promotionBannerText?: string;
  festiveGreeting?: FestiveGreeting;
  gameBanners?: GameBanners;
  referralSettings?: ReferralSettings;
}

export const getSettings = async (): Promise<AppSettings> => {
  const docRef = doc(db, SETTINGS_COLLECTION, APP_CONFIG_DOC);
  const docSnap = await getDoc(docRef);

  const defaults: AppSettings = { 
        upiIds: [],
        termsContent: '',
        privacyContent: '',
        refundContent: '',
        gstContent: '',
        promotionBannerText: 'Commission 5%: referral 2% for all games',
        festiveGreeting: {
            enabled: false,
            type: 'None',
            message: ''
        },
        gameBanners: {
            classic: [],
            popular: []
        },
        referralSettings: {
            imageUrl: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEigtvhhJRucPCHR_BWwPVLk335J3yeFT8CTExF13JYJbogG0IOrplIRwu2FzgAca1G8ssvc83saCCnC7NdVFP15FnIOppoCDc0pa31pziFzf6hGq8qCo7yZa2K9_92MtBQet6Ii0wgVFYMEyfUn8R3s6vOgo2aavCvuzdNcsYX0YizIEy9xzVB_mBt5o_4/s320/77621.png',
            shareText: "Hey! I'm playing on SZ LUDO and earning real cash. You should join too! Use my code {{referralCode}} to sign up and get a bonus. Let's play! Link: {{referralLink}}",
            howItWorksText: "You can refer and earn 2% of your referral winning, every time. Like if your player plays for ₹10000 and wins, You will get ₹200 as referral amount."
        }
    };

  if (docSnap.exists()) {
    const data = docSnap.data() as AppSettings;
    // Ensure nested objects have defaults
    const upiIds = (data.upiIds || []).map(upi => ({ name: '', currentAmount: 0, limit: 50000, ...upi }));
    const festiveGreeting = data.festiveGreeting || defaults.festiveGreeting;
    const gameBanners = data.gameBanners || defaults.gameBanners;
    const referralSettings = data.referralSettings || defaults.referralSettings;

    return { ...defaults, ...data, upiIds, festiveGreeting, gameBanners, referralSettings };
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
export const uploadBannerImage = async (file: File, gameType: 'classic' | 'popular' | 'referral'): Promise<string> => {
    const filePath = `banners/${gameType}/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, filePath);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
};

// Delete a banner image from storage
export const deleteBannerImage = async (url: string): Promise<void> => {
    const storageRef = ref(storage, url);
    await deleteObject(storageRef);
};

    

    