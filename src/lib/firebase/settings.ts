
import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from './config';

const SETTINGS_COLLECTION = 'settings';
const APP_CONFIG_DOC = 'app-config';

export interface UpiId {
    id: string;
    name: string;
    limit: number;
    currentAmount: number;
}

export type FestivalType = 'None' | 'Generic' | 'Holi' | 'Diwali' | 'Eid' | 'Christmas';

export interface FestiveGreeting {
    enabled: boolean;
    type: FestivalType;
    message: string;
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
        }
    };

  if (docSnap.exists()) {
    const data = docSnap.data() as AppSettings;
    // Ensure upiIds is always an array
    const upiIds = (data.upiIds || []).map(upi => ({ name: '', currentAmount: 0, limit: 50000, ...upi }));
    const festiveGreeting = data.festiveGreeting || defaults.festiveGreeting;
    return { ...defaults, ...data, upiIds, festiveGreeting };
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
